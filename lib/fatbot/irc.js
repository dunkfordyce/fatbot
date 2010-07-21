var events = require('events'),
    sys = require('sys'),
    net = require('net'),
    Target = require('fatbot/target').Target,
    irc_parse = require('fatbot/irc_parse'),
    server = require('fatbot/server'),
    log = require('fatbot/logging').log.Logger('irc');


function IRCConnection(options) { 
    options = options || {};
    options.hostname = options.hostname || 'localhost';
    options.port = options.port || 6667;
    options.nick = options.nick || 'fattybott';
    options.realname = options.realname || options.nick;
    options.username = options.username || options.nick;
    options.min_send_diff = options.min_send_diff || 500;

    server.Server.call(this, options);

    this.connection = null;
    this.target_handlers = {};
    this.irc_emitter = new events.EventEmitter;

    this._send_timer = null;
    this._send_buffer = [];
    this._send_last = 0;

    this.last_ping = null;
    this._ping_checker = null;

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
        log.debug('PRIVMSG ' + ev.from + ',' + sys.inspect(ev.msg) + ',' + ev.special);

        ev.target = self.get_target_handler(ev.from);
        ev.target.emit('message', ev);
        self.emit('message', ev);
    });

    this.irc_emitter.addListener('PING', function(ev) {
        // dont know what the second arg should be...
        self.send('PONG', self.options.nick);
        self.last_ping = (new Date).getTime();
    });
    this.irc_emitter.addListener('PONG', function(ev) { 
        self.last_ping = (new Date).getTime();
    });

    //var command_re = new RegExp('^'+this.nick+'[^\w]+(.*)', 'i');

    this.irc_emitter.addListener('NOTICE', function(ev) {
        log.info('NOTICE ' + ev.args.toString());
    });

    this.irc_emitter.addListener('JOIN', function(ev) { 
        log.info('JOIN ' + ev.args[0] + ',' + ev.prefix.nick +','+self.nick);
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
        log.info('PART ' + ev.args[0] + ',' + ev.prefix.nick +','+self.nick);
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
    this.irc_emitter.addListener('unknowncommand', function(ev) {
        log.warn('got unknowncommand');
    });
}

IRCConnection.prototype = server.Server.prototype;

IRCConnection.prototype.connect = function() { 
    var self = this, options = this.options;
    var buf = null;
    this.nick = options.nick;
    log.info('connecting to '+options.hostname+":"+options.port);
    this.connection = net.createConnection(options.port, options.hostname);
    this.connection.addListener('connect', function() {
        self.send("NICK", self.nick);
        self.user(options.username, options.realname);
        self.emit('connect');
    });
    this.connection.addListener('data', function(data) { 
        var message = data.toString('ascii', 0, data.length);
        if( buf !== null ) { 
            message = buf+message;
            buf = null;
        }
        var commands = message.split('\r\n');
        if( message[message.length - 1] != '\n' || message[message.length-2] != '\r' ) {
            buf = commands.pop();
        }
        for( var i=0; i!= commands.length; i++ ) { 
            if( !commands[i] ) { continue; } 
            var command = irc_parse.parse_raw_irc_command(commands[i]);
            log.debug('<-- '+
                (command.prefix ? command.prefix.full : 'nopfx')+
                ' CMD="'+command.command+'" ARGS="'+command.args+'"'
            );
            self.irc_emitter.emit(command.command, command);
        }
    });
    this.connection.addListener('error', function(err) { 
        log.error('connection error in', self);
        log.error(sys.inspect(err, true, null));
        self.disconnect(err);
    });
    this.connection.addListener('close', function() { 
        self.connection = null;
    });
    this.connection.addListener('end', function() { 
        self.disconnect();
    });

    this.last_ping = (new Date).getTime();
    this._ping_checker = setInterval(function() { 
        var now = (new Date).getTime(),
            d = now - self.last_ping;
        if( d > (8*60*1000) ) { 
            log.error('no response from server in 8 mins!');
            self.disconnect(true);       
        } else if( d > (2 * 60*1000) ) {
            self.send('PING', self.options.hostname);
        }
    }, 2*60*1000);
};

IRCConnection.prototype.disconnect = function(err) {
    log.info('disconnect', this);
    if( this._ping_checker ) { 
        clearInterval(this._ping_checker);
    }
    if( this.connection ) { 
        this.connection.end();
    }
    this.emit('disconnect', err);
};

IRCConnection.prototype.get_target_handler = function(name) { 
    if( !this.target_handlers[name] ) { 
        this.target_handlers[name] = new Target(this, name);
    }   
    return this.target_handlers[name];
};
    
IRCConnection.prototype.send = function() { 
    var args = Array.prototype.slice.call(arguments);
    var msg = args.join(" ");
    log.debug('--> '+msg);
    this._send(msg+'\r\n');
};

IRCConnection.prototype._send = function(msg) { 
    if( this.connection === null ) { 
        log.error('trying to send when there is no connection');
        return;
    }
    if( this._send_timer !== null ) {
        if( this._send_buffer.length > 100 ) {
            log.info('OOPS! more than 100 messages in send buffer - dropping messages!');
            log.info('OOPS! things might get confusing from now...');
            this._send_buffer.splice(0, 100);
        }
        this._send_buffer.push(msg);
    } else {
        var now = (new Date).getTime(),
            d = now - this._send_last;
        if( d > this.options.min_send_diff ) { 
            try { 
            this.connection.write(msg);
            } catch ( e) { 
            log.exception(e, 'sending', msg, connection.readyState);
            }
            this._send_last = now;
        } else {
            this._send_buffer.push(msg);
            this._send_loop(d);        
        }
    }
};
IRCConnection.prototype._send_loop = function(next) { 
    var self = this;
    this._send_timer = setTimeout(function() {
        self._send_last = (new Date).getTime();
        self.connection.write(self._send_buffer.shift())
        if( self._send_buffer.length ) {
            self._send_loop(self.options.min_send_diff);
        } else {
            self._send_timer = null;
        }
    }, next);
};

IRCConnection.prototype.user = function(username, realname) {
    realname = realname || username;
    this.send('USER', username, "*", "*", realname);
};

IRCConnection.prototype.privmsg = function(target, msg) {
    if( target instanceof Target ) { 
        target = target.name;
    }
    if( msg === undefined ) { 
        log.warn('got undefined msg in privmsg');
        return;
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
    if( action === undefined ) { 
        log.warn('got undefined action in action');
        return;
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
    if( msg === undefined ) { 
        log.warn('got msg action in notice');
        return;
    }
    this.send('NOTICE', target, ':'+msg);
};

exports.IRCConnection = IRCConnection;

