/** SQL-like Array filtering helpers */

// namespacing!
if (!com) {
    var com = { };
}
if (!com.stamen) {
    com.stamen = {};
}
if (!com.stamen.logic) {
    com.stamen.logic = {};
}

com.stamen.logic.OR = function() {
    var theFuncs = arguments;
    return function(datum) {
        for (var i = 0; i < theFuncs.length; i++) {
            var f = theFuncs[i];
            if (f(datum)) {
                return true;
            }
        }
        return false;
    }
};

com.stamen.logic.AND = function() {
    var theFuncs = arguments;
    return function(datum) {
        for (var i = 0; i < theFuncs.length; i++) {
            var f = theFuncs[i];
            if (!f(datum)) {
                return false;
            }
        }
        return true;
    }
};

com.stamen.logic.whereIn = function (property /* String */, values /* Array */) {
    var theValues = values;
    var theProperty = property;
    return function(datum) {
        datum = datum.properties; // FIXME
        return theValues.indexOf(datum[theProperty]) >= 0;
    }
};

com.stamen.logic.whereEquals = function (property /* String */, value /* anything */) {
    var theValue = value;
    var theProperty = property;
    return function(datum) {
        datum = datum.properties; // FIXME
        return datum[theProperty] == theValue;
    }
};

com.stamen.logic.hasProperty = function (property /* String */) {
    var theProperty = property;
    return function(datum) {
        datum = datum.properties; // FIXME
        return theProperty in datum;
    }
};

com.stamen.logic.compareByCase = function(propName/*String*/, cases/*Object*/) {
    var theProperty = propName;
    var theCases = cases;
    /*  -1, if A should appear before B in the sorted sequence
     *  0, if A equals B
     *  1, if A should appear after B in the sorted sequence */
    return function(a, b) {
        a = a.properties; // FIXME
        b = b.properties; // FIXME
        if (a[theProperty] && b[theProperty]) {
            if (theCases[a[theProperty]] && theCases[b[theProperty]]) {
                return theCases[a[theProperty]] < theCases[b[theProperty]] ? -1 : theCases[a[theProperty]] > theCases[b[theProperty]] ? 1 : 0;
            }
            else if (theCases[a[theProperty]]) {
                return theCases[a[theProperty]] < theCases._default ? -1 : theCases[a[theProperty]] > theCases._default ? 1 : 0;
            }
            else if (theCases[b[theProperty]]) {
                return theCases._default < theCases[b[theProperty]] ? -1 : theCases._default > theCases[b[theProperty]] ? 1 : 0;
            }
        }
        else if (a[theProperty]) {
            return -1;
        }
        else if (b[theProperty]) {
            return 1;
        }
        return 0;
    };
};

com.stamen.logic.compareDescending = function(propName/*String*/) {
    var theProperty = propName;
    /*  -1, if A should appear before B in the sorted sequence
     *  0, if A equals B
     *  1, if A should appear after B in the sorted sequence */
    return function(b, a) { // b and a swapped for descending porpoises
        a = a.properties; // FIXME
        b = b.properties; // FIXME
        if (a[theProperty] && b[theProperty]) {
            return a[theProperty] < b[theProperty] ? -1 : a[theProperty] > b[theProperty] ? 1 : 0;
        }
        else if (a[theProperty]) {
            return -1;
        }
        else if (b[theProperty]) {
            return 1;
        }
        return 0;
    };
};
