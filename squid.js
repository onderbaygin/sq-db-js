/*
    * Squid Database - Build Realtime Applications Quickly

    * Provider Squid Database
        * Squid Database is founded on 2018 for secure and fast data transferring
        * Squid, provides realtime data transferring
        * You can build notification systems, online games, chat applications or other realtime applications with Squid very quickly

    * Firstly before start:
        * If you do not know how to use Squid, you must look our docs address
        * Never forget, the data is not a joke

    * Contact                 : hi@sq-db.com
    * Web                     : https://sq-db.com/
    * Docs                    : https://sq-db.com/docs/
    * Default Realtime Server : wss://live.sq-db.com
 
    
    * Social Media
        * https://www.linkedin.com/company/sqdb/
        * https://www.facebook.com/squiddatabase/
        * https://twitter.com/SquidDatabase/
*/

class Squid 
{
    /*  
        * You need to define configuration of Squid
        * It should take the parameters: server and key
            * Configuration Example:
                * var squid = new SquidSW({
                *   key: "-------------------------------",
                *   server: "wss://live.sq-db.com"
                * })
        * If you want to add room or door as parameter
            * Like this:
                * var squid = new SquidSW({
                *   key: "-------------------------------",
                *   server: "wss://live.sq-db.com",
                *   room: "room1",
                *   door: "test"
                * })
        * You can change the parameters later: room and door
            * For example: squid.door("test") or squid.room("room1")
    */

    constructor (config) {
        this.squid = new SquidSW(config);
        return this;
    }

    quit() {
        /*
            *
                * If you need to disconnect the socket, use "quit" function
            * 
        */
        return this.squid.quit();
    }

    room(r) {
        /*
            *
                * Use for define or change room name. If you defined in configuration, not required
            * 
        */
        this.squid.param.room = r;
        return this;
    }

    door(d) {
        /*
            *
                * Use for define or change door name. If you defined in configuration, not required
            * 
        */
        this.squid.param.door = d;
        return this;
    }

    query(q = undefined) {
        /*
            *
                * Use for define or change query
            *
        */
        var query = this.squid.query(q);
        return query ? this : false;
    }

    limit(l) {
        /*
            *
                * Use for define limit of response from request, not required
            * 
        */
       var limit = this.squid.limit(l);
       return limit ? this : false;
    }

    reverse() {
        /*
            *
                * Use for reverse data
            * 
        */
        this.squid.reverse();
        return this;
    }

    insert(c) {
        /*
            *
                * Insert data
            * 
        */
        return this.squid.insert(c);
    }

    one(c) {
        /*
            *
                * Find data with id (only one)
            * 
        */
        return this.squid.one(c);
    }
    
    find(c) {
        /*
            *
                * Find data with query (if defined, until limit)
            * 
        */
        return this.squid.find(c);
    }

    all(c) {
        /*
            *
                * Find data without query (if defined, until limit)
            * 
        */
        return this.squid.all(c);
    }

    update(u, c) {
        /*
            *
                * Update data with id or query
            * 
        */
        return this.squid.update(u, c);
    }

    remove(c) {
        /*
            *
                * Rmove data with id or query
            * 
        */
        return this.squid.remove(c);
    }

    onAdded(c) {
        /*
            *
                * Listen to door with the query or not use the query
                * If you do not use the query, server will give notice you when any data added to door 
            * 
        */
        return this.squid.onAdded(c);
    }

    onRemoved(c) {
        /*
            *
                * Listen to door with the query or not use the query
                * If you do not use the query, server will give notice you when any data removed on door 
            * 
        */
        return this.squid.onRemoved(c);
    }

    onChanged(c) {
        /*
            *
                * Listen to door with the query or not use the query
                * If you do not use the query, server will give notice you when any data changed on door 
            * 
        */
        return this.squid.onChanged(c);
    }
}

/* 
    *
        *
            * You should not use SquidSW class
        * 
    * 
*/

class SquidSW 
{
    constructor (config) {
        this.callbacks       = new Object();
        this.param           = new Object();
        this.socket          = undefined;
        this.operation       = undefined;
        this.param.reverse   = undefined;
        this.param.query     = undefined;
        this.param.limit     = undefined;
        this.param.remove    = undefined;
        this.param.update    = undefined;
        this.param.door      = config.door   ? config.door   : undefined;
        this.param.key       = config.key    ? config.key    : undefined;
        this.param.server    = config.server ? config.server : undefined;
        this.param.room      = config.room   ? config.room   : undefined;
        this.reconnectTrying = false;
        this.connected       = false;
        this.errors = {
            limit: [
                "Limit should be higher than 0",
                "Limit should be integer" 
            ],
            query: [
                "Query should be object or integer (as id, higher than 0) or undefined as like default. "
            ],
            update: [
                "First parameter should be object"
            ], 
            remove: [
                "First parameter should be object"
            ],
            callback: [
                "Callback should be function"
            ],
            init: [
                "Login failed! Please try again!",
                "Already connected!"
            ],
            quit: [
                "Goodbye!"
            ]
        }
        this.init();
        return this;
    }

    init() {
        if(!this.connected) {
            try {
                this.socket = new WebSocket(this.param.server);
               
                console.log('WebSocket - status ' + this.socket.readyState);
                this.socket.onopen = async () => {
                    this.login();
                };
                this.socket.onmessage = (msg) => {
                    var message = JSON.parse(msg.data);
                    if(message.status === "login") {
                        if(message.data == true) {
                            console.log("Squid connected successfully!");
                            return this.connected = true;
                        } else {
                            return this.error("init", 0, true);
                        }
                    } else if(this.connected) {
                        return this.callbacks[message.uuid] ? this.callbacks[message.uuid](message.data) : undefined;
                    } else {
                        return this.error("init", 0, true);
                    }
                };
                this.socket.onclose = () => {
                    this.reconnect();
                };
                this.socket.onerror = () => {
                };
            } catch (ex) {
               console.log(ex)
            }
        } else {
            this.error("init", 1, true);
        }
    }
    
    quit() {
        if (this.socket != null) {
            this.socket.close();
            this.socket = null;
        } 
    }
    
    reconnect() {
        this.quit();
        var reconnect = setTimeout(()=>{
            this.init();
            if(this.connected) {
                clearInterval(reconnect);
                return true;
            }
        }, 5000);   
    }

    clear() {
        this.param.query  = undefined;
        this.param.update = undefined;
        this.param.remove = undefined;
        this.param.limit  = undefined;
    }

    uuid() {
        return btoa(unescape(encodeURIComponent(this.param.room + this.param.door + JSON.stringify(this.param.query) + this.operation)));
    }

    send(callback = undefined) {
        if(this.connected) {
            var uuid = this.uuid();
            if(callback && callback instanceof Function) {
                this.callbacks[uuid] = callback;
            } else {
                this.error("callback", 0, true);
                return false;
            }
            this.socket.send(this.json({
                uuid      :      uuid,
                operation :      this.operation,
                room      :      this.param.room,
                door      :      this.param.door,
                query     :      this.param.query,
                key       :      this.param.key,
                limit     :      this.param.limit,
                update    :      this.param.update,
                remove    :      this.param.remove, 
            }));
        } else {
            var connected = setInterval(() => {
                if(this.connected) {
                    this.send(callback);
                    clearInterval(connected);
                }
            }, 100);
        }
    }

    error(func, i, trace = false) {
        if(trace) {
            return console.trace("Squid Error: " + this.errors[func][i]);
        } else {
            return "Squid Error: " + this.errors[func][i];
        }
    }

    json(d) {
        return JSON.stringify(d);
    }

    login() {
        this.socket.send(JSON.stringify({
            operation: "login",
            key: this.param.key,
        }));
    }

    room(r) {
        this.param.room = r;
        return this;
    }

    door(d) {
        this.param.door = d;
        return this;
    }

    query(q = undefined) {
        if(q instanceof Object || (Number.isInteger(q) && q > 0) || q === undefined) {
            this.param.query = q;
            return true;
        } else {
            this.error("query", 0, true);
            return false;
        }
    }

    limit(l) {
        if(l && Number.isInteger(l)) {
            if(l > 0) {
                this.param.limit = l;
                return true;
            } else {
                this.error("limit", 0, true);
                return false;
            }
        }
        else {
            this.error("limit", 1, true);
            return false;
        }
    }

    reverse() {
        this.param.reverse = 1;
    }

    one(c) {
        this.operation = "findOne";
        this.send(c);    
    }

    insert(c) {
        this.operation = "insert";
        this.send(c);
    }

    find(c) {
        this.operation = "find";
        this.send(c);
    }

    all(c) {
        this.param.query = undefined;
        this.operation = "findAll";
        this.send(c);
    }

    update(u, c) {
        if(u instanceof Object) {
            this.operation = "update";
            this.param.update = u;
            this.send(c);
        } else {
            this.error("update", 0, true);
        }
    }

    remove(c) {
        this.operation = "remove";
        this.send(c);
    }

    onAdded(c) {
        this.operation = "onAdded";
        this.send(c);          
    }

    onRemoved(c) {
        this.operation = "onRemoved";
        this.send(c);   
    }

    onChanged(c) {
        this.operation = "onChanged";
        this.send(c);     
    }
}
