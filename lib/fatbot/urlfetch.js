var sys = require('sys'),
    url = require('url'),
    http = require('http'),
    base64 = require('fatbot/base64'),
    simplerequest = require('fatbot/simplerequest');

var log = sys.log;

function open(u, cb) {
    simplerequest({uri: u}, function(err, resp, body) { 
        cb(body);
    });
};

/*
var htmlparser = require('node-htmlparser');

open('https://dunk:BGC0L0R@dev.fatdrop.co.uk/timeline?ticket=on&ticket_details=on&changeset=on&milestone=on&wiki=on&pastebin=on&max=50&daysback=90&format=rss', function(content) {
    var handler = new htmlparser.RssHandler(function (error, dom) {
        log(sys.inspect(dom, false, null));
    });
    var parser = new htmlparser.Parser(handler);
    parser.parseComplete(content);
});
*/
