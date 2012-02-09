//============================================================
//	Promise(test) :: Module
//============================================================

btk.define({
name: "promise@test",
libs: {
	btk: "btk@btk",
	Timer: "timer@btk",
	kpr: "promise@btk",
	tst: "./base"
},
init: function(lib, exports) {


//------------------------------------------------------------
//	imports

var btk   = lib.btk;
var Timer = lib.Timer;

var kpr       = lib.kpr;
var make      = kpr.make;
var wrap      = kpr.wrap;
var isPromise = kpr.isPromise;
var Keeper    = kpr.Promise.Keeper;

var Test = lib.tst.Test;


//------------------------------------------------------------
//	other stuff

btk.global.kpr = kpr;
kpr.test = [];


//------------------------------------------------------------
//	locals
var test = test;


//------------------------------------------------------------
//	main

btk.message("-");
btk.message("!!test/promise");
btk.message("use kpr.test[nn].run() to run test nn");

function rmsg(msg) {
	btk.message('$<span style="color: red;">' + msg + '</span>');
}

function gmsg(msg) {
	btk.message('$<span style="color: green;">' + msg + '</span>');
}

function bmsg(msg) {
	btk.message('$<span style="color: blue;">' + msg + '</span>');
}


kpr.test[0] = new Test(
"promise with simple keeper",
function(){
	var k = new Keeper(
		function(promise) {
			bmsg("Keeper started");
			promise.ok(123);
		}
	);
	
	return make(k);
});


function testPromise(p) {
	return [p, p.then(
		function(value){
			gmsg("ok   : " + value);
			return "from " + p.toString() + "[" + value + "]";
		},
		function(value){
			rmsg("error: " + value);
			return "from " + p.toString() + "[" + value + "]";
		},
		function(value){
			bmsg("info : " + value);
			return "from " + p.toString() + "[" + value + "]";
		},
		function(value, message){
			bmsg(message.type + ": " + value);
			return "from " + p.toString() + "[" + value + "]";
		}
	)];
}


kpr.test[1] = new Test(
"multiple resolver calls",
function(){
	var p = make();
	
	var r = testPromise(p);
	
	p.info ('message 1');
	p.info ('message 2');
	p.set  ('xxx', 'message 3');
	//p.set  ('xxx', 'message 3', true, false);
	p.ok   ('message 4');
	p.error('message 5');
	p.info ('message 6');
	
	return r;
});


function countdown(n, period, promise) {
	var timer = new Timer(
		function(timer){
			if (this.n > 0) {
				this.promise.info(this.n);
				this.n--;
			} else {
				timer.stop();
				this.promise.ok(this.n);
			}
		},
		period,
		{ n:n, promise:promise }
	);
	
	timer.repeat(true);
	
	return timer;
}


kpr.test[2] = new Test(
"multiple timed resolution calls",
function(){
	var k = new Keeper(
		function(promise) {
			bmsg("Keeper started");
			
			// 'this' should be the Keeper context
			// initially an empty object in this case
			this.timer = countdown(10, 100, promise);
			
			this.timer.start();
		},
		function(cancelReason) {
			this.timer.stop();
			bmsg("Keeper[countdown(10,100)]: " + cancelReason);
		}
	);
	
	return testPromise(make(k));
});


kpr.test[3] = new Test(
"multiple timed resolver calls (again) with cancellation",
function(){
	var k = new Keeper(
		function(promise) {
			bmsg("Keeper started");
			
			// 'this' should be the Keeper context
			// initially an empty object in this case
			this.timer = countdown(99, 1000, promise);
			
			this.timer.start();
		},
		function(cancelReason) {
			this.timer.stop();
			bmsg("Keeper[countdown(99,1000)]: " + cancelReason);
		}
	);
	
	var p = make(k);
	
	//	this timer will run until it executes
	//	unless the promise gets cancelled
	var timer = new Timer(
		function(){
			btk.message("delayed cancel");
			p.cancel("delayed cancel");
		},
		30000	// 30 seconds
	);
	
	var s = p.subscribe({
		cancel: function(reason) {
			s.cancel();
			btk.message('delayed cancellation stopped: ' + reason);
			this.timer.stop();
		}},
		{ timer:timer }
	);
	
	timer.start();
	
	return testPromise(p);
});


kpr.test[4] = new Test(
"setting an undefined value",
function(){
	var q = make();
	var r = testPromise(q);
	
	q.ok();
	
	return r;
});


kpr.test[5] = new Test(
"setting a promise value",
function(){
	var p = wrap(123);
	var q = make();
	var r = testPromise(q);
	
	q.ok(p);
	
	return r;
});


kpr.test[6] = new Test(
"wrap(123).then(return wrap(value+1000))",
function(){
	var p = wrap(123);
	var q = p.then(
		function(value) {
			return wrap(value + 1000);
		}
	);
	
	return testPromise(q);
});


kpr.test[7] = new Test(
"wrap(123).then(null, return wrap(value+1000))",
function(){
	var p = wrap(123);
	var q = p.then(
		null,
		function(value) {
			return wrap(value + 1000);
		}
	);
	
	return testPromise(q);
});


kpr.test[8] = new Test(
"p=make(); p.then(null, return 'extended: '+value); p.error('bleh')",
function(){
	var p = make();
	var q = p.then(
		null,
		function(reason) {
			return 'extended: ' + reason;
		}
	);
	
	var r = testPromise(q);
	
	p.error('bleh');
	
	return r;
});


kpr.test[9] = new Test(
"wrap(123).then({ok:null, default:return wrap(value+1000)})",
function(){
	var p = wrap(123);
	var q = p.then({
		'ok': null,
		'default': function(value) {
			return wrap(value + 1000);
		}
	});
	
	return testPromise(q);
});


kpr.test[10] = new Test(
"p=make(); p.then(null, return wrap('extended: '+value)); p.error('bleh')",
function(){
	var p = make();
	var q = p.then(
		null,
		function(reason) {
			return wrap('extended: ' + reason);
		}
	);
	
	var r = testPromise(q);
	
	p.error('bleh');
	
	return r;
});


kpr.test[11] = new Test(
"stopped message",
function(){
	var p = make();
	var q = p.then({
		'xxx': function(data, message) {
			var data = 'not stopped: ' + data;
			btk.message(data);
			return data;
		},
		'yyy': function(data, message) {
			var data = 'stopped: ' + data;
			btk.message(data);
			
			message.stop()
			return data;
		},
	});
	
	var r = testPromise(q);
	
	p.set('xxx', 123);
	p.set('yyy', 456);
	
	return r;
});


btk.message("-");


//------------------------------------------------------------
return exports;


//------------------------------------------------------------
}});