var sys = require('sys'),
    fs = require('fs'),
    path = require('path'),
    events = require('events');

var log = sys.puts;

function Server(options) { 
    events.EventEmitter(this);
    this.options = options;
};

Server.prototype = new events.EventEmitter;
Server.prototype.toString = function() {
    return '<Server "'+this.options.name+'">';
};

exports.Server = Server;
