var events = require('events');

var Cancel = exports.Cancel = function() {};

events.EventEmitter.prototype.emitCancelable = function() { 
    try { 
        this.emit.apply(this, arguments);
    } catch(e) { 
        if( !(e instanceof Cancel) ) { 
            throw e;   
        }
    }
};

events.EventEmitter.prototype.emitSafe = function(type) { 
  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events || !this._events.error ||
        (this._events.error instanceof Array && !this._events.error.length))
    {
      if (arguments[1] instanceof Error) {
        throw arguments[1];
      } else {
        throw new Error("Uncaught, unspecified 'error' event.");
      }
      return false;
    }
  }

  if (!this._events) return false;
  if (!this._events[type]) return false;

  if (typeof this._events[type] == 'function') {
    try { 
    if (arguments.length < 3) {
      // fast case
      this._events[type].call( this
                             , arguments[1]
                             , arguments[2]
                             );
    } else {
      // slower
      var args = Array.prototype.slice.call(arguments, 1);
      this._events[type].apply(this, args);
    }
    } catch(e) { 
      logging.exception(e, 'in', this, 'emitting', type);
    }
    return true;

  } else if (this._events[type] instanceof Array) {
    var args = Array.prototype.slice.call(arguments, 1);


    var listeners = this._events[type].slice(0);
    for (var i = 0, l = listeners.length; i < l; i++) {
      try { 
      listeners[i].apply(this, args);
      } catch(e) { 
      logging.exception(e, 'in', this, 'emitting', type);
      }
    }
    return true;

  } else {
    return false;
  }
};

exports.EventEmitter = events.EventEmitter;
