var sys = require('sys'),
    fs = require('fs'),
    path = require('path');

var log = sys.log;

function Store(fn) { 
    this.fn = fn;
    this.data = {};
    this.wants_save = false;
};

Store.prototype.save = function(force) {
    if( force ) { 
        log('saving tempstore to '+this.fn);
        this.wants_save = false;
        fs.writeFile(this.fn, 
            JSON.stringify(this.data, null, 4)
        );
    } else {
        this.wants_save = true;
    }
};

Store.prototype.load = function(cb) { 
    var self = this;
    path.exists(this.fn, function(exists) {
        if( exists ) { 
            fs.readFile(self.fn, function(err, content) { 
                if( err ) { 
                    log("store loading error: "+err);
                } else {
                    try { 
                        var data = JSON.parse(content.toString());
                        self.data = data;
                    } catch(e) { 
                        log("store loading parse error: "+e);
                    }
                }
                cb();
            });
        } else {
            cb();
        }
    });
};

function TempStore(path) {
    this.path = path;
    this.stores = {};
}

TempStore.prototype.get = function(name, cb) { 
    log('request for tempstore "'+name+'"');
    var store = this.stores[name];
    if( !store ) {
        var store_fn = path.join(this.path, name+'.json');
        store = this.stores[name] = new Store(store_fn);
        store.load(function() {
            cb(store);
        });
    } else {
        cb(store);
    }
};

TempStore.prototype.save_loop_start = function(interval) {
    if( this._save_loop_timer ) { return; } 

    var self = this;

    this._save_loop_timer = setInterval(function() { 
        self.save_all();
    }, interval);
};

TempStore.prototype.save_all = function() { 
    for( var name in this.stores ) { 
        var store = this.stores[name];
        if( store && store.wants_save ) { 
            this.stores[name].save(true);    
        }
    }
};

exports.TempStore = TempStore;


