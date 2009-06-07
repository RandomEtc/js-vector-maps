/** Closely modeled on Mapnik's terminology and the structure of its XML files */

// namespacing!
if (!com) {
    var com = { };
}
if (!com.stamen) {
    com.stamen = {};
}
if (!com.stamen.vectormap) {
    com.stamen.vectormap = {};
}

// Map...

com.stamen.vectormap.Map = function(bgColor, layers, styles) {
    this.bgColor = bgColor;
    this.layers = layers;
    this.styles = styles;
    
    this.styleHash = {};
    for (var i = 0; i < styles.length; i++) {
        var style = styles[i];
        this.styleHash[style.name] = style;
    }
};

com.stamen.vectormap.Map.prototype = {

    bgColor: null,
    layers: null,
    styles: null,
    styleHash: null,
    
    // this is the most naive implementation of a render loop I could think of
    render: function(canvas) {
        var t = new Date().getTime();
        if (console && console.log) console.log('starting rendering...');
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0,0,canvas.width,canvas.height);
        if (this.bgColor) {
            ctx.fillStyle = this.bgColor;
            ctx.beginPath();
            ctx.rect(0,0,canvas.width,canvas.height);
            ctx.closePath();
            ctx.fill();
        }
        for (var i = 0; i < this.layers.length; i++) {
            var layer = this.layers[i];
            for (var j = 0; j < layer.styleNames.length; j++) {
                var style = this.styleHash[layer.styleNames[j]];
                if (!style) continue;
                for (var k = 0; k < layer.dataSource.features.length; k++) {
                    var feature = layer.dataSource.features[k];
                    for (var l = 0; l < style.rules.length; l++) {
                        var rule = style.rules[l];
                        if (!rule.filter || rule.filter(feature)) {
                            for (var m = 0; m < rule.symbols.length; m++) {
                                var symbolizer = rule.symbols[m];
                                symbolizer.render(feature, ctx);
                            } // symbols
                        }
                    } // rules
                } // features
            } // styles
        } // layers
        if (console && console.log) console.log('done rendering... ' + (new Date().getTime() - t) + ' ms');
    }
};

// Layer...

com.stamen.vectormap.Layer = function(styleNames, dataSource) {
    this.styleNames = styleNames;
    this.dataSource = dataSource;
};

com.stamen.vectormap.Layer.prototype = {
    styleNames: null,
    dataSource: null
};

// DataSource...
// just a wrapper for a GeoJSON object at the moment
// (I imagine more complex data sources would be network aware?)

com.stamen.vectormap.DataSource = function(features) {
    this.features = features; // array of GeoJSON Features
};

com.stamen.vectormap.DataSource.prototype = {
    features: null
};

// Style...

com.stamen.vectormap.Style = function(name, rules) {
    this.name = name;
    this.rules = rules;
};

com.stamen.vectormap.Style.prototype = {
    name: null,
    rules: null
};

// Rule...
// just a wrapper around an array of symbols

com.stamen.vectormap.Rule = function(filter, symbols) {
    this.filter = filter;
    this.symbols = symbols;
};

com.stamen.vectormap.Rule.prototype = {
    filter: null,
    symbols: null
};

/////////////////////////
// SYMBOLIZERS GO HERE //
/////////////////////////

// no common base class for these yet... clearly lots of scope for that kind of thing later

// LineSymbolizer... see http://trac.mapnik.org/wiki/LineSymbolizer

com.stamen.vectormap.LineSymbolizer = function(params) {
    for (var prop in params) {
        if (prop in this) {
            this[prop] = params[prop];
        }
    }
};

com.stamen.vectormap.LineSymbolizer.prototype = {
    
    stroke: 'black',
    strokeWidth: 1.0,
    strokeOpacity: 1.0,
    strokeLineJoin: 'miter',
    strokeLineCap: 'butt',
    strokeDashArray: 'none',
    
    render: function(feature, ctx) {
        ctx.strokeStyle = this.stroke; // TODO: check what values match/are available
        ctx.lineWidth = this.strokeWidth;
        ctx.lineCap = this.strokeLineCap; // TODO: check what values match/are available
        ctx.lineJoin = this.strokeLineJoin; // TODO: check what values match/are available
        // TODO: use rgba (or similar) to apply strokeOpacity as well (in constructor)
        // TODO: implement strokeDashArray?
        if(feature.geometry.type in this.draw) {
            this.draw[feature.geometry.type](ctx, feature.geometry);
        }
    },
    
    draw: {
        "LineString": function(ctx, geometry) {
            ctx.beginPath();
            var coordinate = geometry.coordinates[0];
            ctx.moveTo(coordinate[0], coordinate[1]);
            for (var i = 1; i < geometry.coordinates.length; i++) {
                coordinate = geometry.coordinates[i];
                ctx.lineTo(coordinate[0], coordinate[1]);
            }
            ctx.stroke();        
        },
        "Polygon": function(ctx, geometry) {
            ctx.beginPath();
            var coordinates = geometry.coordinates;
            for (var i = 0; i < coordinates.length; i++) {
                ctx.moveTo(coordinates[i][0][0], coordinates[i][0][1]);
                for (var j = 1; j < coordinates[i].length; j++) {
                    ctx.lineTo(coordinates[i][j][0], coordinates[i][j][1]);
                }
            }
            ctx.closePath();
            ctx.stroke();        
        }
    }
};

// PolygonSymbolizer... see http://trac.mapnik.org/wiki/PolygonSymbolizer

com.stamen.vectormap.PolygonSymbolizer = function(params) {
    for (var prop in params) {
        if (prop in this) {
            this[prop] = params[prop];
        }
    }
};

com.stamen.vectormap.PolygonSymbolizer.prototype = {

    fill: 'grey',
    fillOpacity: 1.0,
    
    render: function(feature, ctx) {
        ctx.fillStyle = this.fill; // TODO: check that mapnik and canvas color names match?
        // TODO: use rgba (or similar) to apply fillOpacity as well (in constructor)
        if (feature.geometry.type in this.draw) {
            this.draw[feature.geometry.type](ctx, feature.geometry);
        }
    },
    
    draw: {
        "Polygon": function(ctx, geometry) {
            // TODO: how well does this actually handle holes, does it Do The Right Thing?
            ctx.beginPath();
            var coordinates = geometry.coordinates;
            for (var i = 0; i < coordinates.length; i++) {
                ctx.moveTo(coordinates[i][0][0], coordinates[i][0][1]);
                for (var j = 1; j < coordinates[i].length; j++) {
                    ctx.lineTo(coordinates[i][j][0], coordinates[i][j][1]);
                }
            }
            ctx.closePath();
            ctx.fill();        
        }
        // TODO: MultiPolygon etc.
    }
    
};

// TextSymbolizer... see http://trac.mapnik.org/wiki/TextSymbolizer

com.stamen.vectormap.TextSymbolizer = function(params) {
    for (var prop in params) {
        if (prop in this) {
            this[prop] = params[prop];
        }
    }
};

com.stamen.vectormap.TextSymbolizer.prototype = {
    
    name: "name", // query field you want to use for the label text, e.g. "street_name" 
    faceName: "Arial",
    size: 11,
    //text_ratio	?
    //wrap_width	Length before wrapping long names
    //spacing	Space between repeated labels
    //label_position_tolerance	Allow labels to be moved from their point in line placement. Integer value representing distance along a line in line placement mode, defaults to 1/2 min_distance.
    //force_odd_labels	Force an odd amount of labels to be generated. Defaults to false.
    //max_char_angle_delta	Maximum angle (in degrees) between two consecutive characters in a label allowed (to stop placing labels around sharp corners) see r365 for more info
    fill: 'black', //	Color of the text fill, e.g. #FFFFFF
    haloFill: 'white', //	Color of the text halo
    haloRadius: 2, //	Radius of the halo in whole pixels (fractional pixels are not accepted)
    //dx, dy	Displace label by fixed amount on either axis
    //avoid_edges	Boolean to avoid labeling near intersection edges
    //min_distance	Minimum distance between repeated labels such as street names or shield symbols
    //allow_overlap	Allow labels to overlap other labels
    //placement	"line" to label along lines instead of by point 

    render: function(feature, ctx) {
        ctx.fillStyle = this.fill; // TODO: check what values match/are available
        ctx.strokeStyle = this.haloFill; // TODO: turn off if strokeStyle is null/lineWidth is 0
        ctx.lineWidth = this.haloRadius*2; // TODO: check if values match
        ctx.mozTextStyle = this.size+'pt ' + this.faceName;
        ctx.textAlign = 'center';
        // TODO: halos, etc.
        if(feature.geometry.type in this.draw) {
            this.draw[feature.geometry.type](ctx, feature.geometry, feature.properties[this.name]);
        }
    },
    
    draw: {
        "LineString": function(ctx, geometry, name) {
            ctx.beginPath();
            var coordinate = geometry.coordinates[0];
            ctx.moveTo(coordinate[0], coordinate[1]);
            for (var i = 1; i < geometry.coordinates.length; i++) {
                coordinate = geometry.coordinates[i];
                ctx.lineTo(coordinate[0], coordinate[1]);
            }
            ctx.mozTextAlongPath(name, true);
            ctx.stroke();
            ctx.mozTextAlongPath(name, false);
        },
        "Polygon": function(ctx, geometry, name) {
            ctx.beginPath();
            var coordinates = geometry.coordinates;
            for (var i = 0; i < coordinates.length; i++) {
                ctx.moveTo(coordinates[i][0][0], coordinates[i][0][1]);
                for (var j = 1; j < coordinates[i].length; j++) {
                    ctx.lineTo(coordinates[i][j][0], coordinates[i][j][1]);
                }
            }
            ctx.closePath();
            ctx.mozTextAlongPath(name, true);
            ctx.stroke();
            ctx.mozTextAlongPath(name, false);
        }
    }
};