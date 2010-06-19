var sys = require('sys'),
    url = require('url'),
    events = require('events'),
    simplerequest = require('fatbot/simplerequest'),
    htmlparser = require("node-htmlparser");

var log = sys.log;

function FeedChecker(options) { 
    events.EventEmitter.call(this);
    options.interval = options.interval || (60 * 1000);
    this.options = options;
    this.interval_handle = null;
    this.max_date = null;
}

FeedChecker.prototype.__proto__ = events.EventEmitter.prototype;

FeedChecker.prototype.toString = function() {
    return "<FeedChecker "+this.options.url+">";
};

FeedChecker.prototype.check = function() { 
    var self = this;
    var send_items = (this.max_date !== null);
    log('rss checking "'+this.options.url+'"');
    simplerequest({uri: this.options.url}, function(err, resp, body) {
        var handler = new htmlparser.RssHandler(function (error, dom) {
            for( var i=dom.items.length-1; i>= 0; i-- ) {
                var item = dom.items[i];
                //log('item '+item.title+','+item.pubDate, self.max_date, item.pubDate > self.max_date);
                if( self.max_date === null || item.pubDate > self.max_date ) {
                    self.max_date = item.pubDate;
                    if( send_items ) { 
                        self.emit('newitem', item);
                    }
                }
            }
        });
        var parser = new htmlparser.Parser(handler);
        parser.parseComplete(body);
        self.emit('donecheck');
    });
};
FeedChecker.prototype.loop = function() {
    log('feedcheck '+this.options.interval);
    var self = this;
    this.interval_handle = setInterval(function() { 
        self.check();
    }, this.options.interval);
};

FeedChecker.prototype.start = function() { 
    if( this.interval_handle === null ) {
        this.loop();
    }
};

FeedChecker.prototype.stop = function() {
    if( this.interval_handle !== null ) {
        clearInterval(this.interval_handle);
    }
    this.interval_handle = null;
};

const chr3 = String.fromCharCode(3);

exports.main = function(app, options) { 
    var checkers = {};

    app.tempstore.get('rssplugin', function(tempstore) { 

        app.addListener('serverconnect', function(server) { 
            var server_opts = options.servers[server.options.name];
            if( !server_opts ) { return; }
            //log('connected to server with opts '+sys.inspect(server_opts));
            server.addListener('ijoined', function(ev) {
                var target_opts = server_opts[ev.target.name];
                var target = ev.target;
                if( !target_opts ) { return; }
                //log('joined room with rss opts '+sys.inspect(target_opts));
                target_opts.feeds.forEach(function(feed_opts) { 
                    var checker = checkers[feed_opts.url];
                    var ts_max_date_key = [server.options.name, target.name, "max_date"].join('.');
                    if( !checker ) {
                        //log('no checker found for '+feed_opts.url);
                        checker = checkers[feed_opts.url] = new FeedChecker(feed_opts);
                        checker.max_date = tempstore.data[ts_max_date_key] || null;
                        if( checker.max_date ) { 
                            checker.max_date = new Date(checker.max_date);
                        }
                        checker.start();
                    }
                    checker.addListener('newitem', function(item) {
                        target.notice("RSS: "+chr3+'3'+item.title+chr3+'0 ['+item.link+']');
                    });
                    checker.addListener('donecheck', function() { 
                        if( checker.max_date != tempstore.data[ts_max_date_key] ) { 
                            tempstore.data[ts_max_date_key] = checker.max_date;
                            tempstore.save();
                        }
                    });
                });
            });
        });
        
    });
};
