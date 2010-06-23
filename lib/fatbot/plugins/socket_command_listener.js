var sys = require('sys'),
    net = require('net'),
    log = require('fatbot/logging').log.Logger('plugins.socket_command_listener');

exports.main = function(app, options) { 
    options = options || {};
    options.port = options.port || 7776;

    app.addListener('start', function() { 
        var connection = net.createServer(function(stream) { 
            stream.setEncoding("utf8");
            stream.addListener('connect', function() {
                log.info('got server conn');
            });
            stream.addListener('close', function() {
                log.info('server con closed');
            });
            stream.addListener('data', function(data) {
                var data = data.toString('ascii', 0, data.length - 2).trim();
                if( !data ) { 
                    stream.end();
                }
                var parts = data.split(' ');
                var cmd = {
                    command: parts.shift().trim(),
                    args: (parts.join(' ') || '').trim(),
                    source: 'stream',
                    reply: function(msg) { 
                        stream.write(msg+'\n');
                    }  
                };
                app.emit('command', cmd.command, cmd);
            });
        });
        log.info('listening on '+options.port);
        connection.listen(options.port, 'localhost');
    });
};
