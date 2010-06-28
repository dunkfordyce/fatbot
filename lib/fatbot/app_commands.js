var sys = require('sys'),
    fs = require('fs'),
    utils = require('fatbot/utils'),
    default_args_from_string = require('fatbot/command_handler').default_args_from_string;

exports.quit = {
    func: function(args) { 
        app.stop();
    }
};
exports.connect = {
    needs_args: [ 'name' ],
    func: function(args) { 
        args.app.connect(args);
    },
    args_from_string: function(args, strargs) {
        args.name = args.name || strargs;
        default_args_from_string(args, strargs);
    }
};
exports.disconnect = utils.extend({}, exports.connect, {
    func: function(args) { 
        args.app.get_server(args.name).disconnect();
    }
});
exports.join = {
    needs_args: [ 'server', 'target' ],
    func: function(args) { 
        args.app.get_server(args.server).join(args.target);
    },
    args_from_string: function(args, strargs) {
        default_args_from_string(args, strargs, 'target');
    }
};
exports.part = utils.extend({}, exports.join, {
    func: function(args) { 
        args.app.get_server(args.server).part(args.target);
    },
});
exports.message = {
    needs_args: ['server', 'target'],
    func: function(args) { 
        args.app.get_server(args.server).message(args.target, args.msg);
    },
    args_from_string: function(args, strargs) { 
        default_args_from_string(args, strargs, 'msg');       
    }
};

exports.notice = utils.extend({}, exports.message, { 
    func: function(args) { 
        args.app.get_server(args.server).notice(args.target, args.msg);
    },
});
exports.list = {
    func: function(args) { 
        args.reply( args.app.command_handler.list().join(" ") );
    }
};

