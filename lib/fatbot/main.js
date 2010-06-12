var random_messages = require('fatbot/random_messages');
var App = require('fatbot/app').App;
var app = new App();

app.addListener('newserver', function(server) { 
    server.addListener('IJOIN', function(ev) { 
        ev.room.privmsg('iiiiiiiiiiim baaaa-aaack! did i miss anything...?');
        ev.room.message_sender = new random_messages.Sender(ev.room);
        ev.room.message_sender.start();
    });
});

app.start();

