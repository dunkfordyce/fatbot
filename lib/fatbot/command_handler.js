var sys = require('sys'),
    utils = require('fatbot/utils'),
    log = require('fatbot/logging').log.Logger('command_handler');

function CommandHandler() { 
    this.handlers = {};
}

CommandHandler.prototype.register = function(command) { 
    this.handlers[command.name] = command;
    return this.handlers[command];
};

function default_process_args(args) { 
    if( typeof args.args == 'string' && this.args_from_string ) { 
        this.args_from_string(args, args.args);
    }
    if( this.needs_args ) { 
        for( var i=0; i!= this.needs_args.length; i++ ) {
            if( !args[this.needs_args[i]] ) {
                throw this.name+" requires the argument "+this.needs_args[i];
            }
        }
    }
};

function args_from_string(args, strargs, move_rest_to) { 
    var parts = (typeof strargs == 'string') ? strargs.split(' ') : strargs;
    var unhandled_args = [];
    parts.forEach(function(part) { 
        if( !part ) { return; } 
        else if( part.length > 2 && part[0] == '-' && part[1] == '-' ) { 
            part = part.substring(2);
            part = part.split('=');
            if( part.length >= 2 ) { 
                var k = part.shift();
                args[k] = part.join('=');
                log.debug('setting', k, args[k]);
            } else { 
                args[part[0]] = !args[part[0]];
                log.debug('setting', part[0], args[part[0]]);
            }
        } else {
            unhandled_args.push(part);
        }
    });
    var rest = unhandled_args.join(' ').trim();
    if( move_rest_to ) { 
        if( rest ) { 
            args[move_rest_to] = rest;
        }
    } else { 
        args.args = rest;
    }
};

exports.args_from_string = args_from_string;
var default_args_from_string = exports.default_args_from_string = args_from_string;

var command_defaults = {
    process_args: default_process_args,
    args_from_string: default_args_from_string
};

CommandHandler.prototype.register_from = function(obj, common_opts) { 
    for( var k in obj ) {
        var cmd = utils.extend({}, command_defaults, common_opts, obj[k]);
        cmd.name = k;
        this.register(cmd);
    };
};

CommandHandler.prototype.register_from_module = function(name, common_opts, reloadable) { 
    this.register_from(require(name));
};

CommandHandler.prototype.list = function() { 
    var ret = [];
    for( var name in this.handlers ) { 
        ret.push(name);
    }
    return ret;
};

CommandHandler.prototype.get = function(command) {
    return this.handlers[command];
};

CommandHandler.prototype.call = function(self, command, args) { 
    var cmd = this.handlers[command];
    if( !cmd ) { 
        throw "command not found "+command;
    }
    if( typeof args.args == 'string' && cmd.args_from_string ) { 
        cmd.args_from_string(args, args.args);
        //log.debug('command handler modified args to '+sys.inspect(cmd));
    }
    cmd.func.call(self, args);
};

exports.CommandHandler = CommandHandler;

