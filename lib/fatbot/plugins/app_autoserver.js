var sys = require('sys');

var log = sys.log;

exports.main = function(app, options) { 
    app.addListener('start', function() { 
        for( var i=0; i!= options.servers.length; i++ ) {
            log('auto connecting server '+options.servers[i]);
            app.connect({name: options.servers[i]});
        }; 
    });
};
