//============================================================
// WTK/Terminal :: Module
//============================================================

btk.define({
name: "terminal@wtk",
libs: {
	btk: 'btk@btk',
	dom: 'dom@btk',
	de : './element',
	cl : './cmdline',
	log: './log'
},
css : [ './base', './terminal', './scroll-plain'],
init: function(libs) {


//------------------------------------------------------------
var btk         = libs.btk;
var dom         = libs.dom;
var de          = libs.de;
var CommandLine = libs.cl;
var Log         = libs.log;

var nothing = btk.nothing;
var forEach = btk.object.forEach;


var addEventListener = dom.addEventListener;
var stopEvent        = dom.stopEvent;


//------------------------------------------------------------

function Terminal(atts) {
	var onsubmit = atts.submit || atts.onsubmit || nothing;
	
	if (typeof onsubmit !== "function") {
		throw new TypeError("btk/Terminal: onsubmit is not a function");
	}

	this.onsubmit = onsubmit;
	
	var theme = atts.theme || "";
	if (typeof theme !== "string") {
		throw new TypeError("btk/Terminal: theme is not a string");
	}
	
	this.theme = theme? theme + " terminal": "terminal";
	
	this.logger = new Log(atts.size);
	
	var that = this;
	this.commandLine = new CommandLine(
		atts.prompt || "",
		function() {
			that.onsubmit.call(that, that.getValue());
		}
	);
	
	this.handlers = {};
	this.view = {};
}

(function(p){
	p.className = "Terminal";
	
	// interface with log
	
	p.append = function(data, type) {
		this.logger.append(data, type);
	};
	
	p.log = function(data) {
		this.logger.log(data);
		return this;
	};
	
	p.message = p.log;
	
	p.info = function(text) {
		return this.log("#" + text);
	};
	
	p.comment = p.info;
	
	p.error = function(text) {
		return this.log("*" + text);
	};
	
	p.line = function() {
		return this.log("-");
	};
	
	p.write = function(text) {
		// this should buffer contents until \n received
		return this.log("\\" + text);
	};

	p.clear = function() {
		this.logger.clear();
		return this;
	}
	
	p.blockStart = function(klass) {
		this.logger.blockStart(klass);
		return this;
	};
	
	p.blockEnd = function() {
		this.logger.blockEnd();
		return this;
	};
	
	p.blockEndAll = function() {
		this.logger.blockEndAll();
		return this;
	};
	
	// interface with command line
	
	p.setValue = function(value) {
		this.commandLine.setValue(value);
		return this;
	}
	
	p.getValue = function() {
		return this.commandLine.getValue();
	}
	
	p.read = p.getValue;
	
	p.setPrompt = function(prompt) {
		return this.commandLine.setPrompt(prompt);
	}
	
	p.getPrompt = function() {
		return this.commandLine.getPrompt();
	}
	
	p.setSpellcheck = function(spellcheck) {
		this.commandLine.setSpellcheck();
		return this;
	};
	
	p.getSpellcheck = function() {
		return this.commandLine.getSpellcheck();
	};
	
	p.setPlaceholder = function(placeholder) {
		this.commandLine.setPlaceholder(placeholder);
		return this;
	};
	
	p.getPlaceholder = function() {
		return this.commandLine.getPlaceholder();
	};
	
	p.focus = function() {
		this.commandLine.focus();
	};

	// own stuff
	
	function addHandler(terminal, eventName, handler) {
		addEventListener(
			terminal.view.wrap,
			eventName,
			function(event) {
				handler.call(terminal, event);
			}
		);
	};
	
	p.on = function(eventName, handler) {
		this.handlers[eventName] = handler;
		if (this.view.wrap) {
			addHandler(this, eventName, handler);
		}
	};
	
	// create the terminal DOM element
	p.create = function() {
		var view = this.view;
		
		if (view.anchor) { return view.anchor; }
		
		this.on("click", function(event){
			var wrap = this.view.wrap;
			// only focus on commandline when clicked if commandline is within bounds
			if (wrap.scrollHeight-wrap.scrollTop <= wrap.clientHeight) {
				this.focus();
				stopEvent(event);
			} else {
				wrap.focus();
			}
		});
	
		this.on("keydown", function(event){
			var wrap = this.view.wrap;
			
			switch (event.keyCode) {
				case 76: // L
					if (event.ctrlKey) {
						this.logger.clear();
						stopEvent(event);
					}
					break;
				case 36: // Home
					if (event.ctrlKey) {
						wrap.scrollTop = 0;
						stopEvent(event);
					}
					break;
				case 35: // End
					if (event.ctrlKey) {
						wrap.scrollTop = wrap.scrollHeight - wrap.clientHeight;
						stopEvent(event);
					}
					break;
				default:
					break;
			}
		});
		
		view.log = this.logger.create();
			
		view.cline = this.commandLine.create();
		
		view.wrap  = de('div')
			.klass('fill').klass('wrap').klass('scroll-plain')
			.att('tabindex', '-1')
			.child(view.log)
			.child(view.cline)
			.create();
		
		view.anchor = de('div')
			.klass(this.theme).klass('anchor')
			.child(view.wrap)
			.create();
		
		forEach(this.handlers, function(handler, eventName) {
			addHandler(this, eventName, handler);
		}, this);
		
		var that = this;
		
		that.scrolling = false;
	
		//scroll the log
		function doScroll() {
			var wrap = this.view.wrap;
			wrap.scrollTop = wrap.scrollHeight - wrap.clientHeight;
			this.scrolling = false;
		}
		
		// deferred so that a sequence of appends within a
		// single execution unit causes a single scroll
		function scroll() {
			if (that.scrolling) { return; }
			
			that.scrolling = true;
			btk.defer(doScroll, [], that);
		}

		this.logger.onappend = scroll;
		
		return view.anchor;
	}
	
	p.toNode = p.create;
	
}(Terminal.prototype));


return Terminal;


//------------------------------------------------------------
}});
