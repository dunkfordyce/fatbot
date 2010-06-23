var sys = require('sys'),
    log = require('fatbot/logging').log.Logger('app_autoserver');

exports.main = function(app, options) { 
    app.addListener('start', function() { 
        for( var i=0; i!= options.servers.length; i++ ) {
            log.info('auto connecting server '+options.servers[i]);
            app.connect({name: options.servers[i]});
        }; 
    });
};
