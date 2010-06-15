var random_messages = require('fatbot/random_messages'),
    tweets = require('fatbot/tweets'),
    bot = require('fatbot/bot'),
    SimpleCommandListener = require('fatbot/simple_command_listener').SimpleCommandListener,
    App = require('fatbot/app').App;

var app = new App();
var simple_command_listener = new SimpleCommandListener(app);

app.addListener('newserver', function(server) { 
    var serverbot = new bot.Bot(server);   

    server.addListener('ijoined', function(ev) { 
        if( ev.target === undefined ) { 
            log('ERROR - ijoined with undefined target!');
            return;
        }
        var sender = new random_messages.Sender(ev.target);
        sender.start();
        var t = new tweets.Tweeter(ev.target, "fatbot");
        t.start();
    });
});

app.start();

