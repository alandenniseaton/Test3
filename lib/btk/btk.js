'use strict';

//============================================================
//	the global environment (probably the window object)
//	and the main object

//var btk = btk || {};
//btk.global = this || {};
//	see http://blog.jcoglan.com/2011/01/19/going-global/

(function(){
    var GLOBAL = (typeof global === "object")? global: this;
    GLOBAL.btk = GLOBAL.btk || {};
    btk.global = GLOBAL;
}.call(this));


btk.information = {
    title: "Browser Tool Kit",
    version: {
        date: new Date("May 19, 2011"),
        //	API implementation changes (bug fixes, performance changes etc)
        //		--> patch++
        //	API backwards compatable additions/changes
        //		--> minor++
        //	API backwards incompatable changes
        //		--> major++
        number: {
            major: 0, 
            minor: 0, 
            patch: 0
        }
    }
};


// the document;
btk.document = btk.global.document || {};


//============================================================
// configuration stuff

// Browser detection... In a very few places, there's nothing else for it but to
// know what browser we're using.
// pinched this from TiddlyWiki
btk.config = (function(config) {
    var userAgent = navigator.userAgent.toLowerCase();

    var browser =  {
        isIE: userAgent.indexOf("msie") !== -1 && userAgent.indexOf("opera") === -1,
        isGecko: navigator.product === "Gecko" && userAgent.indexOf("WebKit") === -1,
        ieVersion: /MSIE (\d\.\d)/i.exec(userAgent),
        // ieVersion[1], if it exists, will be the IE version string, eg "6.0"
        isSafari: userAgent.indexOf("applewebkit") !== -1,
        isBadSafari: !((new RegExp("[\u0150\u0170]","g")).test("\u0150")),
        firefoxDate: /gecko\/(\d{8})/i.exec(userAgent),
        // btk.config.browser.firefoxDate[1], if it exists,
        // will be Firefox release date as "YYYYMMDD"
        isOpera: userAgent.indexOf("opera") !== -1,
        isLinux: userAgent.indexOf("linux") !== -1,
        isUnix: userAgent.indexOf("x11") !== -1,
        isMac: userAgent.indexOf("mac") !== -1,
        isWindows: userAgent.indexOf("win") !== -1
    };

    // document location
    // will need this for saving/loading
    var location = {};

    (function(){
        var unescape = btk.global.unescape;
		
        var href  = btk.document.location.href;
        var q     = href.lastIndexOf('?');
        var doc   = (q < 0)? href: href.substr(0,q);
        var query = (q < 0)? ""  :  href.substr(q+1);
		
        location.doc   = doc;
        location.root  = doc.substr(0, doc.lastIndexOf("/")+1);
		
        if (query.length > 0) {
            location.query = (function(query){
                var result = {};
                var entries = query.split('&');
				
                entries.forEach(function(entry){
                    var kv = entry.split('=');
                    result[kv[0]] = unescape(kv[1]) || "";
                });
				
                return result;
            }(query));
        } else {
            location.query = {};
        }
    }());
	
    config.userAgent = userAgent;
    config.browser   = browser;
    config.location  = location;
    config.charSet   = "UTF-8";
	
    // pinched this from TiddlyWiki
    // may need an external applet for file saving
    config.useJavaSaver = (browser.isSafari || browser.isOpera) && (location.doc.substr(0,4) !== "http");
	
    return config;
}(btk.config || {}));


// where am I?
btk.base = (function(doc, root) {
    var signature = 'btk/btk.js';
    var script = doc.querySelector('script[src*="' + signature + '"]');
    var src = (script && script.src) || "";
    var i = src.lastIndexOf(signature)
    var base = (i > -1 && src.slice(0,i) + 'btk/') || "";
	
    base = (base.indexOf(root) === 0 && base.slice(root.length)) || base;
	
    return base;
	
}(btk.document, btk.config.location.root));


//============================================================
// usefull

if (!String.prototype.trim)
{
    // IE does not have trim() for strings
    String.prototype.trim = function() {
        return this.replace(/^\s+|\s+$/g, "");
    };
}


//------------------------------------------------------------
// special functions
//
btk.identity = function(x) {
    return x;
};
btk.nothing  = function() { };

(function(btk){
    var ostring = Object.prototype.toString;
	
    var BOOLEAN  = ostring.call(true);
    var NUMBER   = ostring.call(1);
    var STRING   = ostring.call("");
    var ARRAY    = ostring.call([]);
    var FUNCTION = ostring.call(btk.nothing);
	
    btk.isBoolean  = function(x) {
        return ostring.call(x) === BOOLEAN;
    };
    btk.isNumber   = function(x) {
        return ostring.call(x) === NUMBER;
    };
    btk.isString   = function(x) {
        return ostring.call(x) === STRING;
    };
    btk.isArray    = function(x) {
        return ostring.call(x) === ARRAY;
    };
    btk.isFunction = function(x) {
        return ostring.call(x) === FUNCTION;
    };

    btk.isObject   = function(x) {
        return Object(x) === x;
    };
    btk.isGlobal   = function(x) {
        return ostring.call(x) === "[object global]";
    };
	
    btk.isDefined  = function(x) {
        return x !== undefined && x !== null;
    }
	
    // if the value is of the indicated type then use that value
    // otherwise use the alternate value
	
    btk.ifDefined = function ifDefined(x, alternate) {
        if (btk.isDefined(x)) {
            return x;
        }
        return ifDefined(alternate, false);
    };
	
    btk.ifNumber = function ifNumber(x, alternate) {
        if (btk.isNumber(x)) {
            return x;
        }
        return ifNumber(alternate, 0);
    };
	
    btk.ifString = function ifString(x, alternate) {
        if (btk.isString(x)) {
            return x;
        }
        return ifString(alternate, "");
    };
	
    btk.ifArray = function ifArray(x, alternate) {
        if (btk.isArray(x)) {
            return x;
        }
        return ifArray(alternate, []);
    };
	
    var nothing = btk.nothing;
	
    btk.ifFunction = function ifFunction(x, alternate) {
        if (btk.isFunction(x)) {
            return x;
        }
        return ifFunction(alternate, nothing);
    };
	
    btk.ifObject = function ifObject(x, alternate) {
        if (btk.isObject(x)) {
            return x;
        }
        return ifObject(alternate, {});
    };
	
}(btk));


//------------------------------------------------------------
//	Path :: Class, extends Object
//
//	useful for dealing with heirarchical spaces

btk.Path = (function(btk){
    var isObject   = btk.isObject;
    var isString   = btk.isString;
    var isNumber   = btk.isNumber;
    var isArray    = btk.isArray;
    var isFunction = btk.isFunction;
	
    // default separator
    var SEPARATOR = '/';
	
    function joinsplit(arr, sep) {
        var str = arr.join(sep);
        return str.length === 0 ? [] : str.split(sep);
    }
	
    function Path(elements, separator) {
        separator = separator || SEPARATOR;
		
        if (!isString(separator)) {
            throw this.constructorError();
        }

        elements = elements || [];
		
        if (isString(elements)) {
            elements = elements.split(separator);
			
        } else if (isArray(elements)) {
            elements = joinsplit(elements, separator);
			
        } else {
            throw this.constructorError();
        }
		
        this.separator = separator;
        this.elements  = elements;
    }

    (function(p){
        p.className = "Path";
		
        p.length = function() {
            return this.elements.length;
        };
		
        p.element = function(i) {
            return this.elements[i];
        };
		
        p.slice = function(from, to) {
            from = isNumber(from)? from: 0;
            to   = isNumber(to)? to: this.elements.length;
			
            return new Path(
                this.elements.slice(from, to),
                this.separator
                );
        };
		
        p.leaf = function() {
            return this.element(this.length()-1) || '';
        };

        p.branch = function() {
            return this.slice(0, this.length()-1);
        };
		
        p.head = function() {
            return this.element(0) || '';
        };
		
        p.tail = function() {
            return this.slice(1);
        };
		
        p.join = function(other) {
            var oelements;
			
            if (other instanceof Path) {
                oelements = other.elements;
				
            } else if (isArray(other)) {
                oelements = other;
				
            } else if (isString(other)) {
                oelements = other.split(this.separator);
				
            } else {
                throw this.typeError(".join: expected other:String|Array(String)|Path");
            }
			
            return new Path(this.elements.concat(oelements), this.separator);
        };
		
        p.concat = p.join;
		
        //	apply callback to each element of the path
        p.map = function(callback, context) {
            return new Path(
                this.elements.map(callback, context),
                this.separator
                );
        };
		
        // default child retriever
        function defaultGetChild(childName) {
            return this[childName];
        }
		
        // Find the node of root that this elements leads to.
        //
        // getChild retrieves a child node from a parent node
        // given the child's name.
        p.resolve = function(root, getChild) {
            if (!isObject(root)) {
                throw this.typeError(".resolve: expected root:Object [getChild:Function]");
            }
			
            getChild = getChild || root.getChild || defaultGetChild;
            if (!isFunction(getChild)) {
                throw this.typeError(".resolve: expected root:Object [getChild:Function]");
            }
			
            // TODO
            // don't use recursion
            function resolve(parent, path) {
                if (path.length() === 0) {
                    return parent;
                }
                if (!parent) {
                    return undefined;
                }
				
                return resolve(getChild.call(parent, path.head()), path.tail());
            }
			
            return resolve(root, this);
        };
		
        // default child adder
        function defaultAddChild(childName) {
            var child = {};
            this[childName] = child;
            return child;
        };
		
        // Ensure that there is a node of root for each
        // element of this path.
        //
        // getChild is as for .resolve
        //
        // If a node is missing then use the provided addChild function
        // to add it to the parent. The parent will be 'this'.
        // The new child node must be returned.
        //
        // Returns the final node in the elements.
		
        p.ensure = function(root, getChild, addChild) {
            if (!isObject(root)) {
                throw this.typeError(".ensure: expected root:Object [getChild:Function [addChild:Function]]");
            }
			
            getChild = getChild || root.getChild || defaultGetChild;
            if (!isFunction(getChild)) {
                throw this.typeError(".ensure: expected root:Object [getChild:Function [addChild:Function]]");
            }
			
            addChild = addChild || root.addChild || defaultAddChild;
            if (!isFunction(addChild)) {
                throw this.typeError(".ensure: expected root:Object [getChild:Function [addChild:Function]]");
            }
			
            // TODO
            // don't use recursion
            function ensure(parent, path) {
                if (path.length() === 0) {
                    return parent;
                }
				
                var name  = path.head();
                var child = getChild.call(parent, name);
				
                if (!child) {
                    child = addChild.call(parent, name);
                }
				
                return ensure(child, path.tail());
            }
			
            return ensure(root, this);
        };
		
        p.toString = function() {
            return this.elements.join(this.separator);
        };
		
        p.valueOf = function() {
            return this.toString();
        };
		
        p.error = function(Klass, msg) {
            return new Klass("btk/base." + this.className + msg);
        };
		
        p.typeError = function(msg) {
            return this.error(TypeError, msg);
        };
		
        p.constructorError = function() {
            return this.typeError(": expected elements:String|Array(String) [sep:String]")
        };
		
    }(Path.prototype));
	
	
    return Path;
}(btk));


(function(btk) {
    var global = btk.global;
    var Path   = btk.Path;
	
    btk.path = function path(path, sep) {
        return new Path(path, sep);
    };
	
    // create namespaces.
    // warn if the root is global and that has not been explicitly allowed.
    btk.namespace = function namespace(namespace, root) {
        if (btk.config.allowGlobalRoot) {
            root = root || btk.global;
        } else {
            root = root || btk;
            if (root === btk.global) {
                throw new TypeError('btk.namespace: cannot create ' + namespace + ' with global root');
            }
        }
		
        return btk.path(namespace, '.').ensure(root);
    };
}(btk));


//------------------------------------------------------------
// for debugging

btk.objectToString = function(x, alternate, space, noToString) {
    function hardString(x, alternate) {
        if (!noToString) {
            try {
                return x.toString();
            } catch (e) {
                return alternate || "";
            }
        }
		
        return alternate || "";
    }
	
    if (x === null) {
        return "(null)";
		
    } else if (x === undefined) {
        return "(undefined)";
		
    } else if (!noToString && x.toString && x.toString !== Object.prototype.toString) {
        return x.toString();
		
    } else if (JSON.stringify) {
        // don't know when objects may be circular
        try {
            return JSON.stringify(
                x,
                function(k, v) {
                    switch(typeof v) {
                        case 'function':
                            var s = v.toString();
                            if (s.charAt(0) === '[') {
                                return s;
                            }
                            return s.slice(0, s.indexOf(')')) + ") { ... }";
                        default:
                            return v;
                    }
                },
                space
                );
        } catch(e) {
            return hardString(x, alternate);
        }
	
    } else {
        return hardString(x, alternate);
    }
};


//------------------------------------------------------------
// sequence object
btk.Sequence = function(initial) {
    this.init((typeof initial === "number")? initial: 0);
};

btk.Sequence.prototype = {
    init: function(initial) {
        this.initial = initial;
        this.set(initial);
        return initial;
    },
    set: function(value) {
        this.value = value;
        return value;
    },
    reset: function() {
        return this.set(this.initial);
    },
    current: function() {
        return this.value;
    },
    next: function() {
        return ++this.value;
    }
};


//------------------------------------------------------------
// object functions

btk.object = (function(btk) {
    var isObject = btk.isObject;
	
    // make sure there is a 'keys' function in Object
    // keys returns ONLY the names of enumerable properties that the object actually has.
    // it DOES NOT return the names of properties coming from the prototype chain
    // --> returns the names of top level enumerable properties
    if (!Object.keys) {
        Object.keys = function(o) {
            if (!btk.isObject(o)) {
                throw new TypeError('Object.keys called on non-object');
            }
            var ret=[], p;
            for(p in o) {
                if (o.hasOwnProperty(p)) {
                    ret.push(p);
                }
            }
            return ret;
        };
    }

    // the following functions work only with top level properties

    function isEmpty(obj)
    {
        var p;
        for (p in obj) {
            if (obj.hasOwnProperty(p)) {
                return false;
            }
        }
        return true;
    }

    function forEach(obj, fn, self)
    {
        if (!obj || !btk.isObject(obj)) {
            throw new TypeError('btk.object.forEach called on non-object');
        }
		
        var keys = Object.keys(obj);
        var length = keys.length;
        var i;
        for (i=0; i<length; i++) {
            fn.call(self, obj[keys[i]], keys[i], obj);
        }
    }

    function forEachOf(obj) {
        return function (fn, self) {
            forEach(obj, fn, self);
        };
    }
	
    function valuesOf(obj)
    {
        var values = [ ];

        forEach(obj, function(value) {
            values.push(value);
        });
		
        return values;
    }

    function mixin(target, source) {
        forEach (
            source,
            function(value, key) {
                this[key] = value;
            },
            target
            );
		
        return target;
    }
	
    function safeMixin(target, source) {
        forEach (
            source,
            function(value, key) {
                if (!this.hasOwnProperty(key)) {
                    this[key] = value;
                }
            },
            target
            );
		
        return target;
    }
	
    var create = (function(){
        if (Object.create) {
            return Object.create;
        }
		
        if ({}.hasOwnProperty("__proto__")) {
            return function(proto) {
                var temp = {};
                temp["__proto__"] = proto;
                return temp;
            };
        }	
		
        return function(proto) {
            function Temp() {}
			
            Temp.prototype = proto;

            return new Temp();
        };
    }());
	

    //class inheritance
    //eg.
    //function parentClass(...) {...}
    //parentClass.prototype.foo = function(...) {...}
    //
    //function childClass(...)
    //{
    //		this._superClass_.call(this, ...);
    //		...
    //}
    //btk.inherts(childClass, parentClass);
    //
    //childClass.prototype.foo = function(...)
    //{
    //		this._super_.foo.call(this, ...);
    //		...
    //}
    //
    //!!! NOTE !!!
    //in parentClass.prototype.foo
    //		this._super_.foo.call(this, ...);
    //will call parentClass.prototype.foo
    //
    //it is better to use
    //		childClass.SUPER
    //		childClass.SUPERCLASS

    //helper function
    //creates an object with the given prototype
    function inherits(child, parent) {
        child.prototype = btk.object.create(parent.prototype);
        child.prototype.constructor = child;
		
        child.SUPERCLASS = parent;
        child.SUPER      = parent.prototype;
    }

    return {
        isEmpty: isEmpty,
        forEach: forEach,
        forEachOf: forEachOf,
        keysOf: Object.keys,
        valuesOf: valuesOf,
        mixin: mixin,
        safeMixin: safeMixin,
        create: create,
        inherits: inherits
    };
}(btk));

btk.inherits = btk.object.inherits;


//------------------------------------------------------------
// timer stuff

(function(btk){
    btk.setTimeout = function(func, period) {
        return btk.global.setTimeout(func, period);
    };

    btk.clearTimeout = function(tid) {
        btk.global.clearTimeout(tid);
    };

    var IntervalTimer = (function(btk) {
        var ifFunction = btk.ifFunction;
        var ifNumber   = btk.ifNumber;
		
        function IntervalTimer(func, period, context) {
            this.func    = ifFunction(func);
            this.period  = ifNumber(period, 1000);
            this.context = ifObject(context, {});
            this.running = false;
        }
		
        (function(p){
		
            p.className = 'IntervalTimer';
			
            function step(that) {
                that.tid = btk.setTimeout(
                    function() {
                        that.func.call(that.context, that);
                        if (that.running) {
                            step(that);
                        }
                    },
                    that.period
                    );
            }
			
            p.start = function() {
                if (this.running) {
                    return this;
                }
				
                step(this);
				
                this.running = true;
				
                return this;
            };
			
            p.stop = function() {
                if (!this.running) {
                    return this;
                }
				
                this.running = false;
				
                btk.clearTimeout(this.tid);
                delete this.tid;
				
                return this;
            };
			
            p.toString = function() {
                return this.className + '(' + String(this.tid) + ')';
            };
			
        }(IntervalTimer.prototype));
		
        return IntervalTimer;
    }(btk));

    btk.setInterval = function(func, period, context) {
        return new IntervalTimer(func, period, context).start();
    };
	
    btk.clearInterval = function(intervalTimer) {
        intervalTimer.stop();
    };
}(btk));


//============================================================
// very basic message routine
// should be replaced if you want something better

btk.message = (function(btk){
    var buffer = [];
	
    function message(msg) {
        buffer.push(msg);
    }
	
    message.buffer = buffer;
	
    message.clear = function() {
        buffer = [];
    };
	
    return message;
}(btk));


if (btk.config.debug) {
    btk.dmsg = function(msg) {
        btk.message(msg)
        };
} else {
    btk.dmsg = btk.nothing;
}


//============================================================
btk.taskqueue = (function(btk) {
    // some imports
    var setTimeout = btk.global.setTimeout;
    //var dmsg       = btk.dmsg;
	
	
    // prepare for exports
    var exports = {};

	
    //--------------------------------------------------------
    function Callback(callback, args, context) {
        this.context  = context;
        this.callback = callback;
        this.args     = args;
        this.context  = context;
    }
	
    Callback.prototype = {
        className: "Callback",
		
        run: function() {
            this.callback.apply(this.context, this.args);
        }
    };
	
    exports.Callback = Callback;
	
	
    //--------------------------------------------------------
    // a task queue
    //
    // future:
    //		implement a better task queueing mechanism
    //		? based on the browser events
    //		? can I create my own events
	
    var taskQueueId = new btk.Sequence(0);
	
    function TaskQueue(period) {
        this.id = taskQueueId.next();
		
        this.period = (typeof period === "number")? period : 0;
		
        this.reset();
    }
	
    (function(p){
        p.className = "TaskQueue";
		
        p.reset = function() {
            this.queue = [];
            this.add   = this.add1;
        };
		
        p.add1 = function(callback) {
            this.queue.push(callback);

            this.add = this.add2;
			
            this.triggerFlush();
        };
		
        p.add2 = function(callback) {
            this.queue.push(callback);
        };
		
        p.triggerFlush = function() {
            // using setTimeout for asynchronous tasks seems clumsy to me
            // don't know a different way yet
            var that = this;
            setTimeout(function(){
                that.flush();
            }, this.period);
        };
		
        // this is probably not the best way to do things
        // it is quicker though
        p.flush = function() {
            var queue = this.queue;
			
            // having reset here slows things down HEAPS
            //this.reset();
			
            var i = 0;
            while (i < queue.length) {
                queue[i].run();
                i++;
            }
		
            this.reset();
        };
		
        p.xflush = function() {
            var queue = this.queue;
			
            var callback;
            while (callback = queue.shift()) {
                callback.run();
            }
			
            //this.reset();
            this.add = this.add1;
        };
		
    }(TaskQueue.prototype));
	
    exports.TaskQueue = TaskQueue;
	
    return exports;
}(btk));


//============================================================
// a task queue to facilitate deferred execution
// no reason why it should not be shared

btk.defer = (function(btk){
    var taskqueue = btk.taskqueue;
    var TaskQueue = taskqueue.TaskQueue;
    var Callback  = taskqueue.Callback;
	
    var taskQueue = new TaskQueue();

    var tq_defer = function(callback, args, context) {
        taskQueue.add(new Callback(callback, args, context));
    };

    var setTimeout = btk.setTimeout;
	
    // this is MUCH slower than tq_defer
    // there must be a significant overhead for setTimeout calls
    var to_defer = function(callback, args, context) {
        setTimeout(
            function() {
                callback.apply(context, args);
            },
            1
        );
    };
	
    // this is a bit slower than tq_defer
    // but it interacts better with dom events
    // and it is a true deferal
    var pm_defer = (function() {
        var doc = "a message queue implemented using window.postMessage";
		
        var q = [];
		
        var key = 'defer:' + Date.now() + ':' + Math.random();
		
        var source = btk.global;
        var target = btk.global;
        var origin = target.document.location.origin;
		
        var running = false;
        var pinged = false;
        var processing = false;
        
        var ping = function() {
            if (!pinged && !processing) {
                if (running && q.length > 0) {
                    target.postMessage(key, origin);
                    pinged = true;
                }
            }
        };
        
        // page is always responsive
        // lots of pings can occur
        var processSingleTasks = function() {
            q.shift().run();
        };

        // page will remain responsive during infinite task loops
        // fewer pings
        var processCurrentTasks = function() {
            processing = true;
            
            var len = q.length;
            
            do {
                q.shift().run();
                len--;
            }
            while (len > 0);
            
            processing = false;
        };
        
        // page will be unresponsive during infinite task loops
        // much fewer pings
        var processAllTasks = function() {
            processing = true;
            
            do {
                q.shift().run();
            }
            while (q.length > 0);
            
            processing = false;
        };
        
        // page will remain responsive during infinite task loops
        // fewer pings than processCurrentTask
        // this seems to be the best way to go
        var limit = 1000;
        var processBulkTasks = function() {
            processing = true;
            
            var count = 0;
            
            do {
                q.shift().run();
                count++;
            }
            while (count < limit && q.length > 0);
            
            processing = false;
        };
        
        var processTasks = processBulkTasks;
        
        
        var defer = function(callback, args, context) {
            if (running) {
                q.push(new Callback(callback, args, context));
                ping();
            }
        };
		
        var receive = function(event) {
            /* don't really need to be checking this
            if (event.origin !== origin) {
                return;
            }
			*/
            if (event.source !== source) {
                return;
            }
			
            if (event.data !== key) {
                return;
            }

            pinged = false;
            processTasks();
            ping();
        };
		
        
        defer.processSingleTasks = function() {
            processTasks = processSingleTasks;
        };
        
        defer.processCurrentTasks = function() {
            processTasks = processCurrentTasks;
        };
        
        defer.processAllTasks = function() {
            processTasks = processAllTasks;
        };
        
        defer.processBulkTasks = function() {
            processTasks = processBulkTasks;
        };
        
        defer.setLimit = function(newLimit) {
            limit = btk.ifNumber(newLimit, limit);
        };
        
        defer.getLimit = function() {
            return limit;
        };
        
        defer.start = function() {
            if (!running) {
                target.addEventListener('message', receive, false);
                running = true;
                ping();
            }
        };
		
        defer.stop = function() {
            if (running) {
                pinged = false;
                running = false;
                target.removeEventListener('message', receive);
            }
        };
		
        defer.reset = function() {
            defer.stop();
            q = [];
            defer.start();
        };

        return defer;
    })();


    // see http://dev.w3.org/html5/postmsg/#channel-messaging
    // identical to pm_defer except for the ping method
    // this seems to be, by far, the best approach
    var port_defer = (function(){
        var doc = "a message queue implemented using ports";
		
        // these will be filled by the start() function
        var channel;
        var source;
        var target;
		
        var q = [];
		
        var running = false;
        var pinged = false;
        var processing = false;
        
        var ping = function() {
            if (!pinged && !processing) {
                if (running & q.length > 0) {
                    pinged = true;
                    // I only need for a message to be sent
                    // I do not care what the data is
                    source.postMessage();
                }
            }
        };
        
        // page is always responsive
        // lots of pings can occur
        var processSingleTasks = function() {
            q.shift().run();
        };

        // page will remain responsive during infinite task loops
        // fewer pings
        var processCurrentTasks = function() {
            processing = true;
            
            var len = q.length;
            
            do {
                q.shift().run();
                len--;
            }
            while (len > 0);
            
            processing = false;
        };
        
        // page will be unresponsive during infinite task loops
        // much fewer pings
        var processAllTasks = function() {
            processing = true;
            
            do {
                q.shift().run();
            }
            while (q.length > 0);
            
            processing = false;
        };
        
        // page will remain responsive during infinite task loops
        // fewer pings than processCurrentTask
        // this seems to be the best way to go
        var limit = 1000;
        var processBulkTasks = function() {
            processing = true;
            
            var count = 0;
            
            do {
                q.shift().run();
                count++;
            }
            while (count < limit && q.length > 0);
            
            processing = false;
        };
        
        var processTasks = processBulkTasks;
        
        
        var defer = function(callback, args, context) {
            q.push(new Callback(callback, args, context));
            ping();
        };
		
        var receive = function() {
            pinged = false;
            processTasks();
            ping();
        };


        // TEST TEST TEST
        defer.getSource = function() {
            return source;
        };
        
        defer.getTarget = function() {
            return target;
        };
        
        defer.processSingleTasks = function() {
            processTasks = processSingleTasks;
        };
        
        defer.processCurrentTasks = function() {
            processTasks = processCurrentTasks;
        };
        
        defer.processAllTasks = function() {
            processTasks = processAllTasks;
        };
        
        defer.processBulkTasks = function() {
            processTasks = processBulkTasks;
        };
        
        defer.setLimit = function(newLimit) {
            limit = btk.ifNumber(newLimit, limit);
        };
        
        defer.getLimit = function() {
            return limit;
        };
        
        defer.start = function() {
            if (!running) {
                channel = new MessageChannel();
                
                source = channel.port1;
                
                target = channel.port2;
                target.addEventListener('message', receive, false);
                target.start();
                
                running = true;
                ping();
            }
        };
		
        defer.stop = function() {
            if (running) {
                pinged = false;
                running = false;
                
                target.removeEventListener('message', receive);
                target.close();
                target = undefined;
                
                source.close();
                source = undefined;
                
                channel = undefined;
            }
        };
		
        defer.reset = function() {
            defer.stop();
            q = [];
            defer.start();
        };

        return defer;
    })();
    
    // nice idea
    // does not work though
    // it seems that event dispatching is not really defered
    // see https://developer.mozilla.org/en/DOM/element.dispatchEvent
    var ce_defer = (function() {
        var doc = "a message queue implemented using custom events";
		
        var eventType = 'deferedFunction';
		
        var target = btk.global;
        //	var target = btk.document;
        //	var target = document.createElement('div');
		
        var running = false;
		
        var defer = function(context, callback, args) {
            var event = new CustomEvent(
                eventType,
                {
                    'detail': new Callback(context, callback, args)
                    }
                );
            target.dispatchEvent(event);
        };
		
        var receive = function(event) {
            //	console.log(event);
            event.detail.run();
        };
		
        defer.start = function() {
            if (!running) {
                target.addEventListener(eventType, receive, false);
                running = true;
            }
        };
		
        defer.stop = function() {
            if (running) {
                running = false;
                target.removeEventListener(eventType, receive);
            }
        };

        return defer;
    })();
	
    
    //return tq_defer;
	
    //return to_defer;
	
    //pm_defer.start();
    //return pm_defer;
	
    port_defer.start();
    return port_defer;
    
    //ce_defer.start();
    //return ce_defer;
	
}(btk));


//============================================================
btk.Publisher = (function(btk){

    // imports
	
    var nothing    = btk.nothing;
    var isDefined  = btk.isDefined;
    var isObject   = btk.isObject;
    var isString   = btk.isString;
    var isFunction = btk.isFunction;
    var create     = btk.object.create;
	
    var forEach    = btk.object.forEach;
	
    var defer      = btk.defer;
	
	
    //--------------------------------------------------------
    // message types
    var OK      = "ok";
    var ERROR   = "error";
    var INFO    = "info";
	
    // catch all handler type
    var DEFAULT = "default";
	
    //--------------------------------------------------------
    function Message(type, data, block, trace) {
        this.type = type || OK;
        this.data = data;
        this.block = !!block;
        this.trace = !!trace;
    }
	
    (function(p){
	
        p.className = 'Message';
		
        p.stop = function() {
            this.stopped = true;
        };

        p.handled = p.stop;
		
        p.toString = function() {
            return this.className + JSON.stringify(this);
        }
		
    }(Message.prototype));
	
	
    //--------------------------------------------------------
    var clientUsage = [
    "btk/base.Publisher.Client: expected",
    "[onOk:Function]",
    "[onError:Function]",
    "[onInfo:Function]",
    "[onDefault:Function]",
    "[context:Object]"
    ].join(" ");
	
	
    var clientId = new btk.Sequence(0);
		
    function Client() {
        this.id = clientId.next();
		
        this.handle = {};
		
        if (arguments.length > 0) {
            var a0 = arguments[0];
            if (isDefined(a0) && !isFunction(a0)) {
                this.fromAssignemnts(a0, arguments[1]);
            } else {
                this.fromFunctions(arguments);
            }
        } else {
            this.context = {};
        }
    }
	
	
    (function(p){
	
        p.className = "Client";
		
        p.fromAssignemnts = function(assignments, context) {
            if (isObject(assignments)) {
                forEach(assignments,
                    function(handler, type) {
                        this.on(type, handler);
                    },
                    this
                    );
            }
			
            this.context = context || {};
        };
		
        p.fromFunctions = function(functions) {
            var length  = functions.length;
            var context = functions[length-1];
			
            if (!isFunction(context)) {
                length--;
            } else {
                context = {};
            }
            this.context = context;
			
            if (length > 0) {
                this.on(OK     , functions[0]);
            }
            if (length > 1) {
                this.on(ERROR  , functions[1]);
            }
            if (length > 2) {
                this.on(INFO   , functions[2]);
            }
            if (length > 3) {
                this.on(DEFAULT, functions[3]);
            }
        };
		
        p.receive = function(message) {
            var handler = this.get(message.type);
            if (handler) {
                return handler.call(this.context, message.data, message);
            }
            return undefined;
        };
		
        p.process = function(message) {
            var data = this.receive(message);
            if (!message.stopped) {
                return new Message(
                    message.type,
                    (data !== undefined)? data: message.data,
                    message.block,
                    message.trace
                    );
            }
            return undefined;
        };
		
        p.get = function(type) {
            type = type || OK;
            if (!isString(type)) {
                throw new TypeError("btk/base.Publisher.Client.get: expected type:String");
            }
			
            return this.handle[type] || this.handle[DEFAULT];
        };
		
        p.on = function(type, handler) {
            type = type || OK;
            if (!isString(type)) {
                throw new TypeError("btk/base.Publisher.Client.on: expected type:String handler:Function");
            }
			
            if (handler) {
                if (!isFunction(handler)) {
                    throw new TypeError("btk/base.Publisher.Client.on[" + type + "]: expected handler:Function");
                }
				
                this.handle[type] = handler;
            }
			
            return this;
        };
		
        p.off = function(type) {
            type = type || OK;
            if (!isString(type)) {
                throw new TypeError("btk/base.Publisher.Client.off: expected type:String");
            }
			
            delete this.handle[type];
			
            return this;
        };
		
        p.getContext = function() {
            return this.context;
        };
		
        p.setContext = function(context) {
            if (!isObject(context)) {
                throw new TypeError("btk/base.Publisher.Client.setContext: expected context:Object");
            }
			
            this.context = context;
			
            return this;
        };
		
        p.toString = function() {
            return this.className + "(" + this.id + ")";
        };
		
    }(Client.prototype));
	
	
    //--------------------------------------------------------
    var subscriptionId = new btk.Sequence(0);
	
    function Subscription(publisher, client) {
        this.id = subscriptionId.next();
		
        this.publisher = publisher;
        this.client    = client;
    }
	
	
    (function(p){

        p.className = "Subscription";
		
        p.invalidate = function() {
            delete this.publisher;
            delete this.client;
			
            if (isFunction(this.onCancel)) {
                this.onCancel.call(this);
            }
        };
	
        p.isValid = function() {
            return !!this.publisher && !!this.client;
        };
		
        p.cancel = function() {
            if (this.isValid()) {
                this.publisher.cancelSubscription(this);
            // delegate cancellation to the publisher
            // who knows whether the publisher actually removes the subscription
            // leave invalidating up to the publisher
            //this.invalidate();
            }
        };
	
        p.toString = function() {
            return [
            this.className,
            "(",
            this.id,
            ",",
            this.publisher? this.publisher.toString(): "no publisher",
            ",",
            this.client? this.client.toString(): "no client",
            ")"
            ].join('');
        };
		
    }(Subscription.prototype));
	
	
    //--------------------------------------------------------
    var publisherId = new btk.Sequence(0);
	
    function Publisher() {
        this.id = this.id || publisherId.next();
		
        this.subscriptions = {};
    }
	
	
    (function(p){
	
        p.className = "Publisher";
		
        p.subscribe = function(/* Client | handler:Function*, context:Object? */) {
            if (this.retired) {
                return undefined;
            }
			
            var client = arguments[0];
			
            // any object that has a receive method is allowed to be a client
            if (!isObject(client) || !client.receive) {
                client = create(Client.prototype);
                Client.apply(client, arguments);
            }
			
            var subscription = new Subscription(this, client);
			
            if (this.blocked) {
                subscription.invalidate();
            } else {
                this.subscriptions[subscription.id] = subscription;
            }
			
            if (this.message) {
                this.send(client, this.message);
            }
			
            return subscription;
        };
		
        p.cancelSubscription = function(subscription) {
            subscription.invalidate();
            delete this.subscriptions[subscription.id];
        };
		
        p.cancelAllSubscriptions = function(/* subscriptions */) {
            forEach(
                this.subscriptions,
                function(subscription) {
                    subscription.invalidate();
                }
                );
			
            this.subscriptions = {};
        };
		
        p.send = function(client, message) {
            defer(client.receive, [message], client);
        };
		
        p.transmit = function(message) {
            if (this.blocked) {
                return this;
            }
			
            message.from = this;
			
            forEach(
                this.subscriptions,
                function(subscription) {
                    this.send(subscription.client, message);
                },
                this
                );
			
            this.message = message.trace? message: null;
			
            this.blocked = message.block;
			
            if (this.blocked) {
                // clients will no longer be sent any messages
                // so cancel all their subscriptions.
                this.cancelAllSubscriptions();
            }
			
            return this;
        };
		
        // so that publishers can be clients too.
        p.receive = p.transmit;
		
        p.publish = function(data) {
            return this.transmit(new Message(OK, data, false, false));
        };
		
        p.ok = function(data) {
            return this.transmit(new Message(OK, data, true, true));
        };
		
        p.error = function(data) {
            return this.transmit(new Message(ERROR, data, true, true));
        };
		
        p.info = function(data, block, trace) {
            return this.transmit(new Message(INFO, data, block, trace));
        };
		
        p.progress = p.info;
        p.update   = p.info;
		
        p.retire = function() {
            this.blocked = true;
            this.message = null;
            this.clients = {};
			
            this.retired = true;
			
            return this;
        };
		
        p.query = function() {
            return {
                retired: this.retired,
                blocked: this.blocked,
                message: this.message
            }
        };
		
        p.toString = function() {
            return this.className + "(" + this.id.toString() + ")";
        };
		
    }(Publisher.prototype));
	
	
    //--------------------------------------------------------
    Publisher.Client       = Client;
    Publisher.Message      = Message;
    Publisher.Subscription = Subscription;
    Publisher.OK           = OK;
    Publisher.ERROR        = ERROR;
    Publisher.INFO         = INFO;
    Publisher.DEFAULT      = DEFAULT;
	
    return Publisher;
	
}(btk));


//============================================================
btk.topic = (function(btk){

    // imports
    var slice = [].slice;
	
    var isObject = btk.isObject;
    var forEach  = btk.object.forEach;
    var keys     = btk.object.keysOf;
	
    var Path         = btk.Path;
    var Publisher    = btk.Publisher;
    var Client       = Publisher.Client;
    var Message      = Publisher.Message;
    var Subscription = Publisher.Subscription;
    var OK           = Publisher.OK;
    var DEFAULT      = Publisher.DEFAULT;
	
	
	
    //--------------------------------------------------------
    // prepare for exports
    var exports = {};
	
	
    //--------------------------------------------------------
    var SEPARATOR = "::";
    exports.SEPARATOR = SEPARATOR;

	
    //--------------------------------------------------------
    function Topic(name, parent) {
        Topic.SUPERCLASS.call(this);
		
        this.setParent(parent);
        this.setName(name);
		
        this.children = {};
    }
    btk.inherits(Topic, Publisher);
	
	
    Topic.path = function(spath) {
        if (spath instanceof Path) {
            return spath;
        }
		
        return new Path(spath, SEPARATOR);
    };
	
	
    (function(p){
        p.className = "Topic";
		
        p.getName = function() {
            return this.name;
        };
		
        p.getFullName = function() {
            return this.getPath().toString();
        };
		
        p.setName = function(name) {
            this.name = name;
            return this;
        };
		
        p.getParent = function() {
            return this.parent;
        };
		
        p.setParent = function(parent) {
            this.parent = parent;
            return this;
        };
		
        p.addElements = function(elements) {
            if (this.parent) {
                this.parent.addElements(elements);
                elements.push(this.name);
            }
        };
		
        p.getPath = function() {
            var elements = [];
            this.addElements(elements);
            return Topic.path(elements);
        };
		
        p.getChild = function(name) {
            return this.children[name];
        };
		
        p.addChild = function(name) {
            var child = this.getChild(name);

            if (!child) {
                child = new Topic(name, this);
                this.children[name] = child;
            }
			
            return child;
        };
		
        p.removeChild = function(name) {
            var child = this.getChild(name);
            if (child) {
                child.setParent(null);
                delete this.children[name];
            }
            return this;
        };
		
        p.retire = function() {
            Topic.SUPER.retire.call(this);

            // recursively retire and remove child topics
            forEach(this.children, function(child) {
                child.setParent(null);
                child.retire();
            });
			
            this.children = {};
			
            return this;
        };
		
        p.toString = function() {
            return [
            this.className, '(',
            this.getFullName(),
            ')'
            ].join("");
        };
    }(Topic.prototype));


    var root = new Topic();

    // TEST
    if (btk.config.test) {
        exports.root = root;
    }
	
	
    //--------------------------------------------------------
    // management functions
    //--------------------------------------------------------
    function resolve(spath) {
        return Topic.path(spath).resolve(root);
    }

	
    //--------------------------------------------------------
    function ensure(spath) {
        return Topic.path(spath).ensure(root);
    }

	
    //--------------------------------------------------------
    function remove(spath) {
        var child  = resolve(spath);
        var parent = child && child.parent;
		
        if (parent) {
            parent.removeChild(child.getName());
        }
		
        return child;
    }

	
    //--------------------------------------------------------
    // interface functions
    //--------------------------------------------------------
    function open(spath) {
        return ensure(spath).getFullName();
    }
    exports.open = open;
	
	
    //--------------------------------------------------------
    function close(spath) {
        var child = remove(spath);
		
        if (child) {
            child.retire();
        }
    };

    exports.close = close;

	
    //--------------------------------------------------------
    function fpublish(spath, message) {
        ensure(spath).transmit(message);
    }
    exports.fpublish = fpublish;

	
    function publish(spath, data) {
        fpublish(spath, new Message(OK, data));
    };
    exports.publish = publish;

	
    //--------------------------------------------------------
    function subscribe(spath /* Client | Function*, context? */) {
        var topic = ensure(spath);
		
        return topic.subscribe.apply(topic, slice.call(arguments, 1));
    }
    exports.subscribe = subscribe;

	
    //--------------------------------------------------------
    function unsubscribe(subscription){
        if (!(subscription instanceof Subscription)) {
            throw new TypeError("btk/base.topic.unsubscribe: invalid subscription");
        }
		
        subscription.cancel();
    }
    exports.unsubscribe = unsubscribe;
    exports.cancel = unsubscribe;
	
	
    //--------------------------------------------------------
    function block(spath, data) {
        fpublish(spath, {
            data:data, 
            type:OK, 
            block:true, 
            trace:true
        });
    }
    exports.block = block;
	
	
    function trace(spath, data) {
        fpublish(spath, {
            data:data, 
            type:OK, 
            trace:true
        });
    }
    exports.trace = trace;
	
	
    //--------------------------------------------------------
    function link(spath1, spath2) {
        var topic1 = ensure(spath1);
        var topic2 = ensure(spath2);
		
        return topic1.subscribe(topic2);
    }
    exports.link = link;
	
	
    //--------------------------------------------------------
    // some query functions
    //--------------------------------------------------------
    function query(spath) {
        var topic = resolve(spath);

        return topic? topic.query(): {};
    }
    exports.query = query;
	
	
    //--------------------------------------------------------
    function exists(spath) {
        return !!resolve(spath);
    }
    exports.exists = exists;
	
	
    //--------------------------------------------------------
    function getTopics(spath) {
        var topic = resolve(spath);
		
        if (topic) {
            return Object.keys(topic.children);
        }
		
        return [];
    }
    exports.getTopics = getTopics;
	
	
    //--------------------------------------------------------
    function getAllTopics(spath) {
        var topics = [];

        function accumulateTopics(parent) {
            forEach(parent.children, function(child){
                topics.push(child.getFullName());
                accumulateTopics(child);
            });
        }
		
        var root = resolve(spath);
        if (root) {
            accumulateTopics(resolve(spath));
        }
		
        return topics;
    }
    exports.getAllTopics = getAllTopics;
	
	
    //--------------------------------------------------------
    return exports;
	
}(btk));

// for convenience
btk.publish     = btk.topic.publish;
btk.fpublish    = btk.topic.fpublish;
btk.subscribe   = btk.topic.subscribe;
btk.unsubscribe = btk.topic.unsubscribe;

btk.trigger = (function(btk){
    var publish = btk.publish;
    var block   = btk.topic.block;
	
    return {
        event: function(name, value) {
            //console.info("btk.trigger.event: " + name);
            if (typeof value === "undefined") {
                value = Date.now();
            }
            publish("event::" + name, value);
        },
		
        state: function(name, value) {
            //console.info("btk.trigger.state: " + name);
            if (typeof value === "undefined") {
                value = Date.now();
            }
            block("state::" + name, value);
        }
    };
}(btk));


//============================================================
// revamp the message routine
btk.message = (function(omsg){
    var Publisher = btk.Publisher;
    var Message   = Publisher.Message;
    var DATA      = Publisher.OK;
    var STATE     = Publisher.INFO;
	
    var LOGTOPIC = 'btk::log';
    var CLEAR = 'clear';

    var buffer = omsg.buffer;

    function nmsg(data) {
        buffer.push(data);
        btk.fpublish(LOGTOPIC, new Message(DATA, data));
    }
	
    nmsg.clear = function() {
        buffer = [];
        btk.fpublish(LOGTOPIC, new Message(STATE, CLEAR));
    };
	
    nmsg.buffer = buffer;
    nmsg.LOGTOPIC = LOGTOPIC;
    nmsg.DATA  = DATA;
    nmsg.STATE = STATE;
    nmsg.CLEAR = CLEAR;
	
    return nmsg;
}(btk.message));


//============================================================
btk.module = (function(btk, kob, kto){

    // imports
    var forEach    = kob.forEach;
    var isObject   = btk.isObject;
    var isString   = btk.isString;
    var isArray    = btk.isArray;
    var isFunction = btk.isFunction;
	
    var Path       = btk.Path;
	
    var dmsg       = btk.dmsg;
    //var dmsg       = function(msg) { btk.message(msg) };
	
    //--------------------------------------------------------
    // prepare for exports
    var exports = {};


    //--------------------------------------------------------
    // modules are going to be held here
    var modules = {};
	
    function getModule(spec) {
        var speclib = spec.library;
        var modlib = (modules[speclib] = modules[speclib] || {});
		
        return modlib[spec.name];
    }
	
    function addModule(module) {
        var spec = module.spec;
        var speclib = spec.library;
        var modlib = (modules[speclib] = modules[speclib] || {});
		
        return (modlib[spec.name] = module);
    }

    function removeSpec(spec) {
        delete modules[spec.library][spec.name]
    }
	
    function removeModule(module) {
        removeSpec(module.spec);
    }
	
    // explicit module sources are remembered to track load state
    var sources = {};
	
    function special(s) {
        return '#' + s;
    }
    exports.special = special;
	
    var anonId = new btk.Sequence(0);
	
    function anonymous() {
        return special(String(anonId.next()));
    }
	

    //--------------------------------------------------------
    var NEEDED     = "needed";
    var LOADED     = "loaded";
    var RESOLVED   = "resolved";
    var VALUE      = "value";
    var LOADFAILED = "loadfailed";
    var FAILED     = "failed";
	
    var SEP        = kto.SEPARATOR;
	
    var state = (function() {
        var FORUM = "btk.module";
		
        function state(moduleSpec, moduleState) {
            return [
            FORUM,
            moduleSpec.library,
            moduleSpec.name,
            moduleState
            ].join(SEP);
        }

        state.forum = function forum() {
            return FORUM;
        };
		
        state.base = function base(moduleSpec) {
            return [
            FORUM,
            moduleSpec.library,
            moduleSpec.name
            ].join(SEP);
        };
		
        state.NEEDED     = NEEDED;
        state.LOADED     = LOADED;
        state.RESOLVED   = RESOLVED;
        state.VALUE      = VALUE;
        state.LOADFAILED = LOADFAILED;
        state.FAILED     = FAILED;
		
        return state;
    }());
	
    exports.state = state;
	
    // trigger a particular state for the module
    // state should only be 'needed', 'injected', 'loaded', 'failed' or undefined
    function trigger(moduleSpec, moduleState) {
        var stateName = (typeof moduleState === "string")?
        state(moduleSpec, moduleState):
        state.base(moduleSpec);
        kto.block(stateName, true);
    }

    // TEST
    if (btk.config.test) {
        // !!! NOTE !!!
        // should not be exposing these.
        // do so for testing purposes only.
        exports.modules = modules;
        exports.addModule = addModule;
        exports.getModule = getModule;
        exports.sources = sources;
        exports.trigger = trigger;
    }
	
	
    //--------------------------------------------------------
    // the key to use for loader modules.
    // they are automatically filtered out of imports
    var LOADER = special("loader");
	
	
    //----------------------------------------------------
    //	a space of values used for resolving module paths.
    //
    //	Path(['a','$b','c','d']) --> Path(['a',alias['b'],'c','d'])
    //
    //	also used to store other values.
	
    var alias = {};
	
    function getAlias(name) {
        return alias[name] || '';
    }
    exports.getAlias = getAlias;
	
    getAlias.special = function(name) {
        return getAlias(special(name));
    };
	
    //	replace all aliases with their values.
    //	if there is no associated value then replace it with the name
    Path.prototype.resolveAliases = function() {
        return this.map( function(element) {
            var name;
			
            if (element.charAt(0) === "$") {
                name = element.slice(1);
                return alias[name] || name;
            }
			
            return element;
        });
    };
	
    function resolveAliases(str) {
        return new Path(str).resolveAliases().toString();
    }
    exports.resolveAliases = resolveAliases;
	
    function setAlias(name, value) {
        alias[name] = resolveAliases(value);
        return value;
    }
    exports.setAlias = setAlias;
	
    setAlias.special = function(name, value) {
        return setAlias(special(name), value);
    };
	
	
    //--------------------------------------------------------
    var Spec = (function(){
        var NAM = 0;
        var LIB = 1;
        var SRC = 2;

        getAlias.library = {
            prefix: function(library) {
                return getAlias(library + ':prefix');
            },
            source: function(library) {
                return getAlias(library + ':source');
            },
            postfix: function(library) {
                return getAlias(library + ':postfix');
            },
            path: function(library) { // relative to the page
                return getAlias(library + ':path');
            }
        };
		
        setAlias.library = {
            prefix: function(library, prefix) {
                return setAlias(library + ':prefix', prefix);
            },
            source: function(library, source) {
                return setAlias(library + ':source', source);
            },
            postfix: function(library, postfix) {
                return setAlias(library + ':postfix', postfix);
            },
            path: function(library, path) {
                return setAlias(library + ':path', path);
            }
        };
		
        var sources = {};
		
        function getSource(lib, name) {
            return (sources[lib] || {})[name] || '';
        }
		
        function setSource(lib, name, src) {
            lib = (sources[lib] = sources[lib] || {});
			
            return (lib[name] = lib[name] || src || '');
        }
		
        function getOrphanLibrary(name) {
            var base = getAlias.special('privateOrphans') ||
            getAlias.special('orphan') ||
            special('orphan');
			
            return name? base + SEP + special(name): base;
        }
		
        function Spec(spec) {
            var spec1 = spec || [];
            if (isString(spec1)) {
                spec1 = spec1.split('@');
            }
			
            if (!isArray(spec1)) {
                throw new TypeError('btk/module.Spec: expected spec:String|Array(String)');
            }
			
            this.spec = spec1.join('@');
			
            spec1[NAM] = resolveAliases(spec1[NAM]);
            spec1[SRC] = resolveAliases(spec1[SRC]);
            spec1[LIB] = resolveAliases(spec1[LIB]);
			
            var spec2 = [];
            var anon;
			
            if (spec1[NAM] !== '') {
                spec2[NAM] = spec1[NAM];
                anon = false;
            } else {
                spec2[NAM] = anonymous();
                anon = true;
            }
			
            if (anon) {
                spec2[LIB] = getOrphanLibrary('anonymous');
                spec2[SRC] = '';
            } else {
                spec2[LIB] = spec1[LIB] || getOrphanLibrary();
                ;
			
                spec2[SRC] = getSource( spec2[LIB], spec2[NAM] );
                if (!spec2[SRC]) {
                    spec2[SRC] = getAlias.library.prefix(spec2[LIB]) + (
                        spec1[SRC] ||
                        getAlias.library.source(spec2[LIB]) ||
                        ''
                        ) + getAlias.library.postfix(spec2[LIB]);
					
                    //	if (spec2[SRC].charAt(spec2[SRC].length-1) === '/') {
                    //		spec2[SRC] = spec2[SRC] + spec2[NAM];
                    //	}
					
                    setSource(spec2[LIB],spec2[NAM],spec2[SRC]);
                }
            }
			
            this.anonymous = anon;
            this.name      = spec2[NAM];
            this.source    = spec2[SRC];
            this.library   = spec2[LIB];
        }

		
        (function(p){
		
            p.className = 'Spec';

            p.uid = function() {
                return this.library + '::' + this.name;
            };
			
            function base(name) {
                return name.split('.')[0];
            }
			
            p.getPath = function(path) {
                path = path || this.source || getAlias.library.path(this.library);
				
                if (path.charAt(path.length-1) === '/') {
                    path += base(this.name);
                }
				
                return path || base(this.name);
            };
			
            p.toArray = function() {
                return [this.name, this.library, this.source];
            };
			
            p.toString = function() {
                var str = this.name + '@' + this.library;
				
                if (this.source) {
                    str += '@' + this.source;
                }
				
                return str;
            };
			
            p.valueOf = p.toString;
			
        }(Spec.prototype));
		
		
        // TEST
        Spec.sources = sources;
		
		
        return Spec;
    }());
    exports.Spec = Spec;
	
	
    //----------------------------------------------------
    // module loading is deferred so that scripts may contain 
    // multiple interdependent module definitions that may occur
    // in any order

    function inject(spec, href) {
        //	load event fires AFTER the script has been executed.
        //	even if there was an error in execution.
        //	does not fire if there was no script (GET error)
        //	NOTE IE9
        //		fires even if there is a GET error.
        //		
        function onload(name, href) {
            /*	if (console && console.info) {
				console.info("btk/module.onload(" + name + "): " + href);
			}
			btk.message("#btk/module.onload(" + name + "): " + href);
		*/	
            setAlias.special('privateOrphans', '');
            trigger(spec, LOADED);
        }
		
        //	error event fires for missing sources (GET error)
        //	NOTE Firefox
        //		does not fire for dynamic scripts.
        //	NOTE IE9
        //		fires after load
        //		as it should
        function onerror(name, href) {
            /*	if (console && console.info) {
				console.info("btk/module.onerror(" + name + "): " + href);
			}
			btk.message("*btk/module.onerror(" + name + "): " + href);
		*/	
            trigger(spec, LOADFAILED);
        }
		
        href = href || spec.getPath() + '.js';
        if (!sources[href]) {
            // injection required
            sources[href] = btk.inject.script(spec.uid(), href, onload, onerror);
        } else {
            // already injected
            dmsg("btk/module.dLoad: '" + spec + "' already injected");
        }
    }
	
    function load(spec) {
        function dLoad(spec) {
            var module = getModule(spec);
			
            if (module && module.resolved) {
                // don't need to do anything
                return;
            }
			
            var href = module && module.source;
            var wait = module && module.wait;
			
            dmsg("btk/module.dLoad: '" + spec.name + "'");
			
            // module is needed NOW
            trigger(spec, NEEDED);
			
            if (!module || (href && !wait)) {
                inject(spec, href);
            }
        }

        dmsg("btk/module.load: '" + spec.name + "'");
        btk.defer(dLoad, [spec]);
    }


    //--------------------------------------------------------
    function Module(atts) {
        // atts must be an object.
        if (!isObject(atts)) {
            throw this.error(TypeError, ": expected atts:Object");
        }
		
        // by default, modules are not anonymous.
        this.anonymous = false;
		
        var spec = atts.name || atts.spec || '';

        // spec must be a string
        if (!isString(spec)) {
            throw this.error(TypeError, ": expected atts.spec/name:String|null");
        }
		
        this.spec = new Spec(spec);
        this.name = this.spec.name;
		
        // anonymous modules are special.
        // they are removed once their values have been determined
        // consequently, they cannot be used by any other module.
        this.anonymous = this.spec.anonymous

        // if source is set then this module represents an external library.
        // eg jQuery
        // the source attribute overrides spec.source.
        var source = atts.from || atts.file || atts.href || atts.src || atts.source;
        source = source || '';
        if (source) {
            // it must be a string.
            if (!isString(source)) {
                throw this.error(TypeError, ": expected atts.source:String");
            }
        } else if (this.spec.source) {
            source = this.spec.getPath(this.spec.source) + '.js';
        }
        this.source = source;
		
        // used for resolving requirements with relative paths.
        this.path = new Path(this.source).branch();
		
        // sometimes external libraries have dependencies that they
        // require be resolved first.
        // eg jQuery-UI requires jQuery be included first.
        //
        // if atts.wait is set then source injection will be delayed
        // until all requirements are resolved.
        //
        // has no effect if there is no source.
        this.wait = !!atts.wait;
		
        // total imports and needs.
        // incremented by addImport and addNeed functions.
        // decremented as each import or need is satisfied.
        this.outstanding = 0;
		
        //the modules that this module depends on
        var imports = atts.libs || atts.uses || atts.use || atts.imports || atts.requires || {};
        this.addImports(imports);
		
        // the states/conditions that this module needs
        // eg state::document.ready
        var needs = atts.when || atts.need || atts.needs || [];
        this.addNeeds(needs);

        // the css scripts that this module requires
        var csss = atts.css || [];
        this.addCSSs(csss);
		
        // the initialisation routine/value for the module
        this.init = atts.init || atts.value || atts.main || atts.body || atts.initialise;
		
        // if atts.load is true then the module will be loaded asap.
        // anonymous modules cannot be referred to by other modules
        // so when do they get loaded? ASAP!
        this.load = !!atts.load || !!atts.now || !!atts.asap || this.anonymous;
		
        // extra data for the module.
        // this field is not used by the module system.
        // it is passed as 'this' to the module initialiser.
        this.data = atts.data || {};
    }

    (function(p){

        p.className = "Module";

        p.uid = function() {
            return this.spec.uid();
        };
		
        p.state = function(moduleState) {
            return state(this.spec, moduleState);
        };
		
        //----------------------------------------------------
        p.resolveSpec = function(ispec) {
            var spec = ispec;
			
            if (ispec.indexOf('./') === 0) {
                var spec = [ispec.slice(2), this.spec.library];
                if (this.spec.source) {
                    spec.push(this.spec.source);
                }
            }
			
            return new Spec(spec);
        };
		
        //----------------------------------------------------
        // attribute .imports must be an object whose property
        // values are all strings
        p.addImports = function(imports) {
            if (!isObject(imports)) {
                throw this.error(TypeError, ": expected atts.imports:Object");
            }
			
            var that = this;
            that.imports = {};
            forEach(imports, function(spec, key) {
                that.addImport(key, spec);
            });
        };

        p.addImport = function(key, spec) {
            if (isString(spec)) {
                spec = this.resolveSpec(spec);
            }
            if (!(spec instanceof Spec)) {
                throw this.error(TypeError, ": expected atts.imports[" + key + "]:Spec|String");
            }

            if (!this.imports[key]) {
                this.imports[key] = spec;
                this.outstanding++;
            }
        };
		
        //----------------------------------------------------
        // attribute .needs must be an array of strings
        p.addNeeds = function(needs) {
            if (!isArray(needs)) {
                throw this.error(TypeError, ": expected atts.needs:Array");
            }

            this.needs = {};
            var i, limit = needs.length;
            for (i=0; i<limit; i++) {
                this.addNeed(needs[i]);
            }
        };
		
        p.addNeed = function(need) {
            if (!isString(need)) {
                throw this.error(TypeError, ": expected atts.needs[*]:String");
            }
			
            if (!this.needs[need]) {
                this.needs[need] = true;
                this.outstanding++;
            }
        };
		
        //----------------------------------------------------
        // attribute .css must be an array of strings
        p.addCSSs = function(csss) {
            if (!isArray(csss)) {
                throw this.error(TypeError, ": expected atts.css:Array(String)");
            }

            this.csss = {};
            var i, limit = csss.length;
            for (i=0; i<limit; i++) {
                this.addCSS(csss[i]);
            }
        };
		
        p.addCSS = function(spec) {
            if (isString(spec)) {
                spec = this.resolveSpec(spec);
            }
            if (!(spec instanceof Spec)) {
                throw this.error(TypeError, ": expected atts.css[*]:Spec|String");
            }

            if (!this.csss[spec.uid()]) {
                this.csss[spec.uid()] = spec;
            }
        };
		
        //----------------------------------------------------
        p.decOutstanding = function() {
            this.outstanding--;
            if (this.outstanding === 0) {
                kto.block(this.state(RESOLVED), this.libs);
            }
        };
		
        //----------------------------------------------------
        p.linkImports = function() {
            var that = this;
			
            function linkImport(key, spec) {
                that.msg("linkImport: { " + key + ":" + spec.spec + " }");
				
                var vftid = state(spec, VALUE);
				
                load(spec);
				
                var s = kto.subscribe(
                    vftid,
                    function(lib) {
                        that.bmsg("importResolved: { " + key + ":" + spec.spec + " }");
                        s.cancel();
                        if (key !== LOADER) {
                            that.libs[key] = lib;
                        }
                        that.decOutstanding();
                    }
                    );
            }
			
            forEach(that.imports, function(spec, key) {
                linkImport(key, spec);
            });
        };
		
        //----------------------------------------------------
        p.linkNeeds = function() {
            var that = this;
			
            function linkNeed(need) {
                that.msg("linkNeed: " + need);
				
                var s = kto.subscribe (
                    need,
                    function() {
                        that.bmsg("needResolved: " + need);
                        s.cancel();
                        that.decOutstanding();
                    }
                    );
            }
			
            forEach(that.needs, function(constantValue, need) {
                linkNeed(need);
            });
        };
		
        //----------------------------------------------------
        p.injectCSS = function() {
            forEach(this.csss, function(spec, uid) {
                var href = spec.getPath() + '.css';
				
                if (btk.inject.css(uid, href)) {
                    this.bmsg('(' + href + ') css link found/created');
                //	console.info('(' + href + ') css link found/created');
                } else {
                    this.emsg('(' + href + ') css link not found/created');
                    console.error('(' + href + ') css link not found/created');
                }
            }, this);
        };
		
        //----------------------------------------------------
        // resolve the module
        // should only be called when all requirments are satisfied
        p.resolve = function(libs) {
            var vftid = this.state(VALUE);
            var exports = {};
            var result;
			
            try {
                if (isFunction(this.init)) {
                    this.msg("init(...)");
                    result = this.init.call(this.data, libs, exports);
                } else {
                    result = this.init;
                }
            } catch (e) {
                this.emsg("init failed");
                this.emsg(e.stack || e);
                this.failed = true;
            //throw e;
            }
            if (typeof result === "undefined") {
                result = exports;
            }
            this.value = result;

            if (this.failed) {
                trigger(this.spec, 'failed');
            } else {
                this.injectCSS();
                kto.block(vftid, result);
                this.resolved = true;
            }
			
            // remove things that are no longer needed
			
            if (this.anonymous) {
                // anonymous modules are COMPLETELY discarded
                kto.close(state.base(this.spec));
                // only named modules are remembered permanently
                removeModule(this);
                this.bmsg("removed");
            } else {
                kto.close(this.state(LOADED));
                kto.close(this.state(RESOLVED));
				
                delete this.outstanding;
                delete this.libs;
            }
			
            if (this.resolved) {
                this.cmsg("resolved");
            } else if (this.failed) {
                this.emsg("failed");
            }
        };
		
        // wait for all requirements to be satisfied and then
        // resolve the module
        p.waitResolved = function() {
            this.msg("waitResolved");
            var that  = this;
            var rftid = that.state(RESOLVED);
			
            var s = kto.subscribe (
                rftid,
                function(libs) {
                    // all dependencies resolved
                    that.cmsg("all dependencies resolved");
					
                    s.cancel();
					
                    // determine the value of the module
                    that.resolve(libs);
                }
                );
        };
		
        //----------------------------------------------------
        // link the module to all its requirements
        p.link = function() {
            this.msg("link");
			
            this.linkImports();
            this.linkNeeds();
        };
		
        //----------------------------------------------------
        p.toString = function() {
            return this.className + "(" + this.spec.uid() + ")";
        };
		
        //----------------------------------------------------
        var dmsg = function(msg) {
            btk.message(msg)
            };
		
        p.msgString = function(text, colour) {
            return [
            '$<span style="color:purple">',
            this.toString(),
            '</span>',
            ' ',
            colour? '<span style="color:'+colour+'">': '',
            text,
            colour? '</span>': ''
            ].join("");
        };
		
        p.msg = function(text, colour) {
            dmsg(this.msgString(text, colour));
        };
		
        p.rmsg = function(text) {
            this.msg(text, "red");
        };
		
        p.gmsg = function(text) {
            this.msg(text, "green");
        };
		
        p.bmsg = function(text) {
            this.msg(text, "blue");
        };
		
        p.cmsg = p.gmsg;
		
        p.emsg = function(text) {
            this.rmsg(text);
            if (console && console.error) {
                console.error(this.toString() + ": " + text);
            }
        };
		
        p.error = function(Klass, text) {
            return new Klass(this.toString() + text);
        };
		
    }(Module.prototype));
	
	
    //--------------------------------------------------------
    // same signature as Module
    function define(atts) {
        atts = atts || {};
		
        var module = new Module(atts);
        var spec   = module.spec;
		
        //console.info(spec.name);
        //console.log(module);
		
        module.msg("definition");
		
        addModule(module);
		
        if (module.source) {
            module.msg("source: " + module.source);
            // sometimes script injection must be deferred until requirements
            // are satisfied
            if (module.wait) {
                module.msg("wait: true");
                // create a module solely to load this module's source.
                // it has to have the same requirements as the original
                // and start the load AFTER they are satisfied.
                var loader = spec.uid() + '@' + special('loader');
                define({
                    spec: loader,
                    libs: module.imports,
                    when: Object.keys(module.needs),
                    init: function() {
                        inject(module.spec, module.source);
                    }
                });
                module.addImport(LOADER, loader);
            }
			
            module.addNeed(module.state(LOADED));
        }
		
        if (module.outstanding === 0) {
            // what are we waiting around for????
            module.gmsg("immediate resolution");
            module.resolve({/* no libs */});
            // don't need to do anything else
            return;
        }

        // only start module resolution when needed
        // wait until needed
        var s = kto.subscribe(
            module.state(NEEDED),
            function() {
                s.cancel();
                module.libs = {};
                module.link();
                module.waitResolved();
            }
            );
		
        // module loading is implicitely deferred until needed so
        // check whether this module should be loaded now
        if (module.load) {
            module.msg("load: true");
            load(module.spec);
        }
    }
    exports.define = define;
	
    define.alias   = setAlias;
    define.special = setAlias.special;
    define.library = setAlias.library;
	
    define.privateOrphans = (function(){
        var seq = new btk.Sequence(0);
		
        function privateOrphans() {
            return define.special('privateOrphans', special('orphan') + '.' + seq.next());
        };
		
        return privateOrphans;
    }());
	
	
    //--------------------------------------------------------
    function require(spec) {
        if (isString(spec)) {
            spec = new Spec(spec);
        }
        if (!(spec instanceof Spec)) {
            return;
        }
		
        var module = getModule(spec);
		
        if (module && module.resolved) {
            return module.value;
        }
    }
    exports.require = require;
	
    require.alias   = getAlias;
    require.special = getAlias.special;
    require.library = getAlias.library;
	
	
    //--------------------------------------------------------
    return exports;
	
}(btk, btk.object, btk.topic));


// convenience
(function(btk) {
    var Path = btk.Path;
	
    btk.getAlias = btk.module.getAlias;
    btk.setAlias = btk.module.setAlias;
	
    btk.resolveAliases = btk.module.resolveAliases;

    btk.define  = btk.module.define;
    btk.require = btk.module.require;
	
    btk.require.load = function(name) {
        btk.define({
            data: {
                name:'btk.require.load'
            },
            libs: {
                xxx: name
            }
        });
    };
}(btk));


//============================================================
btk.inject = {};

(function(btk, exp){
    var escape = btk.global.escape;
	
    // milliseconds in a day
    var DAY = 86400000;
	
    // for reference
    var now       = Date.now();
    var tomorrow  = now + DAY;
    var yesterday = now - DAY;
	
    // used to control cache usage
    var useCacheStart = now;
	
    // IE seems to require this
    // if absent, the following console test causes strange behaviour
    var console = btk.global.console;
	
    function useCacheFrom(d) {
        d = new Date(d);
        useCacheStart = d.getTime() || now;
		
        if (useCacheStart > now) {
            btk.message("*FUTURE CACHE USAGE START: " + d.toString());
            if (console && console.info) {
                console.info("FUTURE CACHE USAGE START: " + d.toString());
            }
        }
    }
    exp.useCacheFrom = useCacheFrom;

    if (btk.config.useCacheFrom) {
        useCacheFrom(btk.config.useCacheFrom);
    }
	
    // used to force reloading
    var stamp = now;
	
    // convenience
    exp.forceReload = function() {
        // tomorrow never will be
        useCacheFrom(tomorrow);
    };
    exp.forceCache = function() {
        // yesterday always was
        useCacheFrom(yesterday);
    };
	
    // DEPRECATED
    // possibly modifies the href so that the target is fetched
    // from the server rather than the cache
    function stamphref(href) {
        if (stamp < useCacheStart) {
            var queryParam = "btk.inject.stamp=" + escape(stamp);
			
            if (href.indexOf('?') < 0) {
                href = href + "?" + queryParam;
            } else {
                href = href + "&" + queryParam;
            }
        }
		
        return href;
    }
	
    function stamphref(href) {
        return href;
    }
    
    exp.stamphref = stamphref;
	
	
    //--------------------------------------------------------
    function injectScript(name, href, onload, onerror) {
        name    = name || "";
        href    = href || name + '.js';
        onload  = btk.ifFunction(onload, btk.nothing);
        onerror = btk.ifFunction(onerror, btk.nothing);
		
        href = stamphref(href);
		
        //console.info("#btk.injectScript: " + href);
		
        var doc = btk.document;
        var head = doc.head;
        if (!head) {
            btk.dmsg("*btk.injectScript: could not find document head");
            return false;
        }

        // check by data-btkid
        var obj = head.querySelector(
            "script" +
            "[type='text/javascript']" +
            "[data-btkid='" + name + "']");
		
        if (obj) {
            btk.dmsg("#btk.injectScript: " + name + ": script tag already exists");
            //console.info("#btk.injectScript: " + name + ": script tag already exists");
            return true;
        }
		
        // check by source
        obj = head.querySelector(
            "script" +
            "[type='text/javascript']" +
            "[src='" + href + "']");
		
        if (obj) {
            btk.dmsg("#btk.injectScript: " + name + ": script tag already exists");
            //console.info("#btk.injectScript: " + name + ": script tag already exists");
            return true;
        }
		
        obj = doc.createElement("script");
        if (!obj) {
            btk.dmsg("*btk.injectScript: could not create script object");
            //console.error("*btk.injectScript: could not create script object");
            return false;
        }

        // taken from JS.Class/loader.js
        // http://jsclass.jcoglan.com
        var loaded = (function() {
            var done = false;
            return function(ename) {
                var state = obj.readyState, status = obj.status;
                //console.info("#btk.injectScript: " + href + ": " + ename + ": [" + [state, status] + "]");
                if ( !state || state === 'loaded' || state === 'complete' || (state === 4 && status === 200) ) {
                    if (!done) {
                        //console.info("#btk.injectScript: " + href + ": loaded");
                        onload(name, href);
                        // might get called twice, from onload AND onreadystatechanged.
                        // don't want to act twice.
                        done = true;
                    }
                }
            };
        }());
		
        obj.onload = function() {
            loaded("load");
        };
        obj.onreadystatechange = function() {
            loaded("readystatechange");
        };
        obj.onerror = function() {
            onerror(name, href);
        };
		
        obj.type = "text/javascript";
        obj.setAttribute('data-btkid', name);
        obj.setAttribute('async', 'true');
        obj.src = href;
		
        head.appendChild(obj);
		
        btk.dmsg("#btk.injectScript: " + name + ": script tag written");
        return true;
    }
	
    exp.script = injectScript;

    // TEST for Firefox
    /* did not fire for bad script
	var oldOnError = window.onerror;
	window.onerror = function(errorMsg, url, lineNumber) {
		console.info('window.onerror: msg: ' + errorMsg);
		console.log(errorMsg);
		console.info('window.onerror: url: ' + url);
		console.info('window.onerror: lno: ' + lineNumber);
		
		if (oldOnError) {
			return oldOnError(errorMsg, url, lineNumber);
		}
		
		return false;
	};
	*/
	
    //--------------------------------------------------------
    function injectCSS(name, href) {
        name = name || "";
        href = href || name + '.css';
		
        href = stamphref(href);
		
        var doc  = btk.document;
        var head = doc.head;
		
        if (!head) {
            btk.dmsg("*btk.injectCSS: could not find document head");
            return false;
        }

        var obj = head.querySelector(
            "link" +
            "[rel='stylesheet']" +
            "[type='text/css']" +
            "[href='" + href + "']");
		
        if (obj) {
            btk.dmsg("#btk.injectCSS: " + name + ": stylesheet link already exists");
            return true;
        }
		
        obj = doc.createElement("link");
        if (!obj) {
            btk.dmsg("*btk.injectCSS: could not create link object");
            return false;
        }

        obj.rel  = "stylesheet";
        obj.type = "text/css";
        // don't know that this does anything for links
        obj.setAttribute('data-btkid', name);
        obj.setAttribute('async', 'true');
        obj.href = href;
        head.appendChild(obj);
		
        btk.dmsg("#btk.injectCSS: " + name + ": script tag written");
        return true;
    }
	
    exp.css = injectCSS;
	
}(btk, btk.inject));


//============================================================
// set up basic load handling
// ideas pinched from dojo.js and jquery.js
(function(btk){
    var window   = btk.global;
    var document = btk.document;
	
    if (document.addEventListener) {
        window.addEventListener (
            'load',
            function() {
                btk.trigger.state('window.loaded');
            },
            false
            );
		
        btk.topic.link(
            "state::window.loaded",
            "state::document.ready"
            );

        document.addEventListener (
            'DOMContentLoaded',
            function() {
                btk.trigger.state('dom.content.loaded');
            },
            false
            );

        btk.topic.link(
            "state::dom.content.loaded",
            "state::document.ready"
            );
		
    } else if (document.attachEvent) {
        window.attachEvent (
            "onload",
            function() {
                btk.trigger.state('window.loaded');
            }
            );
		
        btk.topic.link(
            "state::window.loaded",
            "state::document.ready"
            );

        document.attachEvent(
            "onreadystatechange",
            function() {
                btk.trigger.event(
                    'document.readystatechange',
                    document.readystate
                    );
            }
            );

        var s = btk.subscribe(
            'event::document.readystatechange',
            function () {
                if (document.readyState === 'complete') {
                    btk.unsubscribe(s);
                    btk.trigger.state('document.ready');
                }
            }
            );

        // If IE and not a frame
        // continually check to see if the document is ready
        var toplevel = false;

        try {
            toplevel = window.frameElement === null;
        } catch(e) {}

        if ( document.documentElement.doScroll && toplevel ) {
            //DOMContentLoaded approximation. Diego Perini found this MSDN article
            //that indicates doScroll is available after DOM ready, so do a setTimeout
            //to check when it is available.
            //http://msdn.microsoft.com/en-us/library/ms531426.aspx
            btk.setInterval (
                function (intervalTimer) {
                    try {
                        //When dojo is loaded into an iframe in an IE HTML Application
                        //(HTA), such as in a selenium test, javascript in the iframe
                        //can't see anything outside of it, so self===self.top is true,
                        //but the iframe is not the top window and doScroll will be
                        //available before document.body is set. Test document.body
                        //before trying the doScroll trick
                        if (document.body) {
                            document.documentElement.doScroll("left");
                            btk.trigger.state('dom.content.loaded');
                            intervalTimer.stop();
                        } //else try again
						
                    } catch (e) {
                    // try again
                    }
                },
                30
                );
			
            btk.topic.link(
                "state::dom.content.loaded",
                "state::document.ready"
                );
        }
    }
}(btk));


//============================================================

btk.applicationDetails = function() {
    btk.message("!!Application Details");
    var text = [
    '$<table class="showProps"><tbody>',
		
    '<tr>',
    '<td>document.location.origin</td>',
    '<td>',document.location.origin,'</td>',
    '</tr>',
		
    '<tr>',
    '<td>document.location.href</td>',
    '<td>',document.location.href,'</td>',
    '</tr>',
		
    '<tr>',
    '<td>document.location.pathname</td>',
    '<td>',document.location.pathname,'</td>',
    '</tr>',
		
    '<tr>',
    '<td>btk.base</td>',
    '<td>',btk.base,'</td>',
    '</tr>',
		
    '<tr>',
    '<td>btk.config.userAgent</td>',
    '<td>',btk.config.userAgent,'</td>',
    '</tr>',
		
    (function(){
        if (btk.config.browser.isIE) {
            return [
            '<tr>',
            '<td>IE Version</td>',
            '<td>',btk.config.browser.ieVersion[1],'</td>',
            '</tr>'
            ].join("");
        } else {
            return '';
        }
    }()),
		
    '<tr>',
    '<td>btk.config.location.doc</td>',
    '<td>',btk.config.location.doc,'</td>',
    '</tr>',
		
    '<tr>',
    '<td>btk.config.location.root</td>',
    '<td>',btk.config.location.root,'</td>',
    '</tr>',
		
    '<tr>',
    '<td>btk.config.location.query</td>',
    '<td style="white-space:pre;">',
    btk.objectToString(btk.config.location.query, "(not showable)", 4),
    '</td>',
    '</tr>',
    /*
		(function(){
			if (btk.config.useJavaSaver)
				return '<tr><td>using JavaSaver</td><td>YES</td></tr>';
			else
				return '<tr><td>using JavaSaver</td><td>NO</td></tr>';
		}()),
		*/
    '</tbody></table>'
    ].join("");
	
    btk.message(text);
    btk.message();
};

btk.applicationDetails();


//============================================================
// DEFINE THE BTK INTERNAL MODULES SO THAT OTHERS MAY ACCESS THEM

btk.define.library.path('btk', btk.base)


btk.define({
    name:'btk@btk', 
    init:btk
});

// don't really need these but they can make things simpler

btk.define({
    name:'btk.object@btk', 
    init:btk.object
    });

btk.define({
    name:'btk.taskqueue@btk', 
    init:btk.taskqueue
    });

btk.define({
    name:'btk.Publisher@btk', 
    init:function(){
        return btk.Publisher;
    }
});

btk.define({
    name:'btk.topic@btk', 
    init:btk.topic
    });

btk.define({
    name:'btk.module@btk', 
    init:btk.module
    });

btk.define({
    name:'btk.inject@btk', 
    init:btk.inject
    });


//------------------------------------------------------------
// *** decideded to keep btk global.
// *** reduces namespace polution

// removing btk from the global scope forces use of the module system.
// things are more consistent that way.

// have to make these global so that the module system CAN be used.

//btk.global.define  = btk.define;
//btk.global.require = btk.require;

// delete btk;
