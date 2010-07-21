var log = require('fatbot/logging').log.Logger('auth');

var _re_cache = {};

function test_config(val, items) { 
    if( !Array.isArray(items) ) { 
        items = [items];
    }
    for( var i=0; i!= items.length; i++ ) {
        if( typeof(items[i]) == 'string' ) { 
            if( val == items[i] ) { 
                return true;
            }
        } else {
            if( items[i].re ) { 
                var re = _re_cache[items[i].re];
                if( !re ) { 
                    re = _re_cache[items[i].re] = new RegExp(items[i].re);
                }
                if( re.test(val) ) { 
                    return true;
                }
            }
        }
    }
    return false;
}

exports.main = function(app, options) { 
    options = options || {};

    function validate(cmd, args) { 
        for( var i=0; i!= options.allow.length; i++ ) {
            var allow = options.allow[i];    
            if( allow.source && !test_config(args.source, allow.source ) ) { 
                log.debug(cmd, 'failed source', allow.source, args.source);
                continue;
            } else if( allow.prefix && !test_config(args.original_event.prefix.full, allow.prefix) ) { 
                log.debug(cmd, 'failed prefix', allow.prefix, args.originaly_event.prefix.full);
                continue;
            } else if( allow.server && !test_config(args.server, allow.server) ) { 
                log.debug(cmd, 'failed server', allow.server, args.server);
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
