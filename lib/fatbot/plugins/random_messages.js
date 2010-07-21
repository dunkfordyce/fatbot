var fs = require('fs'),
    sys = require('sys'),
    utils = require('fatbot/utils'),
    log = require('fatbot/logging').log.Logger('rndmsg');

function getRandomInt(min, max)  {  
    return Math.floor(Math.random() * (max - min + 1)) + min;  
}  


function Sender(target, messages_fn, min_time, max_time) { 
    this.target = target;
    this.messages_fn = null;
    this.messages = [];

    this.load_messages(messages_fn);

    this.min_time = min_time;
    this.max_time = max_time;

    this.timer = null;
    this.last_message_index = null;
    var self = this;
    target.addListener('parted', function(ev) { 
        self.stop();
    });
};

Sender.prototype.load_messages = function(fn) { 
    if( this.messages_fn !== null ) { 
        fs.unwatchFile(this.messages_fn);
    }
    var that = this;
    function read_messages() { 
        fs.readFile(fn, function(err, data) { 
            if( err ) { 
                log.error(err); 
            } else { 
                that.messages = data.toString().trim().split('\n');
                log.debug('messages', that.messages.join('\n'));
            }
        });
    }
    fs.watchFile(fn, function (curr, prev) {
        read_messages();
    });
    read_messages();
};

Sender.prototype.start = function() { 
    this.loop();
};
Sender.prototype.stop = function() { 
    if( this.timer !== null ) { 
        clearTimeout(this.timer);
    }
};
Sender.prototype.loop = function() { 
    var next = getRandomInt(this.min_time, this.max_time);
    log.debug('next random in '+(next)+'s');
    var self = this;
    this.timer = setTimeout(function() { 
        self.send();
        self.loop();
    }, next*1000);
};

Sender.prototype.send = function() { 
    if( !this.messages.length ) { return; }
    var idx = this.last_message_index;
    while( idx === this.last_message_index ) { 
        idx = getRandomInt(0, this.messages.length-1);
    }
    this.target.action(this.messages[idx]);
    this.last_message_index = idx;
};

exports.Sender = Sender;

exports.main = function(app, options) { 
    var defaults = {
        min_time: 1200,
        max_time: 2400
    }
    var opts = utils.extend({}, defaults, options);

    app.addListener('serverconnect', function(server) { 
        server.addListener('ijoined', function(ev) { 
            log.debug('creating message sender');
            var sender = new Sender(
                ev.target, 
                options.file, 
                options.min_time, 
                options.max_time
            );
            sender.start();
        });
    });
};
