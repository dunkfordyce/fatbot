var sys = require('sys'),
    url = require('url'),
    events = require('events'),
    simplerequest = require('fatbot/simplerequest'),
    htmlparser = require("node-htmlparser"),
    Intervaler = require('fatbot/intervaler').Intervaler,
    helpers = require('fatbot/plugins/helpers'),
    log = require('fatbot/logging').log.Logger('rss');

function FeedChecker(options) { 
    options.interval = options.interval || 60;
    this.options = options;
    this.max_date = null;
    Intervaler.call(this, options.interval);
}

FeedChecker.prototype.__proto__ = Intervaler.prototype;

FeedChecker.prototype.toString = function() {
    return "<FeedChecker "+this.options.url+">";
};

FeedChecker.prototype.check = function(cb) { 
    var self = this;
    var send_items = (this.max_date !== null);
    log.info('rss checking "'+this.options.url+'"');
    simplerequest({uri: this.options.url}, function(err, resp, body) {
        if( err ) { 
            log.exception(err, 'error fetching', uri);
            return;
        }
        var handler = new htmlparser.RssHandler(function (error, dom) {
            if( error ) { 
                log.exception(error, 'error parsing', uri);
                return;
            }
            for( var i=dom.items.length-1; i>= 0; i-- ) {
                var item = dom.items[i];
                //log.info('item '+item.title+','+item.pubDate, self.max_date, item.pubDate > self.max_date);
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
        if( cb ) { cb(); }
    });
};

const chr3 = String.fromCharCode(3);

exports.main = function(app, options) { 
    var checkers = {};

    options.interval = options.interval || 300;

    app.tempstore.get('rssplugin', function(tempstore) { 
        helpers.if_got_target_options(app, options, function(server, server_opts, target, target_opts) { 
            target_opts.feeds.forEach(function(feed_opts) { 
                var checker = checkers[feed_opts.url];
                var ts_max_date_key = [server.options.name, target.name, "max_date"].join('.');
                if( !checker ) {
                    feed_opts.options = feed_opts.options || options.interval;
                    checker = checkers[feed_opts.url] = new FeedChecker(feed_opts);
                    checker.max_date = tempstore.data[ts_max_date_key] || null;
                    if( checker.max_date ) { 
                        checker.max_date = new Date(checker.max_date);
                    }
                    checker.start(checker.max_date === null);
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
        }); // if_got_target_options
    }); // tempstore.get
};
