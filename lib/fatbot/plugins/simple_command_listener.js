var sys = require('sys'),
    net = require('net');

var log = sys.log;

function SimpleCommandListener(app) { 
    var self = this;

    app.addListener('start', function() { 
        self.connection = net.createServer(function(socket) { 
            socket.setEncoding("utf8");
            socket.addListener('connect', function() {
                log('got server conn');
            });
            socket.addListener('close', function() {
                log('server con closed');
            });
            socket.addListener('data', function(data) {
                var data = data.toString('ascii', 0, data.length - 2);
                try { 
                    data = JSON.parse(data.trim());
                } catch(e) { 
                    log('ERROR: invalid JSON "'+data+'"' + e.toString());
                    return;
                }

                var command = data.command;
                delete data.command;
                app.emit('command', command, data);
            });
        });
        log('listening on '+this.port);
        self.connection.listen(this.port, 'localhost');
    });
}

exports.SimpleCommandListener = SimpleCommandListener;

exports.main = function(app) { 
    return new SimpleCommandListener(app);
};
