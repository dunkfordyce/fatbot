var sys = require('sys'),
    events = require('events'),
    log = require('fatbot/logging').log.Logger('plugins.helpers');


function if_got_target_options(app, options, cb) {
    app.addListener('serverconnect', function(server) { 
        var server_opts = options.servers[server.options.name];
        if( !server_opts ) { 
            //log.debug('no server opts found "'+server.options.name+'"');
            return; 
        }
        server.addListener('ijoined', function(ev) { 
            var target_opts = server_opts[ev.target.name];
            if( !target_opts ) { 
                //log.debug('no target opts found "'+ev.target.name+'"');
                return; 
            }
            cb(server, server_opts, ev.target, target_opts);
        });
    });
};

exports.if_got_target_options = if_got_target_options;
