'use strict';

//============================================================
//	Timer :: Module
//
//	minimum 1 second resolution
//
//============================================================


btk.define({
name: 'timer@btk',
libs: { btk:'btk@btk' },
init: function(libs) {


//------------------------------------------------------------
// imports

var btk          = libs.btk;
var global       = btk.global;
var nothing      = btk.nothing;
var ifNumber     = btk.ifNumber;
var ifFunction   = btk.ifFunction;
var ifObject     = btk.ifObject;
var ifDefined    = btk.ifDefined;
var isDefined    = btk.isDefined;
var setTimeout   = btk.setTimeout;
var clearTimeout = btk.clearTimeout;


//------------------------------------------------------------
//	Timer :: Class, extends Object

var timerId = new btk.Sequence(0);

function Timer(action, period, context) {
	this.id = timerId.next();
	
	this.action  = ifFunction(action, nothing);
	this.context = ifObject(context, {});
	
	this.setPeriod(period);

	this.setFrom();
	
	// the last activation
	this.last = {
		index: -1
	};
	
	this.repeating = false;
	this.stopped = true;
}

Timer.SECOND = 1000; // *Timer.MILLISECOND
Timer.MINUTE = 60*Timer.SECOND;
Timer.HOUR   = 60*Timer.MINUTE;
Timer.DAY    = 24*Timer.HOUR;
Timer.WEEK   = 7*Timer.DAY;
Timer.YEAR   = 365*Timer.DAY;

(function(p){
	var restart, step;
	
	restart = function(timer) {
		var now    = Date.now();
		var from   = timer.from;
		var period = timer.period;
		var index;
		var time;
		
		index = Math.floor((now-from)/period) + 1;
		
		if (index <= timer.last.index) {
			// might happen!
			// depends on the accuracy of browser timeouts
			// and whether modified by code
			// and whether this is the initial reset.
			index = timer.last.index + 1;
			//timer.dmsg(".restart: double up");
		}
		
		time = from + index*period;

		timer.next = {
			index: index,
			time: time
		};
		
		timer.timeoutId = setTimeout (
			function() { step(timer); },
			time - now
		);
		timer.stopped = false;
	};
	
	step = function(timer) {
		//timer.dmsg(".step   :   now " + Date.now());
		//timer.dmsg("       : index " + timer.next.index);
		
		timer.index = timer.next.index; // for backwards compatability
		timer.current = timer.next;
		delete timer.next;
		
		timer.action.call(timer.context, timer);
		
		timer.last = timer.current;
		delete timer.current;
		
		if (timer.repeating) {
			if (!timer.stopped) { restart(timer); }
		} else {
			timer.stopped = true;
		}
	};

	
	p.className = "Timer";
	
	p.setFrom = function(from) {
		var d = new Date(from).getTime();
		
		this.from = (d || d === 0)? d: Date.now();
		
		return this;
	};

	p.getFrom = function() {
		return this.from;
	};
	
	p.setPeriod = function(period) {
		// minimum 1 second period
		this.period = Math.max(ifNumber(period, 0), 1000);
		
		return this;
	};
	
	p.getPeriod = function() {
		return this.period;
	};
	
	p.start = function(from) {
		if (this.stopped) {
			// make sure this.from is set
			this.setFrom(ifDefined(from, this.from));
			
			//this.dmsg(".start  :  from " + this.from);
			restart(this);
		}
		
		return this;
	};
	
	p.stop = function() {
		if (!this.stopped) {
			clearTimeout(this.timeoutId);
			delete this.timeoutId;
			delete this.next;
			this.stopped = true;
		}
		
		return this;
	};
	
	p.repeat = function(repeating) {
		this.repeating = (arguments.length === 0) || !!repeating;
		
		return this;
	};
	
	p.isRepeating = function() {
		return this.repeating;
	};
	
	p.getContext = function() {
		return this.context;
	};
	
	p.getIndex = function() {
		return this.index || 0;
	};
	
	p.getTime = function() {
		return this.getFrom() + this.getIndex()*this.getPeriod();
	};
	
	p.getDate = function() {
		return new Date(this.getTime());
	};
	
	p.toString = function() {
		return this.className + "(" + this.id + ")";
	};
	
	p.dmsg = function(msg) {
		btk.message(this.toString() + msg);
	};
	
}(Timer.prototype));


//------------------------------------------------------------
return Timer;


//------------------------------------------------------------
}});
