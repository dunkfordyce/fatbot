var events = require('events'),
    fs = require('fs'),
    path = require('path'),
    net = require('net'),
    sys = require('sys'),
    irc = require('fatbot/irc'),
    command_handler = require('fatbot/command_handler'),
    utils = require('fatbot/utils'),
    tempstore = require('fatbot/tempstore');

var log = sys.log;

function App(options) { 
    if( typeof options == "string" ) { 
        var data = fs.readFileSync(options);
        options = JSON.parse(data.toString());
    }

    events.EventEmitter(this);

    var self = this;

    options = options || {};
    options.plugins = options.plugins || [];
    this.options = options;

    this.plugins = {};
    this.working_dir = process.cwd();
    this.port = options.port || 7776;
    this.servers = {};
    this.connection = null;
    this.command_handler = new command_handler.CommandHandler();

    this.tempstore = new tempstore.TempStore('./tmp');
    this.addListener('start', function() {
        self.tempstore.save_loop_start(60 * 1000);       
    });
    this.addListener('stop', function() { 
        self.tempstore.save_all();
    });
    this.addListener('error', function() { 
        log('app errorzomg!');
        self.stop();
    });

    this.addListener('command', function(command, args) { 
        args.app = self;
        var cmd = self.command_handler.get(command);
        if( !cmd ) { 
            args.reply('no such command');
            return;
        }
        cmd.process_args(args);

        try { 
            self.emit('precommand', cmd, args, command);
        } catch(e) { 
            args.reply(e.toString());
            return;
        }

        cmd.func.call(self, args);

        //log('app emitting command '+command+', '+sys.inspect(args));
        //try { 
            //self.command_handler.call(self, command, args);
        //} catch (e) { 
            //log('error: '+sys.inspect(e, true, null));
            //args.reply('i borked :(');
        //}
    });

    this.command_handler.register_from_module('fatbot/app_commands', {
        group: 'app'
    });
}

App.prototype = new events.EventEmitter;

App.prototype.start = function() { 
    log('app starting...');
    this.emit('start');
};

App.prototype.stop = function() {
    this.emit('stop');
    process.exit();
};

/*
App.prototype.get_server_config_dir = function(name) { 
    return name;
};

App.prototype.create_server_config_dir = function(name, cb) { 
    var dir = this.get_server_config_dir(name);
    path.exists(dir, function(exists) {
        if( !exists ) { 
            log('creating '+dir+' for '+name);
            fs.mkdir(dir, 0777, cb);
        } else {
            cb();
        }
    });
};

App.prototype.get_server_config_fn = function(name) { 
    return path.join(name, 'options.json');
};

App.prototype.load_server_config = function(name, cb) { 
    var config_fn = this.get_server_config_fn(name);
    path.exists(config_fn, function(exists) { 
        if( !exists ) { 
            cb(null);
        } else {
            fs.readFile(config_fn, function(err, data) { 
                if( err ) { throw err; } 
                var opts = JSON.parse(data.toString());
                cb(opts);
            });
        }
    });
};

App.prototype.write_server_config = function(server, cb) { 
    var self = this;
    this.create_server_config_dir(server.options.name, function() { 
        fs.writeFile(
            self.get_server_config_fn(server.options.name), 
            JSON.stringify(server.options, null, 4),
            function(err) { 
                cb();
            }
        );
    });
};
*/

App.prototype.connect = function(in_options) { 
    in_options.name = in_options.name || in_options.hostname;
    var options = utils.extend({}, this.options.servers[in_options.name] || {}, in_options);

    var s = this.servers[options.name] = new irc.IRCConnection(this, options);
    this.emit('newserver', s);
    s.connect();
};

App.prototype.load_plugins = function() { 
    for( var i=0; i!= this.options.plugins.length; i++ ) { 
        var plugin = this.options.plugins[i];
        if( plugin.enabled === false ) { 
            continue
        }
        this.load_plugin(plugin);
    }
};

App.prototype.load_plugin = function(opts) { 
    opts.name = opts.name || opts.module;
    log('loading plugin '+opts.name);
    var fn = opts.module;
    if( fn.indexOf('./') == 0 ) {
        log('...plugin needs workingdir '+this.working_dir);
        fn = path.join(this.working_dir, name.substring(2));
    }
    var plugin_module = require(fn);
    this.plugins[opts.name] = plugin_module.main(this, opts);
    log('plugins['+opts.name+'] = '+sys.inspect(this.plugins[opts.name]));
};

exports.App = App;
