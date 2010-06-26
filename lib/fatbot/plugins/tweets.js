var sys = require('sys'),
    events = require('events'),
    http = require('http'),
    querystring = require('querystring'),
    simplerequest = require('fatbot/simplerequest'),
    Intervaler = require('fatbot/intervaler').Intervaler,
    helpers = require('fatbot/plugins/helpers'),
    log = require('fatbot/logging').log.Logger('tweets');

const chr3 = String.fromCharCode(3);

function TweetSearch(options) { 
    if( options === undefined || options.term === undefined ) { 
        throw "TweetFollower called with undefined opts";
    }
    options.interval = options.interval || 60;
    this.options = options;
    this.since = 0;
    Intervaler.call(this, options.interval);
};
TweetSearch.prototype.__proto__ = Intervaler.prototype;

TweetSearch.prototype.toString = function() {
    return "<TweetSearch "+this.options.term+">";
};

const twitter_search_url = "http://search.twitter.com/search.json";

TweetSearch.prototype.check = function(cb) { 
    var uri = twitter_search_url+"?"+querystring.stringify({
        q: this.options.term,
        since_id: this.since
    });
    log.info('tweets checking "'+uri+'"');
    var self = this;
    var send_items = (this.since !== 0);
    
    simplerequest({uri: uri}, function(err, resp, body) { 
        if( err ) { 
            log.exception(err, 'error fetching', uri);
            return;
        } 
        var tweets;
        try { 
            tweets = JSON.parse(body);
        } catch(e) { 
            log.error('failed parsing twitter response', body);
            return;
        }
        //log.info('tweet json '+sys.inspect(tweets, false, null));
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
    if( options === undefined || options.id === undefined ) { 
        throw "TweetFollower called with undefined opts";
    }
    options.interval = options.interval || 60;
    this.options = options;
    this.interval_handle = null;
    this.since = 0;
    Intervaler.call(this, options.interval);
};
TweetFollower.prototype.__proto__ = Intervaler.prototype;

TweetFollower.prototype.toString = function() {
    return "<TweetFollower "+this.options.id+">";
};

const twitter_follow_url = "http://api.twitter.com/1/statuses/user_timeline/:ID.json";

TweetFollower.prototype.check = function(cb) { 
    var uri = twitter_follow_url.replace(':ID', this.options.id);
    if( this.since ) { 
        uri +="?"+querystring.stringify({
            since_id: this.since
        });
    };
    log.debug('tweets checking "'+uri+'"');
    var self = this;
    var send_items = (this.since !== 0);
    
    simplerequest({uri: uri}, function(err, resp, body) { 
        if( err ) { 
            log.exception(err, 'error fetching', uri);
            return;
        } 
        var tweets;
        try { 
            tweets = JSON.parse(body);
        } catch(e) { 
            log.error('failed parsing twitter response', body);
            return;
        }
        for( var i = 0; i != tweets.length; i++ ) {
            if( !tweets[i] ) { 
                log.info('WARN unfound tweet index '+i+','+tweets.length);
                continue;
            }
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
        helpers.if_got_target_options(app, options, function(server, server_opts, target, target_opts) {
            log.info('configuring tweeters '+server+', '+target);
            target_opts.searches = target_opts.searches || [];
            target_opts.follows = target_opts.follows || [];

            //log.info("target "+sys.inspect(target, false, null));
            //log.info(sys.inspect(server_opts));
            //log.info(sys.inspect(target_opts));

            target_opts.searches.forEach(function(search_opts) {
                var searcher = searchers[search_opts.term];
                var ts_since_key = [
                    server.options.name, 
                    target.name, 
                    search_opts.term, 
                    "search", "since"].join(".");
                if( !searcher ) { 
                    log.info('searcher not found creating '+sys.inspect(search_opts));
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
                var ts_since_key = [
                    server.options.name, 
                    target.name, 
                    follow_opts.id, 
                    "follow", "since"].join(".");
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
