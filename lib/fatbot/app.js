var events = require('events'),
    fs = require('fs'),
    path = require('path'),
    net = require('net'),
    sys = require('sys'),
    irc = require('fatbot/irc'),
    command_handler = require('fatbot/command_handler'),
    utils = require('fatbot/utils'),
    tempstore = require('fatbot/tempstore'),
    log = require('fatbot/logging').log.Logger('app');


function App(options) { 
    if( typeof options == "string" ) { 
        try { 
            var data = fs.readFileSync(options);
            options = JSON.parse(data.toString());
        } catch(e) { 
            log.error('failed opening config: '+e);
            log.info('your config file probably isnt valid json - try http://www.jsonlint.com');
            process.exit(1);
        }
    }

    events.EventEmitter(this);

    var self = this;

    options = options || {};
    options.plugins = options.plugins || [];
    options.data_dir = options.data_dir || './tmp';
    path.exists(options.data_dir, function(exists) { 
        if( !exists ) { 
            log.warn('data_dir', options.data_dir, 'doesnt exist! things may fail...');
        }
    });
    options.temp_store_save_interval = options.temp_store_save_interval || (5*60*1000);
    this.options = options;

    this.plugins = {};
    this.working_dir = process.cwd();
    this.port = options.port || 7776;
    this.servers = {};
    this.connection = null;
    this.command_handler = new command_handler.CommandHandler();

    this.tempstore = new tempstore.TempStore(options.data_dir);

    this.addListener('start', function() {
        self.tempstore.save_loop_start(options.temp_store_save_interval);       
    });
    this.addListener('stop', function() { 
        self.tempstore.save_all();
    });
    this.addListener('error', function() { 
        log.info('app errorzomg!');
        self.stop();
    });

    this.addListener('command', function(command, args) { 
        args.app = self;
        var cmd = self.command_handler.get(command);
        if( !cmd ) { 
            args.reply('no such command');
            return;
        }
        try { 
            cmd.process_args(args);
        } catch(e) { 
            log.error('error in args. args:', sys.inspect(args), 'stack:', e.stack);
            log.error(e.toString());
            args.reply("error: "+e.toString());
            return;
        }

        try { 
            self.emit('precommand', cmd, args, command);
        } catch(e) { 
            log.error('error in precommand. args:', sys.inspect(args), 'stack:', e.stack);
            log.error(e.toString());
            args.reply("error: "+e.toString());
            return;
        }

        try { 
            cmd.func.call(self, args);
        } catch(e) { 
            log.error('error calling command. args:', sys.inspect(args), 'stack:', e.stack);
            log.error(e.toString());
            args.reply("error: "+e.toString());
            return;
        }
    });

    this.command_handler.register_from_module('fatbot/app_commands', {
        group: 'app'
    });
}

App.prototype = new events.EventEmitter;

App.prototype.start = function() { 
    log.info('app starting...');
    this.emit('start');
};

App.prototype.stop = function() {
    log.info('app stopping...');
    this.emit('stop');
    process.exit();
};

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
    log.info('loading plugin '+opts.name);
    var fn = opts.module;
    if( fn.indexOf('./') == 0 ) {
        log.info('...plugin needs workingdir '+this.working_dir);
        fn = path.join(this.working_dir, name.substring(2));
    }
    var plugin_module = require(fn);
    this.plugins[opts.name] = plugin_module.main(this, opts);
    log.info('plugins['+opts.name+'] = '+sys.inspect(this.plugins[opts.name]));
};

exports.App = App;
