var sys = require('sys'),
    events = require('events'),
    http = require('http'),
    querystring = require('querystring'),
    simplerequest = require('fatbot/simplerequest'),
    plugin_helpers = require('fatbot/plugin_helpers');

var log = sys.log;

const chr3 = String.fromCharCode(3);

function TweetSearch(options) { 
    options.interval = options.interval || 60;
    this.options = options;
    this.since = 0;
    plugin_helpers.Intervaler.call(this, options.interval);
};
TweetSearch.prototype.__proto__ = plugin_helpers.Intervaler.prototype;

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


function TweetFollower(options) { 
    options.interval = options.interval || 60;
    this.options = options;
    this.interval_handle = null;
    this.since = 0;
    plugin_helpers.Intervaler.call(this, options.interval);
};
TweetFollower.prototype.__proto__ = plugin_helpers.Intervaler.prototype;

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




exports.main = function(app, options) { 
    var searchers = {}, followers = {};

    options.interval = options.interval || (10 * 60);

    app.tempstore.get('tweetsplugin', function(tempstore) {
        plugin_helpers.if_got_target_options(app, options, function(server, server_opts, target, target_opts) {
            log('configuring tweeters '+server+', '+target);
            target_opts.searches = target_opts.searches || [];
            target_opts.follows = target_opts.follows || [];

            log("target "+sys.inspect(target, false, null));
            log(sys.inspect(server_opts));
            log(sys.inspect(target_opts));

            target_opts.searches.forEach(function(search_opts) {
                var searcher = searchers[search_opts.term];
                var ts_since_key = [server.options.name, target.name, "search", "since"].join(".");
                if( !searcher ) { 
                    log('searcher not found creating '+sys.inspect(search_opts));
                    search_opts.interval = search_opts.interval || options.interval;
                    searcher = searchers[search_opts.term] = new TweetSearch(search_opts);
                    searcher.since = tempstore.data[ts_since_key] || 0;
                    searcher.start(searcher.since === 0);
                }
                searcher.addListener('newitem', function(item) { 
                    target.notice('Twitter: '+chr3+'3'+item.from_user+': '+chr3+'0'+item.text);
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
                    follow_opts.interval = follow_opts.interval || options.interval;
                    follower = followers[follow_opts.term] = new TweetFollower(follow_opts);
                    follower.since = tempstore.data[ts_since_key] || 0;
                    follower.start(follower.since === 0);
                }
                follower.addListener('newitem', function(item) { 
                    target.notice('Twitter: '+chr3+'3'+item.user.name+': '+chr3+'0'+item.text);
                });
                follower.addListener('donecheck', function() { 
                    if( follower.since != tempstore.data[ts_since_key] ) { 
                        tempstore.data[ts_since_key] = follower.since;
                        tempstore.save();
                    }
                });
            });
        }); // if_got_target_options
    }); // tempstore.get
};
