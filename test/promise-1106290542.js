//============================================================
//	Promise(test) :: Module
//============================================================

btk.define({
name: "promise@test",
libs: {
	btk: "btk@btk",
	kpr: "promise@btk",
	tst: "./base"
},
init: function(lib, exports) {


//------------------------------------------------------------
//	imports

var btk   = lib.btk;
var Timer = btk.Timer;

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
"promise with keeper",
function(){
	var r = new Keeper(
		function(resolver) {
			bmsg("Keeper started");
			resolver.ok(123);
		}
	);
	
	return make(r);
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
		}
	)];
}


kpr.test[1] = new Test(
"multiple resolver calls",
function(){
	var p = make();
	var r = p.getResolver();
	
	/*
	r.set('info', 'message 1');
	r.set('info', 'message 2');
	r.set('ok'  , 'message 3');
	r.set('info', 'message 4');
	*/
	r.info('message 1');
	r.info('message 2');
	r.ok('message 3');
	r.info('message 4');
	
	return testPromise(p);
});


function countdown(n, period, resolver) {
	var timer = new Timer(
		function(timer){
			if (this.n > 0) {
				this.resolver.info(this.n);
				this.n--;
			} else {
				timer.stop();
				this.resolver.ok(this.n);
			}
		},
		period,
		{ n:n, resolver:resolver }
	);
	
	timer.repeat(true);
	
	return timer;
}


kpr.test[2] = new Test(
"multiple timed resolver calls",
function(){
	var r = new Keeper(
		function(resolver) {
			bmsg("Keeper started");
			
			// 'this' should be the Keeper context
			this.timer = countdown(10, 100, resolver);
			
			this.timer.start();
		},
		function(cancelReason) {
			this.timer.stop();
			bmsg("Keeper[countdown(10,100)]: " + cancelReason);
		}
	);
	
	return testPromise(make(r));
});


kpr.test[3] = new Test(
"multiple timed resolver calls (again) with cancellation",
function(){
	var r = new Keeper(
		function(resolver) {
			bmsg("Keeper started");
			
			// 'this' should be the resolver context
			this.timer = countdown(99, 1000, resolver);
			
			this.timer.start();
		},
		function(cancelReason) {
			this.timer.stop();
			bmsg("Keeper[countdown(99,1000)]: " + cancelReason);
		}
	);
	
	var p = make(r);
	
	//	this timer will run until it executes
	//	unless the promise gets cancelled
	var timer = new Timer(
		function(){
			btk.message("delayed cancel");
			p.cancel("delayed cancel");
		},
		30000	// 30 seconds
	);
	
	var s = p.getResolver().subscribe(
		function(reason) {
			s.cancel();
			btk.message('Resolver: ' + reason);
			this.timer.stop();
		},
		{ timer:timer }
	);
	
	timer.start();
	
	return testPromise(p);
});


kpr.test[4] = new Test(
"resolver setting a promise",
function(){
	var p = wrap(123);
	var q = make();
	var r = q.getResolver();
	
	r.ok(p);
	
	return testPromise(q);
});


kpr.test[5] = new Test(
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


kpr.test[6] = new Test(
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


btk.message("-");


//------------------------------------------------------------
return exports;


//------------------------------------------------------------
}});