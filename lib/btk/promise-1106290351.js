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

var OK      = Publisher.OK;
var ERROR   = Publisher.ERROR;
var INFO    = Publisher.INFO;
var DEFAULT = Publisher.DEFAULT;


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
	
	p.start = function(keeper) {
		this.onStart.call(this.context, keeper);
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

function Then(promise, actions) {
	if (actions.length === 0) { return; }
	
	function onStart(resolver) {
		var actionClient = create(Client.prototype);
		Client.apply(actionClient, this.actions);
		
		var client = new Client();
		client.on(DEFAULT,
			function(data, message) {
				var result = this.actionClient.receive(message);
				if (typeof result !== 'undefined') {
					this.resolver.set(
						message.type,
						result,
						message.block,
						message.trace
					);
				}
			}
		);
		client.setContext({ actionClient:actionClient, resolver:resolver });
		
		this.subscription = this.promise.subscribe(client);
	}
	
	function onCancel() {
		if (this.subscription) {
			this.subscription.cancel();
		}
	}

	var context = { promise:promise, actions:actions};
	
	Then.SUPERCLASS.call(this, onStart, onCancel, context)
};
inherits(Then, Keeper);


Then.prototype.className = "Then";


Keeper.Then = Then;


//------------------------------------------------------------
//	Cancellation :: Class, extends Object

function Cancellation(reason) {
	this.reason = reason;
}

(function(p){

	p.className = "Cancellation";
	
	p.toString = function() {
		return this.className + ": " + this.reason;
	};
	
}(Cancellation.prototype));


//------------------------------------------------------------
//	Resolver :: Class, extends Publisher
//
//	extends Publisher so that we can be notified of cancellation

var isPromise;
var Promise;

function Resolver(promise) {
	Resolver.SUPERCLASS.call(this);
	
	this.promise = promise;
}
inherits(Resolver, Publisher);


(function(p){

	p.className = "Resolver";
	
	p.set = function(state, value, block, trace) {
		if (this.cancelled) { return; }
		
		var promise = this.promise;
		
		if (state === OK) {
			if (typeof value === 'undefined') {
				state = ERROR;
				value = 'undefined value';
				block = true;
				trace = true;
			} else if (value instanceof Promise) {
				var client = new Client();
				client.on(
					DEFAULT,
					function (data, message) {
						this.resolver.set(
							message.type,
							message.data,
							message.block,
							message.trace
						);
					}
				);
				client.setContext({ resolver:this });
				
				value.subscribe(client);
				
				return this;
			}
		}
		
		defer(
			promise,
			promise.receive,
			[{	type:  state,
				data:  value,
				block: block,
				trace: trace
			}]
		);
		
		if (block) {
			// don't need the resolver and keeper anymore.
			// cancelling the resolver cancels the keeper too.
			// removes them from the promise as well.
			if (state === ERROR) {
				this.cancel(value);
			} else {
				this.cancel(new Cancellation('promise resolved'));
			}
		}
		
		return this;
	};
	
	p.ok    = function(data) { this.set('ok'   , data, true , true  ); };
	p.error = function(data) { this.set('error', data, true , true  ); };
	p.info  = function(data) { this.set('info' , data, false, false ); };
	
	p.cancel = function(cancelReason) {
		if (this.cancelled) { return this; }
		
		this.cancelled = true;
		
		this.transmit({ type:OK, data:cancelReason });
		
		var promise = this.promise;
		
		if (promise.keeper) {
			promise.keeper.cancel(cancelReason);
			delete promise.keeper;
		}
		
		delete promise.resolver;
		
		return this;
	};
	
}(Resolver.prototype));


//------------------------------------------------------------
//	Promise :: Class, extends Publisher

function Promise(keeper) {
	if (keeper && !(keeper instanceof Keeper)) {
		throw new TypeError("btk/promise.Promise: expected [keeper:Promise.Keeper]");
	}
	
	Promise.SUPERCLASS.call(this);
	
	this.resolver = new Resolver(this);
	
	if (keeper) {
		this.keeper = keeper;
		keeper.start(this.resolver);
	}
}
inherits(Promise, Publisher);

exports.Promise = Promise;

Promise.Cancellation = Cancellation;
Promise.Resolver     = Resolver;
Promise.Keeper       = Keeper;


(function(p){

	p.className = "Promise";
	
	p.getResolver = function() {
		return this.resolver;
	};
	
	p.set = function(state, value, block, trace) {
		if (this.resolver) {
			this.resolver.set(state, value, block, trace);
		}
		return this;
	};
	
	p.ok = function(value) {
		if (this.resolver) { this.resolver.ok(value) };
		return this;
	};
	
	p.resolve = p.ok;
	
	p.error = function(value) {
		if (this.resolver) { this.resolver.error(value || 'no reason') };
		return this;
	};
	
	p.reject = p.error;
	
	p.info = function(value) {
		if (this.resolver) { this.resolver.info(value) };
		return this;
	};
	
	p.cancel = function(reason) {
		if (this.cancelled || this.blocked) {
			return this;
		}
		
		this.error(new Cancellation(reason || "no reason"));
		
		this.cancelled = true;
		
		return this;
	};
	
	p.then = function() {
		return new Promise(new Then(this, arguments));
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
	
	var p = new Promise();
	
	p.getResolver().ok(value);
	
	return p;
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