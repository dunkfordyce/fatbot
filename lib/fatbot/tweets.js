var sys = require('sys'),
    http = require('http');


function Tweeter(target, term) { 
    this.target = target;
    this.term = term;
    this.since = 0;
    this.timer = null;
    this.connection = http.createClient(80, "search.twitter.com");
}

const chr3 = String.fromCharCode(3);
Tweeter.prototype.get_tweets = function() { 
    var request = this.connection.request('GET', 
        "/search.json?q=" + this.term + "&since_id="+this.since, 
        {"host": "search.twitter.com", "User-Agent": "NodeJS HTTP Client"}
    );

    var self = this;

    request.addListener("response", function(response) {
        var responseBody = "";
        response.setBodyEncoding("utf8");
        response.addListener("data", function(chunk) { responseBody += chunk });
        response.addListener("end", function() {
            tweets = JSON.parse(responseBody);
            var results = tweets["results"],
                length = results.length;
            for (var i = (length-1); i >= 0; i--) {
                if (results[i].id > self.since) {
                    self.since = results[i].id;
                }
                self.target.notice("Twitter: " + chr3 + '3' + results[i].from_user + ": " + results[i].text);
            }
        });
    });
    request.end();
};

Tweeter.prototype.start = function() { 
    this.loop();
};

Tweeter.prototype.loop = function() { 
    var self = this;
    this.timer = setTimeout(function() { 
        self.get_tweets();
        self.loop();
    }, 10000);
};

Tweeter.prototype.stop = function() { 
    if( this.timer !== null ) {
        clearTimeout(this.timer);
    }
};

exports.Tweeter = Tweeter;
