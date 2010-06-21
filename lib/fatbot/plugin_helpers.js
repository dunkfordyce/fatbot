var sys = require('sys'),
    events = require('events');

var log = sys.log;

function Intervaler(interval) {
    events.EventEmitter.call(this);
    this._interval = interval * 1000;
    this._interval_handle = null;
    log(this + 'created interval set to '+this._interval);
}
Intervaler.prototype.__proto__ = events.EventEmitter.prototype;

Intervaler.prototype.loop = function() {
    log(this + ' starting loop with interval '+this._interval)
    var self = this;
    this._interval_handle = setInterval(function() { 
        log(this+" interval - calling check");
        self.check();
    }, this._interval);
};

Intervaler.prototype.start = function(immediate) { 
    log(this+" start " +immediate+", "+this._interval_handle);
    if( this._interval_handle === null ) {
        if( immediate ) { 
            log(this+" immediate");
            var self = this;
            this.check(function() { self.loop(); });
        } else {
            log(this+" calling loop");
            this.loop();
        }
    }
};

Intervaler.prototype.stop = function() {
    if( this._interval_handle !== null ) {
        clearInterval(this._interval_handle);
        this._interval_handle = null;
    }
};


function if_got_target_options(app, options, cb) {
    app.addListener('serverconnect', function(server) { 
        var server_opts = options.servers[server.options.name];
        if( !server_opts ) { 
            log('no server opts found "'+server.options.name+'"');
            return; 
        }
        server.addListener('ijoined', function(ev) { 
            var target_opts = server_opts[ev.target.name];
            if( !target_opts ) { 
                log('no target opts found "'+ev.target.name+'"');
                log(sys.inspect(server_opts));
                return; 
            }
            log('if_got_target_options calling '+server.options.name+", "+ev.target.name);
            log(sys.inspect(server_opts));
            log(sys.inspect(target_opts));
            log(sys.inspect(cb));
            cb(server, server_opts, ev.target, target_opts);
        });
    });
};

exports.Intervaler = Intervaler;
exports.if_got_target_options = if_got_target_options;
