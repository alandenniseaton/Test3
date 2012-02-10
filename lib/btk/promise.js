//============================================================
//	Promise :: Module
//============================================================

btk.define({
name: "promise@btk",
libs: {
	btk: 'btk@btk',
	pub: 'btk.Publisher@btk'
},
init: function(libs, exports) {


//------------------------------------------------------------
// imports

var btk        = libs.btk;
var Sequence   = btk.Sequence;
var Timer      = btk.Timer;
var inherits   = btk.inherits;
var nothing    = btk.nothing;
var isFunction = btk.isFunction;
var ifFunction = btk.ifFunction;
var defer      = btk.defer;
var create     = btk.object.create;

var Publisher = libs.pub;
var Client    = Publisher.Client;
var Message   = Publisher.Message;

var OK      = Publisher.OK;
var ERROR   = Publisher.ERROR;
var INFO    = Publisher.INFO;
var DEFAULT = Publisher.DEFAULT;

var CANCEL  = 'cancel';


//------------------------------------------------------------
//	Keeper :: Class, extends Object

function Keeper(onStart, onCancel, context) {
	onStart = onStart || nothing;
	if (!isFunction(onStart)) {
		throw new TypeError("btk/promise.Keeper: expected onStart:Function, onCancel:Function");
	}
	
	onCancel = onCancel || nothing;
	if (typeof onCancel != 'function') {
		throw new TypeError("btk/promise.Keeper: expected onStart:Function, onCancel:Function");
	}
	
	this.onStart  = onStart;
	this.onCancel = onCancel;
	this.context  = context || {};
}
inherits(Keeper, Object);


(function(p){

	p.className = "Keeper";
	
	p.start = function(promise) {
		this.onStart.call(this.context, promise);
	};
	
	p.cancel = function(reason) {
		this.onCancel.call(this.context, reason);
	};
	
	p.getContext = function() {
		return this.context;
	};
	
}(Keeper.prototype));


//------------------------------------------------------------
//	Then :: Class, extends Keeper

function Then(source, actions) {
	function onStart(target) {
		var actions = create(Client.prototype);
		Client.apply(actions, this.actions);
		
		var client = {
			target : target,
			actions: actions,
			receive: function(message) {
				// result will be undefined if actions stopped the message
				// if result is undefined then the message is dropped
				var result = this.actions.process(message);
				if (result) {
					this.target.receive(result);
				}
			}
		};
		
		this.subscription = this.source.subscribe(client);
	}
	
	function onCancel() {
		if (this.subscription) {
			this.subscription.cancel();
		}
	}

	var context = { source:source, actions:actions};
	
	Then.SUPERCLASS.call(this, onStart, onCancel, context)
};
inherits(Then, Keeper);


Then.prototype.className = "Then";


Keeper.Then = Then;


//------------------------------------------------------------
//	Link :: Class, extends Keeper

function Link(source) {
	function onStart(target) {
		var client = {
			target : target,
			receive: function(message) {
				this.target.receive(message);
			}
		};
		
		this.subscription = this.source.subscribe(client);
	}
	
	function onCancel() {
		if (this.subscription) {
			this.subscription.cancel();
		}
	}

	var context = { source:source };
	
	Link.SUPERCLASS.call(this, onStart, onCancel, context)
};
inherits(Link, Keeper);


Link.prototype.className = "Link";


Keeper.Link = Link;


//------------------------------------------------------------
//	Cancellation :: Class, extends Object

function Cancellation(reason) {
	reason = reason || 'no reason';
	if (reason instanceof Cancellation) {
		reason = reason.reason;
	}
	
	this.reason = reason;
}

(function(p){

	p.className = "Cancellation";
	
	p.toString = function() {
		return this.className + ": " + this.reason;
	};
	
}(Cancellation.prototype));


//------------------------------------------------------------
//	Promise :: Class, extends Publisher

function Promise(keeper) {
	if (keeper && !(keeper instanceof Keeper)) {
		throw new TypeError("btk/promise.Promise: expected [keeper:Promise.Keeper]");
	}
	
	Promise.SUPERCLASS.call(this);
	
	if (keeper) {
		this.keeper = keeper;
		keeper.start(this);
	}
}
inherits(Promise, Publisher);

exports.Promise = Promise;

Promise.Cancellation = Cancellation;
Promise.Keeper       = Keeper;

Promise.OK           = OK;
Promise.ERROR        = ERROR;
Promise.INFO         = INFO;
Promise.DEFAULT      = DEFAULT;
Promise.CANCEL       = CANCEL;


(function(p){

	p.className = "Promise";

	p.setKeeper = function(keeper, reason) {
		if (this.keeper) {
			this.keeper.cancel(
				new Cancellation(reason || (keeper? 'replaced': 'removed'))
			);
		}
		
		if (keeper) {
			this.keeper = keeper;
			keeper.start(this);
		} else {
			delete this.keeper;
		}
		
		return this;
	};
	
	// overrides Publisher..receive
	p.receive = function(message) {
		switch (message.type) {
			case OK:
				return this.ok(message.data);
				break;
			case ERROR:
				return this.error(message.data);
				break;
			case CANCEL:
				return this.cancel(message.data);
				break;
			default:
				if (message.block) {
					this.setKeeper(null);
				}
				return this.transmit(message);
				break;
		}
	};
	
	p.set = function(type, data, block, trace) {
		this.receive(new Message(type, data, block, trace));
	};
	
	// overrides Publisher..ok
	p.ok = function(value) {
		if (value === undefined) {
			return this.error('undefined value');
			
		} else if (value instanceof Promise) {
			this.setKeeper(new Link(value));
			return this;
		}
		
		this.setKeeper(null, 'resolved');
		
		return Promise.SUPER.ok.call(this, value);
	};
	
	p.resolve = p.ok;
	
	// overrides Publisher..error
	p.error = function(reason) {
		this.setKeeper(null, reason);
		
		return Promise.SUPER.error.call(this, reason);
	};
	
	p.reject  = p.error;
	
	p.cancel = function(reason) {
		if (this.cancelled || this.blocked) {
			return this;
		}
		
		this.setKeeper(null, reason);
		
		this.transmit(new Message(
			CANCEL, new Cancellation(reason), true
		));
		
		this.cancelled = true;
		
		return this;
	};
	
	p.then = function() {
		return new Promise(new Then(this, arguments));
	};
	
	p.chain = function(chain, context) {
		if (!btk.isArray(chain)) {
			throw new TypeError('btk/promise.Promise.chain: expected chain:Array');
		}
		
		var result = this;
		
		for (var i = 0, len = chain.length; i < len; i++) {
			result = result.then(chain[i], context);
		}
		
		return result;
	};
	
}(Promise.prototype));


//------------------------------------------------------------
function isPromise(p) {
	return p instanceof Promise;
};
exports.isPromise = isPromise;


function make(keeper) {
	return new Promise(keeper);
}
exports.make = make;


function wrap(value) {
	if (isPromise(value)) { return value; }
	
	return new Promise().ok(value);
}
exports.wrap = wrap;


function atTime(time, value, context) {
	var k = new Keeper(
		// start
		function(resolver) {
			var timer = new Timer(
				function(timer) {
					if (typeof this.value === "function") {
						this.resolver.ok(this.value.call(this.context, timer.getFrom()));
						
					} else if (typeof this.value === "undefined") {
						this.resolver.ok(timer.getFrom());
						
					} else {
						this.resolver.ok(this.value);
					}
				},
				1,
				{ resolver:resolver, value:this.value, context:this.context }
			);
			
			timer.setFrom(this.time);
			timer.start();
			
			this.timer = timer;
		},
		// cancel
		function() {
			this.timer.stop();
		},
		// context
		{ time:time, value:value, context:context }
	);
	
	return new Promise(k);
}
exports.atTime = atTime;


//------------------------------------------------------------
}});