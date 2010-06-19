exports.main = function(app, options) { 
    app.addListener('serverconnect', function(server) { 
        var server_opts = options.servers[server.options.name];
        if( !server_opts ) { return; }
        server.message('nickserv', 'identify '+server_opts.password);
    });
};
