var sys = require('sys'),
    fs = require('fs'),
    default_args_from_string = require('fatbot/command_handler').default_args_from_string;

exports.quit = {
    func: function(args) { 
        app.stop();
    }
};
exports.connect = {
    func: function(args) { 
        args.app.connect(args);
    },
    args_from_string: function(args, strargs) {
        args.name = strargs;
    }
};
exports.join = {
    func: function(args) { 
        args.app.servers[args.server].join(args.target);
    },
    args_from_string: function(args, strargs) {
        args.target = strargs;
    }
};
exports.part = {
    func: function(args) { 
        args.app.servers[args.server].part(args.target);
    },
    args_from_string: function(args, strargs) { 
        args.target = strargs;
    }
};
exports.message = {
    needs_args: ['server', 'target'],
    func: function(args) { 
        args.app.servers[args.server].message(args.target, args.msg);
    },
    args_from_string: function(args, strargs) { 
        default_args_from_string(args, strargs);       
        args.msg = args.args;
    }
};

exports.notice = { 
    func: function(args) { 
        args.app.servers[args.server].notice(args.target, args.msg);
    },
    args_from_string: function(args, strargs) {
        var parts = strargs.split(' ');
        args.target = parts.shift();
        args.msg = parts.join(' ');
    }
};
exports.list = {
    func: function(args) { 
        args.reply( args.app.command_handler.list().join(" ") );
    }
};
exports.write_app_config = {
    func: function(args) { 
        fs.writeFile(
            args.filename,
            JSON.stringify(args.app.options, null, 4),
            function(err) { 
            }
        );
    },
    args_from_string: function(args, strargs) { 
        args.filename = strargs;
    }
};

