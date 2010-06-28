var Exception = exports.Exception = function(msg) { 
    this.msg = msg;
};
Exception.prototype.toString = function() { 
    return this.msg;
};
