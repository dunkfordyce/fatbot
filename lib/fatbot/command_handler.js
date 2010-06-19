var sys = require('sys'),
    utils = require('fatbot/utils');

var log = sys.log;

function CommandHandler() { 
    this.handlers = {};
}

CommandHandler.prototype.register = function(command) { 
    this.handlers[command.name] = command;
    return this.handlers[command];
};

function process_args(args) { 
    if( typeof args.args == 'string' && this.args_from_string ) { 
        this.args_from_string(args, args.args);
    }
};

CommandHandler.prototype.register_from = function(obj, common_opts) { 
    for( var k in obj ) {
        var cmd = utils.extend({process_args: process_args}, common_opts, obj[k]);
        cmd.name = k;
        this.register(cmd);
    };
};

CommandHandler.prototype.register_from_module = function(name, common_opts) { 
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
        //log('command handler modified args to '+sys.inspect(cmd));
    }
    cmd.func.call(self, args);
};

exports.CommandHandler = CommandHandler;
