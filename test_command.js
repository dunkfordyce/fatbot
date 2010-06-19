function ping(ev) { 
    ev.target.message(ev.prefix.nick+': pong');
}

exports.main = function(server) { 
    var handler = server.plugins.bot.command_handler;
    handler.register('ping', ping);
};
