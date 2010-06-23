var sys = require('sys'),
    App = require('fatbot/app').App,
    logging = require('fatbot/logging'),
    log = logging.log;

if( process.argv.length < 3 ) {
    sys.puts("pass an app.json file as the argument!");
    process.exit(1)
}

// config the intervaler logger now to set a nicer level 
logging.log.Logger({name: 'intervaler', level: logging.levels.info});
// send color logging messages to the console
logging.ConsoleHandler(logging.log, logging.console_color_formatter());
// send logging messages to a log file 
logging.FileHandler(logging.log, 'output.log')

var opts_fn = process.argv[2];
var app = new App(opts_fn);
log.info('created app ok');
log.info('loading plugins...');
app.load_plugins();
log.info('all systems are go!');
app.start();
