var fs = require('fs'),
    sys = require('sys'),
    net = require('net'),
    server = require('./server');

var log = sys.puts;

var s = new server.Server('freenode', {
    hostname: 'irc.freenode.net',
});

s.connect();
s.addListener('connect', function() { 
    var room = s.join('#kuya');
});

s.addListener('IJOIN', function(ev) { 
    ev.room.privmsg('iiiiiiiiiiim baaaa-aaack! did i miss anything...?');
    random_action_loop(ev.room);
});

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
var last_random_idx = null;
function send_random_action(room) { 
    var idx = last_random_idx;
    while( idx === last_random_idx ) { 
        idx = getRandomInt(0, messages.length-1);
    }

    log('sending random action '+idx+','+messages.length);
    room.action(messages[idx]);

    last_random_idx = idx;
}
function random_action_loop(room) {
    var next = getRandomInt(10*1000, 20*1000);
    log('next random in '+(next/1000)+'s');
    setTimeout(function() { 
        send_random_action(room);
        random_action_loop(room);
    }, next);
}
load_messages('./messages.txt');

var server = net.createServer(function(socket) { 
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
        switch( data.command ) {
            case 'join': 
                s.join(data.room); 
                break;
            case 'part': 
                s.part(data.room); 
                break;
            case 'msg': 
                s.privmsg(data.room, data.msg); 
                break;
            case 'notify': 
                s.notify(data.room, data.msg);
                break;
            default:
                log('unknown command '+data.command);
        }
    });
});
server.listen(7776, 'localhost');
