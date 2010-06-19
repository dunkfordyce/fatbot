exports.main = function(app, options) { 
    app.addListener('serverconnect', function(server) { 
        var rooms = options.servers[server.options.name];
        if( !rooms ) { return; }
        for( var i=0; i!=rooms.length; i++ ) {
            server.join(rooms[i]);
        }
    });
};
