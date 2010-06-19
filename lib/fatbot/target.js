var sys = require('sys'),
    events = require('events');

var log = sys.puts;

function Target(server, name) {
    log('created target '+server+', '+name);
    events.EventEmitter(this);
    this.name = name;
    this.server = server;
    this.users = {};

    var self = this;

    this.addListener('joined', function(ev) { 
        if( self.users[ev.user] ) { 
            log(self.name+' trying to add already existing user '+ev.user);
        } else {
            log(self.name+' adding user '+ev.user);
            self.users[ev.user] = {};
        }
    });

    this.addListener('parted', function(ev) { 
        if( !self.users[ev.user] ) { 
            log(self.name+' trying to rmove '+ev.user+' who doesnt exist');
        } else {
            log(self.name+' removed user '+ev.user);
            delete self.users[ev.user];
        }
    });
}

Target.prototype = new events.EventEmitter;
Target.toString = function() {
    return '<Target "'+this.name+'" server='+this.server+'>';
};
Target.prototype.message = function(msg) { 
    log(this+' sending message "'+msg+'" via '+this.server);
    this.server.message(this, msg);
};
Target.prototype.action = function(action) { 
    this.server.action(this, action);
};
Target.prototype.notice = function(msg) { 
    this.server.notice(this, msg);
};
Target.prototype.add_users = function(users) { 
    for( var i=0; i!=users.length; i++ ) {
        if( this.users[users[i]] ) { 
            log(this.name+' already got user '+users[i]);
        } else {
            log(this.name+' got new user '+users[i]);
            this.users[users[i]] = {};
        }
    }
    this.emit('users-update');
};

exports.Target = Target;
