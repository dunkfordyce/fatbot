# Plugins

## app_autoserver

automatically connect servers at startup 

### config

    {
        "module": "fatbot/plugins/app_autoserver",
        "servers": [ "server1", "server2", ... ]
    }

server names should be the names of configured servers.

## auth

authenticate app commands before running them 

### config
    
    {
        "module": "fatbot/plugins/auth",
        "allow": [
            {
                "source": "<command source>",
                "prefix": "<user prefix>",
                "server": "<server names>",
                "target": "<target name>",
                "command": "<command name>"
            }
        ]
    } 

All keys are optional and can all take a single string or an array of strings to match against.

source is any command source such as "bot" or "socket".

prefix is the user who issued the command 

server is the name of a server 

target is the name of a room

### examples

    {
        "source": "socket"
    }

Allows all commands from the socket source ( socket_command_handler plugin )

    {
        "source": "bot",
        "server": "freenode",
        "prefix": [
            "user1!~user1@somehost.co.uk",
            "user2!~user2@somehost.co.uk"
        ]
    }

Allows the two users on the freenode server to run commands via the bot plugin.

## bot

allows running app commands from irc 

### config 

    { 
        "module": "fatbot/plugins/bot"   
    }

bot plugin has no config options

## irc_identify 

automatically identify with nickserv when connecting to irc servers

### config 

    {
        "module": "fatbot/plugins/irc_identify",
        "servers": {
            "freenode": { password: "XXXX" }
        }
    }

## rss

fetch items from an rss feed and announce them in a room 

### config

    {
        "module": "fatbot/plugins/rss",
        "servers": {
            "freenode": {
                "feeds": { 
                    { "url": "http://myrss.com/", interval: 600 }
                }
            }
        }        
    }

## server_autojoin

automatically join rooms when connecting to a server 

### config

    {
        "module": "fatbot/plugins/server_autojoin",
        "servers": {
            "freenode": ["#room1", "#room2"]
        }
    }

## server_reconnect

automatically reconnect to servers if they become disconnected

### config 

    {
        "module": "fatbot/plugins/server_reconnect",
        "after": <seconds before restarting>
    }

## socket\_command\_listener

listens on a socket for commands 

### config

    {
        "module": "fatbot/plugins/socket_command_listener",
        "port": <port to listen on>
    }

port defaults to 7776 

## tweets

search or follow items from twitter and announce them in a room 

### config 
    
    {
        "module": "fatbot/plugins/tweets",
        "servers": {
            "<servername>": { 
                "<targetname>": { 
                    "searches": [ {"term": <search term>, "interval": <check interval>} ],
                    "follows": [ { "id": <twitter id>, "interval": <check interval>} ]
                }
            }
        }
    }

