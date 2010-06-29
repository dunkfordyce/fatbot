var sys = require('sys'),
    net = require('net'),
    log = require('fatbot/logging').log.Logger('plugins.socket_command_listener');

exports.main = function(app, options) { 
    options = options || {};
    options.port = options.port || 7776;

    app.addListener('start', function() { 
        var buf = null;
        var connection = net.createServer(function(stream) { 
            stream.setEncoding("utf8");
            stream.addListener('connect', function() {
                log.info('got server conn');
            });
            stream.addListener('close', function() {
                log.info('server con closed');
            });
            stream.addListener('data', function(data) {
                data = data.toString();
                if( buf !== null ) { 
                    data = buf+data;
                    buf = null;
                }
                var commands = data.split('\n');
                if( data[data.length-1] != '\n' ) { 
                    buf = commands.pop();
                }
                for( var i=0; i!= commands.length; i++ ) { 
                    if( !commands[i] ) { continue; }
                    var parts = commands[i].split(' ');
                    var cmd = {
                        command: parts.shift().trim(),
                        args: (parts.join(' ') || '').trim(),
                        source: 'socket',
                        reply: function(msg) { 
                            stream.write(msg+'\n');
                        }  
                    };
                    app.emit('command', cmd.command, cmd);
                }
            });
        });
        log.info('listening on '+options.port);
        connection.listen(options.port, 'localhost');
    });
};
