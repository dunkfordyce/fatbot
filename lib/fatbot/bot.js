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
        var match;
        if( ev.special == "ACTION" ) {
            if( ev.msg.indexOf('waves') != -1 ) { 
                ev.target.message('see you '+ev.prefix.nick+'!');
            }
        } else if( ev.msg.indexOf(server.nick) == 0 ) { 
            var parts = ev.msg.substring(server.nick.length+1).trim().split(' ');
            log('cmd parts '+sys.inspect(parts));
            ev.botcommand = parts.shift().trim();
            ev.botcommand_args = (parts.join(' ') || '').trim();
            log('emitting comand '+ev.botcommand+' '+ev.botcommand_args);
            try { 
                self.command_handler.call(this, ev.botcommand, ev);
            } catch (e) {
                ev.target.message(ev.prefix.nick+': i dont understand :/');
                log('error for command "'+ev.botcommand+'": '+e.toString());
            }
        } 
    });

    this.command_handler.register('cookie', function(ev) { 
        server.message(ev.from, ev.prefix.nick+': yum! thanks!');
    });
}

exports.Bot = Bot;


