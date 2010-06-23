var sys = require('sys'),
    events = require('events'),
    log = require('fatbot/logging').log.Logger('intervaler');

function Intervaler(interval) {
    events.EventEmitter.call(this);
    this._interval = interval * 1000;
    this._interval_handle = null;
    log.debug(this + 'created interval set to '+this._interval);
}
Intervaler.prototype.__proto__ = events.EventEmitter.prototype;

Intervaler.prototype.loop = function() {
    //log.debug(this + ' starting loop with interval '+this._interval)
    var self = this;
    this._interval_handle = setInterval(function() { 
        //log.debug(this+" interval - calling check");
        self.check();
    }, this._interval);
};

Intervaler.prototype.start = function(immediate) { 
    log.debug(this+" start " +immediate+", "+this._interval_handle);
    if( this._interval_handle === null ) {
        if( immediate ) { 
            log.debug(this+" immediate");
            var self = this;
            this.check(function() { self.loop(); });
        } else {
            log.debug(this+" calling loop");
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

exports.Intervaler = Intervaler;
