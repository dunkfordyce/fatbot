var sys = require('sys'),
    App = require('fatbot/app').App;


if( process.argv.length < 3 ) {
    sys.puts("pass an app.json file as the argument!");
    process.exit(1)
}

var opts_fn = process.argv[2];
var app = new App(opts_fn);
app.load_plugins();
app.start();
