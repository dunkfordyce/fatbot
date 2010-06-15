var fs = require('fs'),
    sys = require('sys');

var log = sys.puts;

function getRandomInt(min, max)  {  
    return Math.floor(Math.random() * (max - min + 1)) + min;  
}  
var messages = [
    'thinks he is better than fatbot',
    'thinks javascript > java'
];
function load_messages(fn) { 
    messages = fs.readFileSync(fn).trim().split('\n');
    log('messages: '+messages.join('\n'));
}


function Sender(target) { 
    this.target = target;
    this.timer = null;
    this.last_message_index = null;
    var self = this;
    target.addListener('parted', function(ev) { 
        self.stop();
    });
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
    var next = getRandomInt(1200*1000, 2400*1000);
    log('next random in '+(next/1000)+'s');
    var self = this;
    this.timer = setTimeout(function() { 
        self.send();
        self.loop();
    }, next);
};

Sender.prototype.send = function() { 
    var idx = this.last_message_index;
    while( idx === this.last_message_index ) { 
        idx = getRandomInt(0, messages.length-1);
    }
    this.target.action(messages[idx]);
    this.last_message_index = idx;
};

load_messages('./messages.txt');
exports.Sender = Sender;

