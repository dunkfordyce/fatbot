var events = require('events');

function Room(name, server) {
    events.EventEmitter(this);
    this.name = name;
    this.server = server;
    this.users = [];
}

Room.prototype = new events.EventEmitter;
Room.prototype.privmsg = function(msg) { 
    this.server.privmsg(this.name, msg);
}
Room.prototype.action = function(action) { 
    this.server.action(this.name, action);
}

exports.Room = Room;
