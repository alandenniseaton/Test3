//============================================================
//	Main(test) :: Module
//============================================================


//	all orphan modules (those without a library) will be placed into
//	a special library defined just for this script.
//	library name should be '#orphan.n' where 'n' is a sequence number
btk.define.privateOrphans();


//============================================================
// ??? a secure class
var X = (function() {

	var XResponse = {};
	
	function isX(x) {
		delete XResponse.data;
		
		x.XTest && x.XTest();
		
		return XResponse.data === x;
	};
	
	var XCheck = {};
	
	function X() {
		if (this === XCheck) {
			return isX(arguments[0]);
		}
		
		var that = this;
		this.XTest = function() {
			XResponse.data = that;
			return true;
		};
	}
	
	X.check = XCheck;
	
	return X;
}());

function Y() {}
function Z() {}


//============================================================
// convenience

btk.define({
name: "convenience@test",
load: true,
libs: { btk:"btk@btk", kde:"element@wtk" },
init: function(libs) {

	var btk = libs.btk;
	var kde = libs.kde;

	var global = btk.global;
	
	global.btk = btk;
	global.kto = btk.topic;
	global.kmo = btk.module;
	global.kde = kde;
	
	var isBoolean = btk.isBoolean;
	var forEach   = btk.object.forEach;
	
	var doc = btk.document;
	
	btk.global.$ = function(selector) {
		return doc.querySelector(selector);
	}
	
	btk.global.$$ = function(selector) {
		return doc.querySelectorAll(selector);
	}
	
	btk.listTopics = function(path) {
		var topics = kto.getAllTopics(path).sort();
		var message;
		
		btk.message("-");
		for (var i=0, limit=topics.length; i<limit; i++) {
			message = kto.query(topics[i]).message;
			if (message) {
				if (isBoolean(message.data)) {
					if (message.data) {
						btk.message('#' + topics[i]);
					} else {
						btk.message('*' + topics[i]);
					}
				} else {
					btk.message('$<span style="color:blue;">' + topics[i] + '</span>');
				}
			} else {
				btk.message(topics[i]);
			}
		}
		btk.message("-");
	};

	// this function will break when test mode is switched off
	btk.listUnresolved = function() {
		btk.message("-");
		
		var results = [];
		
		forEach(kmo.modules, function(library) {
			forEach(library, function(module) {
				if (!module.resolved) {
					results.push(module.uid());
				}
			});
		});
		
		results.sort().forEach(function(uid) {
			btk.message("\\" + uid);
		});
		
		btk.message("-");
	};
	
}});


//============================================================
// this should remain unresolved
btk.define({
	data: {
		from: 'test/main.js',
		comment: 'deliberatly unresolvable'
	},
	when: [ 'state::bogotius::testicus' ]
});

// test private orphans
// these get resolved and removed immediately (anonymous with no requirements)
btk.define({});
btk.define({});
// these are not anonymous so they hand around
btk.define({ name:'nobody.1' });
btk.define({ name:'nobody.2' });


//============================================================
btk.define({
name: 'radius.margin@test',
load: true,
init: function(libs) {
	function compute(n) {
		n = n || 100;
		
		var r2 = Math.sqrt(2);
		var s  = (r2-1)/r2;
		var result = { target:s };
		
		var num, denum;
		var minerr = 1.0;	// bogus err > actual
		var err;
		var r;
		var low, high;
		
		for (denum = 2; denum <= n; denum++) {
			low  = Math.floor(29*denum/100);
		//	high = Math.ceil(3*denum/10);
			high = Math.ceil(2929*denum/10000);
			for (num = low; num <= high; num++) {
				r = num/denum;
				if (r > s) {
					err = r-s;
					if (err < minerr) {
						result.fraction = [num,denum]
						result.ratio    = r;
						result.error    = err;
						minerr = err;
					}
				}
			}
		}
		
		console.info('fraction: ' + result.fraction);
		console.info('   ratio: ' + result.ratio);
		console.info('  target: ' + result.target);
		console.info('   error: ' + result.error);
	}

	return compute;
}});


//============================================================
btk.define({
name: 'main.logview@test',
load: true,
libs: {
	btk : 'btk@btk',
	term: 'terminal@wtk',
	de  : 'element@wtk'
},
when: [ 'state::document.ready' ],
//when: [ 'state::document.loaded' ],
css : [ './base' ], 
init: function(libs) {
	var btk      = libs.btk;
	var de       = libs.de;
	var Terminal = libs.term;
	
	var location = $('#log')
	
	if (!location) { return; };
	
	var commands = {
		'?': function() {
		},
		
		echo: function(msg) {
			this.message('\\' + msg);
		},
		
		prompt: function(p) {
			return this.setPrompt(p);
		},
		
		cls: function() {
			this.clear();
		},
		
		clh: function() {
			this.commandLine.history.clear();
		},
		
		lh: function() {
			this.commandLine.history.apply(
				function(line) {
					this.write('[' + line + ']');
				},
				this
			);
		}
	};
	
	var local = {};
	
	function error(prefix, e) {
		return [
			'$<pre style="color:red;">',
			prefix, ': ',
			e.stack || e.toString(),
			'</pre>'
		].join('');
	}
	
	function onSubmit(value) {
		this.log(this.commandLine.createEcho());
		
		var input = value.trim();
		var words, head, tail, command, f, r;
		
		if (input.length > 0) {
			words = input.split(' ');	// crude!
			head  = words[0];
			tail  = words.slice(1).join(' ');
			command = commands[head];
			if (command && typeof command === 'function') {
				command.call(this, tail, words);
			} else {
				try {
					f = new Function('btk', 'commands', 'local', 'return ' + input);
					try {
						r = f.call(this, btk, commands, local);
						this.write(btk.objectToString(r));
					} catch(e) {
						this.log(error('onrun', e));
					}
				} catch (e) {
					this.log(error('oncreate', e));
				}
			}
		}
	}
	
	var terminal = new Terminal({
		prompt: "[log]",
		submit: onSubmit,
		theme : "logView",
		size  : 0	// maximum(default) lines
	});

	terminal.setPlaceholder('enter commands here');
	
	var body = de('div')
		.klass('body')
		.child(terminal);
		
	var view = de('div')
		.att('id', 'logView')
		.klass('frame')
		.child(body)
		.create();

		
	btk.message.buffer.forEach(function(line) {
		terminal.log(line);
	});

	
	btk.message = function(msg) {
		terminal.log(msg);
	};
	
	btk.message.clear = function() {
		terminal.clear();
	};
	
	btk.message.blockStart = function(klass) {
		terminal.blockStart(klass);
	};
	
	btk.message.blockEnd = function() {
		terminal.blockEnd();
	};
	
	btk.message.blockEndAll = function() {
		terminal.blockEndAll();
	};
	
	btk.clear = btk.message.clear;
	
	btk.logView = {
		view: view,
		terminal: terminal
	};
	
	location.appendChild(view);
	
}});


//============================================================
btk.define({
name: "main.timers@test",
load: true,
libs: {
	btk  : "btk@btk",
	dom  : "dom@btk",
	Timer: "timer@btk",
	de   : "element@wtk"
},
when: ["state::document.ready"],
init: function(lib, exp) {

//------------------------------------------------------------
// imports
var btk   = lib.btk;
var dom   = lib.dom;
var Timer = lib.Timer;
var de    = lib.de;

//------------------------------------------------------------
btk.message("-");
btk.message("!!test/main.timers");
btk.message("-");

//------------------------------------------------------------
var location = document.getElementById("pageRight") || document.body;

var eUptime = de('div')
	.create();
/*	
var eScheduled = de('div')
	.att("style","color:green;")
	.create();

var eActual = de('div')
	.att("style","color:red;")
	.create();
*/
var eTimers = de('div')
	.klass("frame")
	.att("style", [
		"text-align:center",
		"margin-bottom:2px",
		"padding:4px",
		"background:transparent",
		"background:transparent",
		"background-image: -webkit-linear-gradient(-45deg, rgba(0,0,0,0), rgba(0,0,0,0.5))",
		"background-image: -moz-linear-gradient(-45deg, rgba(0,0,0,0), rgba(0,0,0,0.5))"
	].join(";"))
	.child(eUptime)
//	.child(eScheduled)
//	.child(eActual)
	.create();
	
location.appendChild(eTimers);

function pad(x) {
	if (x < 10) {
		return "0" + x;
	} else {
		return String(x);
	}
};

function setUptime(start, now) {
	var delta = new Date(now.getTime() - start);
	
	eUptime.innerHTML = [
		pad(delta.getUTCHours()),
		pad(delta.getUTCMinutes()),
		pad(delta.getUTCSeconds())
	].join(":");
}


// initialise the timer fields
var now = new Date();
setUptime(now.getTime(), now);


// update once a second
var secondTimer = new Timer(
	function(timer) {
		var now = new Date();
		
		setUptime(this.start, now);
		
	//	eScheduled.innerHTML = timer.from + timer.period*timer.index;
	//	eActual.innerHTML = now.getTime();
		
	},
	1000,
	{ start:Date.now() }
)
.repeat(true)
.start(new Date(2011, 1-1, 1));

btk.timers = {view:eTimers, secondTimer:secondTimer};

//------------------------------------------------------------
}});


//============================================================
btk.define({
name: "main.progressBar@test",
load: true,
libs: {
	btk  : "btk@btk",
	dom  : "dom@btk",
	de   : "element@wtk",
	Timer: "timer@btk"
},
init: function(lib, exp) {

//------------------------------------------------------------
// imports
var btk     = lib.btk;
var oString = btk.objectToString;

var dom = lib.dom;

var de  = lib.de;

var Timer = lib.Timer;


//------------------------------------------------------------
btk.message("-");
btk.message("!!test/main.progressBar");
btk.message('to start the progress bar: btk.pb.timer.start()');
btk.message('to stop the progress bar: btk.pb.timer.stop()');

//------------------------------------------------------------
// ProgressBar :: Class, extends Object

function ProgressBar(min, max, value) {
	this.setMin(min);
	this.setMax(max);
	this.setValue(value);
}

(function(p){
	function toNumber(x, alt) {
		x = Number(x);

		if (x || x === 0) { return x; }
		
		return toNumber(alt, 0);
	};
	
	p.className = "ProgressBar";
	
	p.setMin = function(min) {
		min = toNumber(min, 0);
		
		// enforce max >= min
		if (this.max !== undefined) {
			this.max = Math.max(min, this.max);
		}
		
		this.min = min;
		
		this.setValue(this.value);
		
		return this;
	};

	p.getMin = function() {
		return this.min;
	};
	
	p.setMax = function(max) {
		max = toNumber(max, 100);
		
		// enforce min <= max
		if (this.min !== undefined) {
			this.min = Math.min(this.min, max);
		}
		
		this.max = max;
		
		this.setValue(this.value);
		
		return this;
	};
	
	p.getMax = function() {
		return this.max;
	};
	
	p.getValue = function() {
		return this.value;
	};
	
	p.getBarValue = function() {
		var dv = this.value - this.min;
		var dr = this.max   - this.min;
		
		// pretend 0/0 = 1
		if (dv === dr) { return 100; }
		
		return 100 * dv/dr;
	};
	
	p.updateBarValue = function() {
		if (this.view) {
			this.view.bar.style.width = this.getBarValue() + "%";
		}
	};
	
	p.setValue = function(value) {
		value = toNumber(value, 50);
		
		// enforce min <= value <= max
		if (this.min !== undefined) {
			value = Math.max(this.min, value);
		}
		if (this.max !== undefined) {
			value = Math.min(this.max, value);
		}
		
		this.value = value;
		
		this.updateBarValue();
		
		return this;
	};

	p.create = function() {
		if (this.view) { return this.view.main; }
		
		this.view = {};
		
		this.view.bar = de('div')
			.att('style', [
				'background-color: blue',
				'height: 10px',
				'border-width: 1px',
				'border-style: inset',
				'border-color: white'
			].join(';'))
			.create();

		this.view.main = de('div')
			.att('style', [
				'background-color: transparent',
				'border-width: 1px',
				'border-style: outset',
				'border-color: white',
				'padding: 2px;'
			].join(';'))
			.child(this.view.bar)
			.create();
		
		this.updateBarValue();
		
		return this.view.main;
	};
	
	p.toNode = p.create;
	
}(ProgressBar.prototype));


btk.ProgressBar = ProgressBar;

//------------------------------------------------------------
//	test it out

btk.pb = {
	pb: new btk.ProgressBar(100, 900, 100),
	timer: new Timer(
		function(timer) {
			btk.pb.pb.setValue(timer.index % 1000);
		}
	).repeat(true).setPeriod(5)
};

btk.message(btk.pb.pb.create());
//btk.pb.timer.start();

btk.message("-");

//------------------------------------------------------------
}});


//============================================================
// main module

btk.define({
name: "main@test",
load: true,
libs: {
	base : "./base",
	clock: "./clock",
//	test : "./test",
//	xxxx : "./xxxx",	// should cause a GET error
	util : "./util",
//	tcl  : "./cmdline",
	tpr  : "./promise",
//	taaa : "./aaa",
//	tevt : "./event",
//	term : "./terminal",
//	tlfs : "./lfs",
	lgv  : "./main.logview",
	btk  : "btk@btk"
},
init: function(libs, exp) {
	var btk = libs.btk;
	
	btk.message("-");
	btk.message("!!test/main");
	btk.message("-");
}});

//------------------------------------------------------------
