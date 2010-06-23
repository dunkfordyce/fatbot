var log = require('fatbot/logging').log.Logger('auth');

exports.main = function(app, options) { 
    function validate(cmd, args) { 
        if( args.source == "bot" ) { 
            var server_opts = options.servers[args.server];
            if( !server_opts ) { return false; }
            if( server_opts.allowed.indexOf(args.original_event.prefix.full) != -1 ) {
                return true;
            }
            return false;
        }
        return true;
    }
    app.addListener('precommand', function(cmd, args) { 
        if( !validate(cmd, args) ) { 
            throw "dont want to";
        }
    });
};
