var sys = require('sys'),
    command_handler = require('fatbot/command_handler'),
    log = require('fatbot/logging').log.Logger('plugins.bot');

exports.main = function(app, options) { 
    app.addListener('serverconnect', function(server) { 
        server.addListener('message', function(ev) { 
            var match;
            if( !ev.special && ev.msg.indexOf(server.nick) == 0 ) { 
                var parts = ev.msg.substring(server.nick.length+1).trim().split(' ');
                var cmd = {
                    command: parts.shift().trim(),
                    args: (parts.join(' ') || '').trim(),
                    original_event: ev,
                    source: 'bot',
                    server: server.options.name,
                    target: ev.target,
                    reply: function(msg) { ev.target.message(msg); }
                }
                app.emit('command', cmd.command, cmd);
            } 
        });
    });
};

