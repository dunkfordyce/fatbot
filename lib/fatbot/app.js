var events = require('events'),
    net = require('net'),
    sys = require('sys'),
    server = require('fatbot/server');

var log = sys.puts;

function App(options) { 
    events.EventEmitter(this);
    options = options || {};
    this.port = options.port || 7776;
    this.servers = {};
    this.connection = null;
    this.command_emitter = new events.EventEmitter;

    var self = this;

    this.addListener('command', function(socket, cmd) { 
        self.command_emitter.emit(cmd.command, cmd);
    });

    this.command_emitter.addListener('quit', function(cmd) { 
        process.exit();
    });
    this.command_emitter.addListener('connect', function(cmd) { 
        self.connect(cmd);
    });
    this.command_emitter.addListener('join', function(cmd) { 
        self.servers[cmd.server].join(cmd.target);
    });
    this.command_emitter.addListener('part', function(cmd) { 
        self.servers[cmd.server].part(cmd.target);
    });
    this.command_emitter.addListener('privmsg', function(cmd) { 
        self.servers[cmd.server].privmsg(cmd.target, cmd.msg);
    });
    this.command_emitter.addListener('notify', function(cmd) { 
        self.servers[cmd.server].notify(cmd.target, cmd.msg);
    });
}

App.prototype = new events.EventEmitter;

App.prototype.start = function() { 
    log('app starting...');
    var self = this;
    this.connection = net.createServer(function(socket) { 
        socket.setEncoding("utf8");
        socket.addListener('connect', function() {
            log('got server conn');
        });
        socket.addListener('close', function() {
            log('server con closed');
        });
        socket.addListener('data', function(data) {
            var data = data.toString('ascii', 0, data.length - 2);
            try { 
                data = JSON.parse(data.trim());
            } catch(e) { 
                log('ERROR: invalid JSON "'+data+'"' + e.toString());
                return;
            }

            self.emit('command', socket, data);

        });
    });
    log('listening on '+this.port);
    this.connection.listen(this.port, 'localhost');
};

App.prototype.connect = function(options) { 
    var s = new server.Server(options);
    this.servers[s.name] = s;
    this.emit('newserver', s);
    s.connect();
};

exports.App = App;
