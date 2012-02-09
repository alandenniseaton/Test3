//============================================================
//	CommandLine(test) :: Module
//============================================================

// no longer compatable due to document changes
// will add to logview terminal
// !!! done

btk.define({
name: "cmdline@test",
libs: {
	btk: "btk@btk",
	dom: "dom@btk",
	de : "element@wtk",
	CommandLine: "cmdline@wtk"
},
init: function(lib, exp) {


//------------------------------------------------------------
// imports
var btk = lib.btk;
var dom = lib.dom;
var de  = lib.de;
var CommandLine = lib.CommandLine;

var addEventListener = dom.addEventListener;
var stopEvent        = dom.stopEvent;


//------------------------------------------------------------
// convenience
btk.global.kcl = CommandLine;


//------------------------------------------------------------
btk.message("-");
btk.message("!!test/cmdline");

function setupCommandLine() {
	
	var cl = {
		prompt: function(p) {
			return cl.cmdline.setPrompt(p);
		},
		
		cls: function() {
			btk.clear();
		},
		clh: function() {
			this.history.clear();
		},
		lh: function() {
			this.history.apply( function(line) { btk.message("\\[" + line + "]"); } );
		}
	};
	
	var v = {};
	
	var logWrap = btk.document.getElementById("logWrap");
	if (logWrap) {
		addEventListener(
			logWrap,
			'keydown',
			function(event) {
				switch (event.keyCode) {
					case 76: // L
						if (event.ctrlKey) {
							btk.clear();
							stopEvent(event);
						}
						break;
					case 36: // Home
						if (logWrap && event.ctrlKey) {
							logWrap.scrollTop = 0;
							stopEvent(event);
						}
						break;
					case 35: // End
						if (logWrap && event.ctrlKey) {
							logWrap.scrollTop = logWrap.scrollHeight - logWrap.clientHeight;
							stopEvent(event);
						}
						break;
					default:
						break;
				}
			},
			false
		);
	}

	function onsubmit() {
		var prompt = this.getPrompt();
		var input  = this.getValue();
		
		btk.message(cl.cmdline.getEcho().create());
		
		input = input.trim();
		
		var c, f, r, ret=false;
		if (input !== "") {
			c = cl[input];
			if (c && typeof c === "function" && c.length === 0) {
				c.call(this);
			} else {
				try {
					if (input.charAt(0) === '=') {
						ret = true;
						input = "return " + input.slice(1);
					}
					f = new Function("btk", "cl", "v", input);
					try {
						r = f(btk, cl, v);
						if (ret) {
							btk.message("\\" + btk.objectToString(r));
						}
					} catch(e) {
						btk.message('*onrun: ' + String(e.stack? e.stack: e));
					}
				} catch (e) {
					btk.message('*oncreate: ' + String(e.stack? e.stack: e));
				}
			}
		}
	}
	
	var cmdline = new CommandLine("[test:command line]", onsubmit);
	cl.cmdline = cmdline;
	
	cmdline.setSpellcheck(false);
	cmdline.setPlaceholder("enter commands here");
	
	if (logWrap) {
		var element = de('div')
			.att("class", "log body mono")
			.child(cmdline)
			.create();
			
		logWrap.appendChild(element);
	}

	var logsection = btk.document.getElementById("logSection");
	if (logsection) {
		addEventListener(logsection, "click", function(){
			cmdline.focus();
		});
	}
}

setupCommandLine();

btk.message("-");

	
//------------------------------------------------------------
}});
