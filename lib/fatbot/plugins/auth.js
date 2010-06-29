var log = require('fatbot/logging').log.Logger('auth');

function test_config(val, items) { 
    if( !Array.isArray(items) ) { 
        items = [items];
    }
    for( var i=0; i!= items.length; i++ ) {
        if( val == items[i] ) { 
            return true;
        }
    }
    return false;
}

exports.main = function(app, options) { 
    options = options || {};

    function validate(cmd, args) { 
        for( var i=0; i!= options.allow.length; i++ ) {
            var allow = options.allow[i];    
            if( allow.source && allow.source != args.source ) { 
                continue;
            } else if( allow.prefix && !test_config(args.original_event.prefix.full, allow.prefix) ) { 
                continue;
            } else if( allow.server && !test_config(args.server, allow.server) ) { 
                continue;
            } else if( allow.target && !test_config(args.target.name, allow.target) ) { 
                continue;
            } else if( allow.command && !test_config(cmd, allow.command) ) { 
                continue;
            }
            return true;
        }
        return false;
    }
    app.addListener('precommand', function(cmd, args) { 
        if( !validate(cmd, args) ) { 
            throw "dont want to";
        }
    });
};
