function CommandHandler() { 
    this.handlers = {};
}

CommandHandler.prototype.register = function(command, handler) { 
    this.handlers[command] = handler;
};

CommandHandler.prototype.call = function(self, command, args) { 
    var cmd = this.handlers[command];
    if( !cmd ) { 
        throw "command not found "+command;
    }
    cmd.call(self, args);
};

exports.CommandHandler = CommandHandler;
