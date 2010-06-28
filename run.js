var sys = require('sys'),
    fs = require('fs'),
    App = require('fatbot/app').App,
    command_handler = require('fatbot/command_handler'),
    utils = require('fatbot/utils'),
    logging = require('fatbot/logging'),
    log = logging.log;

log.options.level = logging.levels.info;
var console_handler = new logging.ConsoleHandler(log, logging.console_color_formatter());

var args = {};
command_handler.args_from_string(args, process.argv.slice(2));

function show_help() { 
    sys.puts('fatbot [opts] your_config.json');
    sys.puts('  --verbose');
    sys.puts('      show debug messages');
    sys.puts('  --quiet');
    sys.puts('      dont output logging to stdout');
    sys.puts('  --logfile=FILE')
    sys.puts('      output logging to FILE');
};

if( args.help ) {
    show_help();
    process.exit(0);
}

if( !args.args ) {
    log.error('you must pass a config file!\n');
    show_help();
    process.exit(1)
}

// config the intervaler logger now to set a nicer level 
log.Logger({name: 'intervaler', level: logging.levels.info});

if( args.verbose ) { 
    log.options.level = logging.levels.debug;
}
if( args.quiet ) {
    console_handler.remove();   
}
if( args.logfile && typeof args.logfile == 'string') { 
    // send logging messages to a log file 
    var file_handler = new logging.FileHandler(log, args.logfile)
}

process.addListener('error', function(err) {
    log.exception(err, 'UNCAUGHT ERROR');
});

try { 
    var data = fs.readFileSync(args.args);
    options = JSON.parse(data.toString());
} catch(e) { 
    log.error('failed opening config: '+e);
    log.info('your config file probably isnt valid json - try http://www.jsonlint.com');
    process.exit(1);
}

var app = new App(options);
log.info('created app ok');
log.info('loading plugins...');
app.load_plugins();
log.info('all systems are go!');
app.start();

