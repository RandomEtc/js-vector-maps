/** Make GeoJSON-esque objects from a XMLHTTPRequest.responseXML blob */

// namespacing!
if (!com) {
    var com = { };
}
if (!com.stamen) {
    com.stamen = {};
}
if (!com.stamen.osm) {
    com.stamen.osm = {};
}

// Keys for Area tags
com.stamen.osm.POLYGON_TAGS = {
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
    'tourism': true
}


// OSM...

com.stamen.osm.OSM = function(responseXML) {

    if (window.console && window.console.log) console.log('initing OSM object...');
    var t = new Date().getTime();

    this.nodes = [];
    this.ways = [];
    this.areas = [];
    
    var boundsXML = responseXML.getElementsByTagName("bounds")[0];
    
    // 0.6 only
    this.bounds = {
        minLat: parseFloat(boundsXML.attributes.getNamedItem('minlat').value),
        minLon: parseFloat(boundsXML.attributes.getNamedItem('minlon').value),
        maxLat: parseFloat(boundsXML.attributes.getNamedItem('maxlat').value),
        maxLon: parseFloat(boundsXML.attributes.getNamedItem('maxlon').value)
    };

    if (window.console && window.console.log) console.log('got bounds ' + this.bounds);
    
    // so we only have to loop over the xml nodes once
    // (for when we're parsing node refs in ways)
    // we'll make a hash of id --> node 
    var nodeHash = {};

    var nodeXMLs = responseXML.getElementsByTagName("node");
    for (var i = 0; i < nodeXMLs.length; i++) {
        var nodeXML = nodeXMLs[i];
        var id = nodeXML.attributes.getNamedItem('id').value;
        var coordinates = [ parseFloat(nodeXML.attributes.getNamedItem('lon').value), 
                            parseFloat(nodeXML.attributes.getNamedItem('lat').value) ];
        var properties = {};
        var tagXMLs = nodeXML.getElementsByTagName("tag");
        for (var j = 0; j < tagXMLs.length; j++) {
            var tagXML = tagXMLs[j];
            var key = tagXML.attributes.getNamedItem('k').value;
            var value = tagXML.attributes.getNamedItem('v').value;
            properties[key] = value;
        }
        var node = new com.stamen.osm.Node(id, properties, coordinates);
        this.nodes.push(node);
        // remember for later
        nodeHash[id] = node;
    }    

    if (window.console && window.console.log) console.log('got ' + this.nodes.length + ' nodes');

    var wayXMLs = responseXML.getElementsByTagName("way");
    for (var i = 0; i < wayXMLs.length; i++) {
        var wayXML = wayXMLs[i];

        var coordinates = [];
        var ndXMLs = wayXML.getElementsByTagName("nd");
        for (var j = 0; j < ndXMLs.length; j++) {
            var ndXML = ndXMLs[j];
            var ref = ndXML.attributes.getNamedItem('ref').value;
            var theNode = nodeHash[ref];
            if (theNode) {
                coordinates.push(theNode.geometry.coordinates);
            }
            else {
                if (window.console && window.console.log) console.log('node ref ' + ref + ' not found');            
            }
        }

        var properties = {};
        var tagXMLs = wayXML.getElementsByTagName("tag");
        for (var j = 0; j < tagXMLs.length; j++) {
            var tagXML = tagXMLs[j];
            var key = tagXML.attributes.getNamedItem('k').value;
            var value = tagXML.attributes.getNamedItem('v').value;
            properties[key] = value;
        }
        
        var id = wayXML.attributes.getNamedItem('id').value;

        var way = new com.stamen.osm.Way(id, properties, coordinates);
        
        if (way.geometry.type == "Polygon") {
            this.areas.push(way);
        }
        else {
            this.ways.push(way);
        }

    } // for each way
    
    if (window.console && window.console.log) console.log('got ' + this.ways.length + ' ways');
    if (window.console && window.console.log) console.log('got ' + this.areas.length + ' areas');    

    if (window.console && window.console.log) console.log('done initing OSM object... ' + (new Date().getTime() - t) + ' ms');

};

com.stamen.osm.OSM.prototype = {

    bounds: null,

    nodes: null,
    ways: null,
    areas: null
    
    // TODO: relations?
			
};

// Nodes...

com.stamen.osm.Node = function(id, properties, coordinates) {
    this.id = id;
    this.properties = properties;
    this.geometry = {
        "type": "Point",
        "coordinates": coordinates
    };
}

com.stamen.osm.Node.prototype = {
    "id": null,
    "type": "Feature",
    "properties": null,
    "geometry": null
}

// Ways...

com.stamen.osm.Way = function(id, properties, coordinates) {

    this.id = id;
    this.properties = properties;

    var isArea = false;
    for (var key in properties) {
        if (com.stamen.osm.POLYGON_TAGS[key]) {
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

com.stamen.osm.Way.prototype = {
    "id": null,
    "type": "Feature",
    "properties": null,
    "geometry": null
}
