var events = require('events'),
    sys = require('sys'),
    net = require('net'),
    Target = require('fatbot/target').Target,
    parse = require('fatbot/parse');

var log = sys.puts;

function IRCConnection(options) { 
    events.EventEmitter(this)
    options = options || {};
    this.hostname = options.hostname || 'localhost';
    this.name = options.name || options.hostname;
    this.port = options.port || 6667;
    this.nick = options.nick || 'fattybotty';
    this.realname = options.realname || this.nick;
    this.username = options.username || this.nick;
    this.connection = null;
    this.target_handlers = {};
    this.irc_emitter = new events.EventEmitter;

    var self = this;

    this.irc_emitter.addListener('PRIVMSG', function(ev) {
        ev.from = ev.args[0];
        ev.msg = ev.args[1];
        if( ev.msg.charCodeAt(0) == 1 ) { 
            ev.msg = ev.msg.substring(1, ev.msg.length-1);
            ev.msg = ev.msg.split(' ', 2);
            ev.special = ev.msg[0];
            ev.msg = ev.msg[1] || '';
        } else {
            ev.special = false;
        }
        log('PRIVMSG ' + ev.from + ',' + sys.inspect(ev.msg) + ',' + ev.special);

        ev.target = self.get_target_handler(ev.from);
        ev.target.emit('message', ev);
        self.emit('message', ev);
    });

    this.irc_emitter.addListener('PING', function(ev) {
        // dont know what the second arg should be...
        log('got PING sending PONG');
        self.send('PONG', 'fdircat');
    });

    //var command_re = new RegExp('^'+this.nick+'[^\w]+(.*)', 'i');

    this.irc_emitter.addListener('NOTICE', function(ev) {
        log('NOTICE ' + ev.args.toString());
    });

    this.irc_emitter.addListener('JOIN', function(ev) { 
        log('JOIN ' + ev.args[0] + ',' + ev.prefix.nick +','+self.nick);
        ev.target = self.get_target_handler(ev.args);
        ev.user = ev.prefix.nick;
        if( ev.prefix.nick == self.nick ) { 
            self.emit('ijoined', ev);
            ev.target.emit('ijoined', ev);
        }
        ev.target.emit('joined', ev);
        self.emit('joined', ev);
    });
    this.irc_emitter.addListener('PART', function(ev) { 
        log('PART ' + ev.args[0] + ',' + ev.prefix.nick +','+self.nick);
        ev.target = self.get_target_handler(ev.args);
        ev.user = ev.prefix.nick;
        if( ev.prefix.nick == self.nick ) {
            self.emit('iparted', ev);
            ev.target.emit('iparted', ev);
        }
        ev.target.emit('parted', ev);
        self.emit('parted', ev);
    
    });
    this.irc_emitter.addListener('namreply', function(ev) { 
        ev.target = self.get_target_handler(ev.args[2]);
        ev.target.add_users(ev.args[3].split(' '));
    });
}

IRCConnection.prototype = new events.EventEmitter;

IRCConnection.prototype.connect = function() { 
    var self = this;
    var buf = null;
    log('connecting to '+this.hostname+":"+this.port);
    this.connection = net.createConnection(this.port, this.hostname);
    this.connection.addListener('connect', function() {
        self.emit('connect');
        self.send("NICK", self.nick);
        self.user(self.username, self.realname);
    });
    this.connection.addListener('data', function(data) { 
        var message = data.toString('ascii', 0, data.length);
        if( buf !== null ) { 
            message = buf+message;
            buf = null;
        }
        //log('[[[full output "'+message+'"]]]');
        var commands = message.split('\r\n');
        if( message[message.length - 1] != '\n' || message[message.length-2] != '\r' ) {
            buf = commands.pop();
        }
        for( var i=0; i!= commands.length; i++ ) { 
            if( !commands[i] ) { continue; } 
            var command = parse.parse_raw_irc_command(commands[i]);
            log('<-- '+
                (command.prefix ? command.prefix.full : 'nopfx')+
                ' CMD="'+command.command+'" ARGS="'+command.args+'"'
            );
            self.irc_emitter.emit(command.command, command);
        }
    });
};

IRCConnection.prototype.get_target_handler = function(name) { 
    if( !this.target_handlers[name] ) { 
        log('~~~ creating target "'+name+'"');
        this.target_handlers[name] = new Target(name, this);
    }   
    return this.target_handlers[name];
};
    
    IRCConnection.prototype.send = function() { 
    var args = Array.prototype.slice.call(arguments);
    var msg = args.join(" ");
    log('--> '+msg);
    this.connection.write(msg+"\r\n");
};

IRCConnection.prototype.user = function(username, realname) {
    realname = realname || username;
    this.send('USER', username, "*", "*", realname);
};

IRCConnection.prototype.privmsg = function(target, msg) {
    if( target instanceof Target ) { 
        target = target.name;
    }
    this.send('PRIVMSG', target, ':'+msg);
};
IRCConnection.prototype.message = IRCConnection.prototype.privmsg;

const chr1 = String.fromCharCode(1);
IRCConnection.prototype.privmsg_special = function(target, action, extra) { 
    if( target instanceof Target ) { 
        target = target.name;
    }
    this.privmsg(target, chr1+action+(extra ? (' '+extra) : '')+chr1);
};

IRCConnection.prototype.action = function(to, action) { 
    if( to instanceof Target ) { 
        to = to.name;
    }
    this.privmsg_special(to, 'ACTION', action);
};

IRCConnection.prototype.join = function(target) { 
    if( target instanceof Target ) { 
        target = target.name;
    }
    this.send('JOIN', target);
};

IRCConnection.prototype.part = function(target) { 
    if( target instanceof Target ) { 
        target = target.name;
    }   
    this.send('PART', target);
};

IRCConnection.prototype.notice = function(target, msg) { 
    if( target instanceof Target ) { 
        target = target.name;
    }
    this.send('NOTICE', target, ':'+msg);
};

exports.IRCConnection = IRCConnection;

