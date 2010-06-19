var sys = require('sys'),
    events = require('events'),
    http = require('http'),
    querystring = require('querystring'),
    simplerequest = require('fatbot/simplerequest');

var log = sys.log;

const chr3 = String.fromCharCode(3);

function TweetSearch(options) { 
    events.EventEmitter.call(this);
    options.interval = options.interval || (60*1000);
    this.options = options;
    this.interval_handle = null;
    this.since = 0;
};
TweetSearch.prototype.__proto__ = events.EventEmitter.prototype;

TweetSearch.prototype.toString = function() {
    return "<TweetSearch "+this.options.term+">";
};

const twitter_search_url = "http://search.twitter.com/search.json";

TweetSearch.prototype.check = function(cb) { 
    var uri = twitter_search_url+"?"+querystring.stringify({
        q: this.options.term,
        since_id: this.since
    });
    log('tweets checking "'+uri+'"');
    var self = this;
    var send_items = (this.since !== 0);
    
    simplerequest({uri: uri}, function(err, resp, body) { 
        tweets = JSON.parse(body);
        //log('tweet json '+sys.inspect(tweets, false, null));
        var results = tweets["results"],
            length = results.length;

        for (var i = (length-1); i >= 0; i--) {
            if (results[i].id > self.since) {
                self.since = results[i].id;
            }
            if( send_items ) { self.emit('newitem', results[i]); }
        }
        self.emit('donecheck');
        if( cb ) { cb(); }
    });
};

TweetSearch.prototype.loop = function() {
    var self = this;
    this.interval_handle = setInterval(function() { 
        self.check();
    }, this.options.interval);
};

TweetSearch.prototype.start = function() { 
    var self = this;
    if( this.interval_handle === null ) {
        if( this.since === 0 ) { 
            this.check(function() { self.loop(); });
        } else {
            this.loop();
        }
    }
};

TweetSearch.prototype.stop = function() {
    if( this.interval_handle !== null ) {
        clearInterval(this.interval_handle);
    }
    this.interval_handle = null;
};


function TweetFollower(options) { 
    events.EventEmitter.call(this);
    options.interval = options.interval || (60*1000);
    this.options = options;
    this.interval_handle = null;
    this.since = 0;
};
TweetFollower.prototype.__proto__ = events.EventEmitter.prototype;

TweetFollower.prototype.toString = function() {
    return "<TweetFollower "+this.options.term+">";
};

const twitter_follow_url = "http://api.twitter.com/1/statuses/user_timeline/:ID.json";

TweetFollower.prototype.check = function(cb) { 
    var uri = (
            twitter_follow_url
                .replace(':ID', this.options.id)+
                "?"+querystring.stringify({
                    since_id: this.since
                })
    );
    log('tweets checking "'+uri+'"');
    var self = this;
    var send_items = (this.since !== 0);
    
    simplerequest({uri: uri}, function(err, resp, body) { 
        var tweets = JSON.parse(body);
        //log('tweet json '+sys.inspect(tweets, false, null));
        //var results = tweets["results"],
        //    length = results.length;

        for (var i = (tweets.length-1); i >= 0; i--) {
            if (tweets[i].id > self.since) {
                self.since = tweets[i].id;
            }
            if( send_items ) { self.emit('newitem', tweets[i]); }
        }
        self.emit('donecheck');
        if( cb ) { cb(); }
    });
};

TweetFollower.prototype.loop = function() {
    var self = this;
    this.interval_handle = setInterval(function() { 
        self.check();
    }, this.options.interval);
};

TweetFollower.prototype.start = function() { 
    var self = this;
    if( this.interval_handle === null ) {
        if( this.since === 0 ) { 
            this.check(function() { self.loop(); });
        } else {
            this.loop();
        }
    }
};

TweetFollower.prototype.stop = function() {
    if( this.interval_handle !== null ) {
        clearInterval(this.interval_handle);
    }
    this.interval_handle = null;
};


exports.main = function(app, options) { 
    var searchers = {}, followers = {};

    app.tempstore.get('tweetsplugin', function(tempstore) {

        app.addListener('serverconnect', function(server) { 
            var server_opts = options.servers[server.options.name];
            if( !server_opts ) { return; }
            server.addListener('ijoined', function(ev) { 
                var target = ev.target;
                var target_opts = server_opts[target.name];
                if( !target_opts ) { return; } 
                target_opts.searches.forEach(function(search_opts) {
                    var searcher = searchers[search_opts.term];
                    var ts_since_key = [server.options.name, target.name, "search", "since"].join(".");
                    if( !searcher ) { 
                        searcher = searchers[search_opts.term] = new TweetSearch(search_opts);
                        searcher.since = tempstore.data[ts_since_key] || 0;
                        searcher.start();
                    }
                    searcher.addListener('newitem', function(item) { 
                        target.notice('TwitterS: '+chr3+'3'+item.from_user+': '+chr3+'0'+item.text);
                    });
                    searcher.addListener('donecheck', function() { 
                        if( searcher.since != tempstore.data[ts_since_key] ) { 
                            tempstore.data[ts_since_key] = searcher.since;
                            tempstore.save();
                        }
                    });
                });
                target_opts.follows.forEach(function(follow_opts) { 
                    var follower = followers[follow_opts.id];
                    var ts_since_key = [server.options.name, target.name, "follow", "since"].join(".");
                    if( !follower ) { 
                        follower = followers[follow_opts.term] = new TweetFollower(follow_opts);
                        follower.since = tempstore.data[ts_since_key] || 0;
                        follower.start();
                    }
                    follower.addListener('newitem', function(item) { 
                        target.notice('TwitterF: '+chr3+'3'+item.user.name+': '+chr3+'0'+item.text);
                    });
                    follower.addListener('donecheck', function() { 
                        if( follower.since != tempstore.data[ts_since_key] ) { 
                            tempstore.data[ts_since_key] = follower.since;
                            tempstore.save();
                        }
                    });
                });
            });
        });
    
    });
};
