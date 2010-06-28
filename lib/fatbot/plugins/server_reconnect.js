var log = require('fatbot/logging').log;

exports.main = function(app, options) { 

    options = options || {};
    options.after = options.after || (30 * 1000);

    app.addListener('serverdisconnect', function(server, error) { 
        if( error ) { 
            var old_opts = server.options;
            log.info('restarting', server.name, 'in', options.after);
            setTimeout(function() { 
                app.connect(old_opts);
            }, options.after);
        }
    });

};
