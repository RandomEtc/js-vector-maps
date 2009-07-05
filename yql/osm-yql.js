/** Make GeoJSON-esque objects from an E4X */

// Keys for Area tags
// TODO: can we use http://svn.openstreetmap.org/applications/utils/export/osm2pgsql/default.style here?
var POLYGON_TAGS = {
    'aeroway': true,
    'amenity': true,
    'area': true,
    'building': true,
    'landuse': true,
    'leisure': true,
    'man_made': true,
    'military': true,
    'natural': true,
    'power': true,
    'sport': true,
    'tourism': true,
    'waterway': true
}


// OSM...

var OSM = function(xml) {

    y.log('initing OSM object...');
    //var t = new Date().getTime();

    this.nodes = [];
    this.ways = [];
    this.areas = [];
    
    var boundsXML = xml.bounds[0];
    
    // 0.6 only
    this.bounds = {
        minLat: parseFloat(boundsXML.@minlat),
        minLon: parseFloat(boundsXML.@minlon),
        maxLat: parseFloat(boundsXML.@maxlat),
        maxLon: parseFloat(boundsXML.@maxlon)
    };

    y.log('got bounds ' + this.bounds);
    
    // so we only have to loop over the xml nodes once
    // (for when we're parsing node refs in ways)
    // we'll make a hash of id --> node 
    var nodeHash = {};

    for each (var nodeXML in xml.node) {
        var id = nodeXML.@id.toString();
        var coordinates = [ parseFloat(nodeXML.@lon.toString()),
                            parseFloat(nodeXML.@lat.toString()) ];
        var properties = {};
        for each (var tagXML in nodeXML.tag) {
            var key = tagXML.@k.toString();
            var value = tagXML.@v.toString();
            properties[key] = value;
        }
        var node = new Node(id, properties, coordinates);
        this.nodes.push(node);
        // remember for later
        nodeHash[id] = node;
    }    

    y.log('got ' + this.nodes.length + ' nodes');

    for each (var wayXML in xml.way) {

        var coordinates = [];
        for each (var ndXML in wayXML.nd) {
            var ref = ndXML.@ref.toString();
            var theNode = nodeHash[ref];
            if (theNode) {
                coordinates.push(theNode.geometry.coordinates);
            }
            else {
                y.log('node ref ' + ref + ' not found');            
            }
        }

        var properties = {};
        for each (var tagXML in wayXML.tag) {
            var key = tagXML.@k.toString();
            var value = tagXML.@v.toString();
            properties[key] = value;
        }
        
        var id = wayXML.@id.toString();

        var way = new Way(id, properties, coordinates);
        
        if (way.geometry.type == "Polygon") {
            this.areas.push(way);
        }
        else {
            this.ways.push(way);
        }

    } // for each way
    
    y.log('got ' + this.ways.length + ' ways');
    y.log('got ' + this.areas.length + ' areas');    

    //y.log('done initing OSM object... ' + (new Date().getTime() - t) + ' ms');

};

OSM.prototype = {

    bounds: null,

    nodes: null,
    ways: null,
    areas: null
    
    // TODO: relations?
			
};

// Nodes...

var Node = function(id, properties, coordinates) {
    this.id = id;
    this.properties = properties;
    this.geometry = {
        "type": "Point",
        "coordinates": coordinates
    };
}

Node.prototype = {
    "id": null,
    "type": "Feature",
    "properties": null,
    "geometry": null
}

// Ways...

var Way = function(id, properties, coordinates) {

    this.id = id;
    this.properties = properties;

    var isArea = false;
    for (var key in properties) {
        if (POLYGON_TAGS[key]) {
            isArea = true;
        }
    }

    if (isArea) {
        this.geometry = {
            "type": "Polygon",
            "coordinates": [ coordinates ]
        };
    }
    else {
        this.geometry = {
            "type": "LineString",
            "coordinates": coordinates
        };
    }    
}

Way.prototype = {
    "id": null,
    "type": "Feature",
    "properties": null,
    "geometry": null
}

