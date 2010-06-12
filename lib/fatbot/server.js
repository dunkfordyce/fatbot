var events = require('events'),
    sys = require('sys'),
    net = require('net'),
    room = require('fatbot/room'),
    parse = require('fatbot/parse');

var log = sys.puts;

function Server(options) { 
    events.EventEmitter(this)
    options = options || {};
    this.hostname = options.hostname || 'localhost';
    this.name = options.name || options.hostname;
    this.port = options.port || 6667;
    this.nick = options.nick || 'fattybotty';
    this.realname = options.realname || this.nick;
    this.username = options.username || this.nick;
    this.connection = null;
    this.rooms = {};

    var self = this;

    this.addListener('PRIVMSG', function(ev) {
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
        if( ev.from[0] == '#' ) { 
            var room = self.get_room(ev.from);
            room.emit('PRIVMSG', ev);
        }
    });

    this.addListener('PING', function(ev) {
        // dont know what the second arg should be...
        log('got PING sending PONG');
        self.send('PONG', 'fdircat');
    });

    this.addListener('PRIVMSG', function(ev) {
        if( ev.special == "ACTION" ) {
            if( ev.msg.indexOf('waves') != -1 ) { 
                self.privmsg(ev.from, 'see you '+ev.prefix.nick+'!');
            }
        } else if( ev.msg.indexOf('fattybotty') == 0 && ev.msg.indexOf('cookie') != -1 ) { 
            self.privmsg(ev.from, 'yum- thanks!');
        } 
    });

    this.addListener('NOTICE', function(ev) {
        log('NOTICE ' + ev.args.toString());
    });
    this.addListener('JOIN', function(ev) { 
        log('JOIN ' + ev.args[0] + ',' + ev.prefix.nick +','+self.nick);
        ev.room = self.get_room(ev.args);
        if( ev.prefix.nick == self.nick ) { 
            self.emit('IJOIN', ev);
            ev.room.emit('joined', ev);
        }
        ev.room.emit('JOIN', ev);
    });
    this.addListener('PART', function(ev) { 
        log('PART ' + ev.args[0] + ',' + ev.prefix.nick +','+self.nick);
        ev.room = self.get_room(ev.args);
        if( ev.prefix.nick == self.nick ) {
            self.emit('IPART', ev);
            ev.room.emit('parted', ev);
        }
    });
    this.addListener('namreply', function(ev) { 
        ev.room = self.get_room(ev.args[2]);
        ev.room.users = ev.args[3].split(' ');
        ev.room.emit('namreply', ev);
    });
}

Server.prototype = new events.EventEmitter;

Server.prototype.connect = function() { 
    var self = this;
    log('connecting to '+this.hostname+":"+this.port);
    this.connection = net.createConnection(this.port, this.hostname);
    this.connection.addListener('connect', function() {
        self.send("NICK", self.nick);
        self.user(self.username, self.realname);
        self.emit('connect');

        //var room = join('#kuya');
        //room.addListener('joined', function(room) { 
        //    room.privmsg('iiiiiiiiiiim baaaa-aaack! did i miss anything...?');
        //});
    });
    this.connection.addListener('data', function(data) { 
        var message = data.toString('ascii', 0, data.length - 2);
        //log('INCOMING ORIG: '+message);
        var command = parse.parse_raw_irc_command(message);
        log('<-- '+command.prefix+' CMD='+command.command+' ARGS='+command.args);
        if( command.prefix ) {
            command.prefix = parse.parse_prefix(command.prefix);
            //log('==p'+sys.inspect(command.prefix));
        }
        self.emit(command.command, command);
    });
};

Server.prototype.get_room = function(name) { 
    if( !this.rooms[name] ) { 
        this.rooms[name] = new room.Room(name, this);
    }   
    return this.rooms[name];
};

Server.prototype.send = function() { 
    var args = Array.prototype.slice.call(arguments);
    var msg = args.join(" ");
    log('--> '+msg);
    this.connection.write(msg+"\r\n");
};

Server.prototype.user = function(username, realname) {
    realname = realname || username;
    this.send('USER', username, "*", "*", realname);
};

Server.prototype.privmsg = function(to, msg) {
    this.send('PRIVMSG', to, ':'+msg);
};

var chr1 = String.fromCharCode(1);
Server.prototype.privmsg_special = function(to, action, extra) { 
    this.privmsg(to, chr1+action+(extra ? (' '+extra) : '')+chr1);
};

Server.prototype.action = function(to, action) { 
    this.privmsg_special(to, 'ACTION', action);
};

Server.prototype.join = function(room) { 
    this.send('JOIN', room);
    return this.get_room(room);
};

Server.prototype.part = function(room) { 
    this.send('PART', room);
};


exports.Server = Server;
