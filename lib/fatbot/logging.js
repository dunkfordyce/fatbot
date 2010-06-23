var sys = require('sys'),
    fs = require('fs'),
    events = require('events');

var levels = exports.levels = {
    debug: 10, 
    info: 100,
    warn: 200,
    error: 300
};
var inverse_levels = { };
for( var k in levels ) { inverse_levels[levels[k]] = k; }

var logger_c = 0;

function Logger(options) {
    events.EventEmitter.call(this);
    // now done in Logger.prototype.Logger
    //if( typeof options == 'string' ) { 
    //    options = {name: options};
    //}
    options.name = options.name || "logger"+(logger_c++);
    options.level = options.level || levels.debug;
    this.options = options;
    this.children = {};
}

Logger.prototype.__proto__ = events.EventEmitter.prototype;

Logger.prototype.log = function(level) {
    if( level >= this.options.level ) { 
        var msg = {
            level: level,
            msg: arguments.length <= 2 ? arguments[1] : Array.prototype.slice.call(arguments, 1).join(' '),
            logger: this,
            time: new Date
        };
        this.emit('item', msg);
    }
};

function make_level(level_name, level) { 
    Logger.prototype[level_name] = function() { 
        if( arguments.length < 3 ) { 
            this.log(level, arguments[0], arguments[1])
        } else {
            var args = Array.prototype.slice.call(arguments);
            args.unshift(level);
            this.log.apply(this, args);
        }
    };
}

for( var level_name in levels ) { 
    var level = levels[level_name];
    make_level(level_name, level);
}

Logger.prototype.Logger = function(options) { 
    var logger;
    if( typeof options == 'string' ) { 
        if( (logger = this.children[options]) ) { return logger; }
        options = {name: options};
    } else {
        if( (logger = this.children[options.name]) ) { return logger; } 
    }

    logger = new Logger(options);
    var self = this;
    this.children[logger.options.name] = logger;
    logger.addListener('item', function(msg) { 
        if( msg.level >= self.options.level ) { 
            self.emit('item', msg);
        };
    });
    return logger;
};

exports.log = new Logger({name: ''});

function format_date(d) { 
    var month = d.getMonth()+1,
        day = d.getDate(),
        hours = d.getHours(),
        mins = d.getMinutes(),
        secs = d.getSeconds();

    return [d.getFullYear(),
            month < 10 ? '0'+month : month,
            day < 10 ? '0'+day : day,
            hours < 10 ? '0'+hours : hours,
            mins < 10 ? '0'+mins : mins, 
            secs < 10 ? '0'+secs : secs
            ].join('-');
}

function default_formatter(msg) { 
    return ([
        '[',
        format_date(msg.time), 
        inverse_levels[msg.level].toUpperCase(),
        msg.logger.options.name,
        ']',
        msg.msg
    ]).join(' ');
}

exports.default_formatter = default_formatter;

var default_colors = {};
default_colors[levels.debug] = '\x1B[0;36m';
default_colors[levels.info] = '\x1B[0;32m';
default_colors[levels.warn] = '\x1B[0;33m';
default_colors[levels.error] = '\x1B[0;31m';

function console_color_formatter(formatter, colors) { 
    formatter = formatter || default_formatter;
    colors = colors || default_colors;
    return function(msg) { 
        return colors[msg.level]+formatter(msg)+'\x1B[0;0m';
    };
}

exports.console_color_formatter = console_color_formatter;

function ConsoleHandler(logger, formatter) { 
    formatter = formatter || default_formatter;

    logger.addListener('item', function(msg) { 
        sys.puts(formatter(msg));
    });
}

exports.ConsoleHandler = ConsoleHandler;

function FileHandler(logger, path, formatter) {
    formatter = formatter || default_formatter;

    var output = fs.createWriteStream(path);

    logger.addListener('item', function(msg) { 
        output.write(formatter(msg));
        output.write('\n');
    });
};

exports.FileHandler = FileHandler;
