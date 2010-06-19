var sys = require('sys'),
    command_handler = require('fatbot/command_handler');

var log = sys.puts;

function Bot(server) { 
    var self = this;

    this.server = server;
    this.command_handler = new command_handler.CommandHandler();

    server.addListener('ijoined', function(ev) { 
        ev.target.message('iiiiiiiiiiim baaaa-aaack! did i miss anything...?');
    });

    server.addListener('message', function(ev) { 
        log('got message', sys.inspect(ev));
        var match;
        if( ev.special == "ACTION" ) {
            if( ev.msg.indexOf('waves') != -1 ) { 
                ev.target.message('see you '+ev.prefix.nick+'!');
            }
        } else if( ev.msg.indexOf(server.nick) == 0 ) { 
            var parts = ev.msg.substring(server.nick.length+1).trim().split(' ');
            var cmd = {
                command: parts.shift().trim(),
                args: (parts.join(' ') || '').trim(),
                original_event: ev,
                source: 'bot',
                server: server.options.name,
                reply: function(msg) { ev.target.message(msg); }
            }
            log('bot emitting command '+sys.inspect(cmd));
            server.app.emit('command', cmd.command, cmd);
        } 
    });
}

exports.Bot = Bot;

exports.main = function(app, options) { 
    app.addListener('newserver', function(server) { 
        var bot = new Bot(server);
    });
};

