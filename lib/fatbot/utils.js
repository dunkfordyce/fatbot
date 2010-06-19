exports.extend = function() { 
    if( arguments.length == 1 ) {
        return arguments[0];
    }
    var orig = arguments[0];
    for( var i=1; i!= arguments.length; i++ ) {
        for( key in arguments[i] ) { 
            orig[key] = arguments[i][key];
        }
    }
    return orig;
};
