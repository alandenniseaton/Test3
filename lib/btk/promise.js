'use strict';

//============================================================
//	Promise :: Module
//============================================================

btk.define({
name: "promise@btk",
init: function(libs, exports) {


//------------------------------------------------------------
// imports

var Sequence   = btk.Sequence;
var Timer      = btk.Timer;
var inherits   = btk.inherits;
var nothing    = btk.nothing;
var isDefined  = btk.isDefined;
var isFunction = btk.isFunction;
var ifFunction = btk.ifFunction;
var defer      = btk.defer;
var create     = btk.object.create;

var Publisher = btk.Publisher;
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
	
	this.setContext(context);
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
	
	p.setContext = function(context) {
		this.context  = btk.ifObject(context, {});
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
			CANCEL, new Cancellation(reason), true, false
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


//------------------------------------------------------------
//	returns a Promise that is resolved at the specified time
//
//	with p = the Promise
//	at time
//		if value:Function
//			p.ok(value.call(context, time))
//		else if value:undefined
//			p.ok(time)
//		else
//			p.ok(value)

function atTime(time, value, context) {
	var k = new Keeper(
		// start
		function(target) {
			var timer = new Timer(
				function(timer) {
					if (typeof this.value === "function") {
						this.target.ok(this.value.call(this.context, timer.getFrom()));
						
					} else if (typeof this.value === "undefined") {
						this.target.ok(timer.getFrom());
						
					} else {
						this.target.ok(this.value);
					}
				},
				1,
				{ target:target, value:this.value, context:this.context }
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
// this is usefull for dealing with promise chains
//
function Result(source, value) {
	this.init(source, value);
};


(function(p){
	p.className = 'Result';
	
	// sometimes we want to re-use the result object rather
	// than create a new one.
	p.init = function(source, value) {
		this.source = source;
		this.value  = value;
	};

	p.promise = function() {
		return new Promise().ok(this);
	};
	
	p.error = function(data) {
		this.data = data;
		return new Promise().error(this);
	};
	
}(Result.prototype));


Result.chain = function(chain, context, source, value) {
	return new Result(source, value)
		.promise()
		.chain(chain, context)
	;
};


exports.Result = Result;


//------------------------------------------------------------
//	base class for asynchronous iterators
//	used by PWhile
/*
	when
		i:PIterator
		Value:class of values that i iterates over
	then

		this is how i must behave.
		
		asynchronous methods must return a result promise
		with source = i

		i.init()
			asynchronous
			initialise the iterator
				if already initialised then do nothing
				else
					make the first Value available
					if there is no first Value then
						set Value to undefined
						enter done state
				
		i.value()
			NOT asynchronous
			return the present Value
			
		i.advance()
			asynchronous
			make the next Value available
			if there is no next Value then
				set Value to undefined
				enter done state
				
		i.done()
			NOT asynchronous
			return true if i is in the done state
			
		i.reset()
			asynchronous
			change iterator state so that it is as though init() had just been called
*/
function PIterator() {
}

(function(p){

	p.className = 'PIterator';
	
	// synchronous stubs
	p.value = function() { return this._value; }
	p.done  = function() { return !this._value; }
	
	// asynchronous stubs
	p.init    = function() { return new Result(this).promise(); }
	p.advance = function() { return new Result(this).promise(); }
	p.reset   = function() { return new Result(this).promise(); }
	
}(PIterator.prototype));


exports.PIterator = PIterator;


//------------------------------------------------------------
/*
	asynchronous implementation of the following synchronous loop algorithm
	
		results = []
		
		iterator.init
		
		while not iterator.done
			results.push (transform iterator.value)
			iterator.advance
*/
function PWhile(piterator, pmap, context) {
	if (!(piterator instanceof PIterator)) {
		throw new TypeError('PWhile: expected iterator:PIterator, map:Function [, context:Any]');
	}
	
	if (!btk.isFunction(pmap)) {
		throw new TypeError('PWhile: expected map:Function');
	}
	
	PWhile.SUPERCLASS.call(this);
	
	this.it   = piterator;
	this.map  = pmap;
	this.ctxt = context;
	
	this.progress = 'step';
	
	this.started = false;
	this.stopped = false;
	
}
btk.inherits(PWhile, Promise);

(function(p){

	p.className = 'PWhile';

	p.wrap = function(value) {
		return new Result(this, value);
	}
	
	// only call from step() and ithandle.default()
	//
	function forward(message) {
		message.data.source = this;
		this.receive(message);
	};
	
	// only used within
	//		it.init().then()
	//		it.advance().then()
	//
	var ithandle = {
		'ok': step,
		'default': function(result, message) {
			// forward the message so all may see
			forward.call(this, message);
		}
	};
	
	// only called from step()
	//
	function done(result) {
		this.ok(this.wrap('done'));
		this.stopped = true;
	};

	// only called within
	//		it.init().then()
	//		it.advance().then()
	//
	function step() {
		if (this.stopped) { return; }
		
		if ( !this.it.done() ) {
		
			wrap(this.map.call(this.ctxt, this.it.value(), this)).then({
			
				'ok': function(value) {
					this.set(this.progress, this.wrap(value));
					
					this.it.advance().then(ithandle, this);
				},
				
				'default': function(result, message) {
					forward.call(this, message);
				}
				
			}, this );
			
		} else done.call(this);
	};
	
	p.start = function() {
		if (this.started) { return this; }
		
		this.it.init().then(ithandle, this);
		
		this.started = true;
		
		return this;
	};
	
	p.stop = function() {
		this.stopped = true;
		this.set('stop', this.wrap('stop'), true, true);
		
		return this;
	}
	
}(PWhile.prototype));


exports.PWhile = PWhile;


function pwhile(piterator, ptransform, context) {
	pw = new PWhile(piterator, ptransform, context);
	pw.start();
	
	return pw;
}
exports.pwhile = pwhile;


//------------------------------------------------------------
// useful for synchronising access to resources
//
// see bookmarks.js/page.control.datalist for example use

function LockClass(qualifier) {

	qualifier = btk.ifString(qualifier, '__');
	
	var current_lock;
	
	function Lock() {
		Lock.SUPERCLASS.call(this);
		
		this.old = current_lock;
		current_lock = this;
	};
	btk.inherits(Lock, Promise);
	
	(function(p){
	
		p.className = 'Lock(' + qualifier + ')';
		
		p.release = function() {
			this.ok(true);
		};
		
		p.open = p.release;
		p.unlock = p.release;
		
	}(Lock.prototype));
	
	// initial lock is open so that things
	// can get off the ground
	current_lock = new Lock();
	current_lock.open();

	return Lock;
}

exports.LockClass = LockClass;


//------------------------------------------------------------
}});