var events = require('events'),
    net = require('net'),
    sys = require('sys'),
    irc = require('fatbot/irc'),
    command_handler = require('fatbot/command_handler');

var log = sys.puts;

function App(options) { 
    events.EventEmitter(this);
    options = options || {};
    this.port = options.port || 7776;
    this.servers = {};
    this.connection = null;
    this.command_handler = new command_handler.CommandHandler();

    var self = this;

    this.addListener('command', function(cmd) { 
        self.command_handler.call(self, cmd.command, cmd);
    });

    this.command_handler.register('quit', function(cmd) { 
        process.exit();
    });
    this.command_handler.register('connect', function(cmd) { 
        self.connect(cmd);
    });
    this.command_handler.register('join', function(cmd) { 
        self.servers[cmd.server].join(cmd.target);
    });
    this.command_handler.register('part', function(cmd) { 
        self.servers[cmd.server].part(cmd.target);
    });
    this.command_handler.register('privmsg', function(cmd) { 
        self.servers[cmd.server].privmsg(cmd.target, cmd.msg);
    });
    this.command_handler.register('notify', function(cmd) { 
        self.servers[cmd.server].notify(cmd.target, cmd.msg);
    });
}

App.prototype = new events.EventEmitter;

App.prototype.start = function() { 
    log('app starting...');
    this.emit('start');
};

App.prototype.connect = function(options) { 
    var s = new irc.IRCConnection(options);
    this.servers[s.name] = s;
    this.emit('newserver', s);
    s.connect();
};

exports.App = App;
