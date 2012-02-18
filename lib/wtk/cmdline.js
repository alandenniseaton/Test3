//============================================================
//	WTK/Command Line :: Module
//============================================================

btk.define({
name: "cmdline@wtk",
libs: {
	btk: 'btk@btk',
	dom: 'dom@btk',
	de : './element'
},
css : [ './base', './cmdline' ],
init: function(lib, exp) {


//------------------------------------------------------------
// imports

var btk = lib.btk;
var dom = lib.dom;
var de  = lib.de;

var	forEach = btk.object.forEach;

var addEventListener = dom.addEventListener;
var stopEvent = dom.stopEvent;


//------------------------------------------------------------
function History() {
	this.lines = [];
	this.index = 0;
}

(function(p) {
	p.className = "History";
	
	p.clear = function() {
		this.lines = [];
		this.index = 0;
	};
	
	p.push = function(line) {
		if ((line !== "") && (line !== this.lines[this.lines.length-1])) {
			// no empty lines
			// no consecutive duplicates
			this.lines.push(line);
		}
		this.index = this.lines.length;
	};
	
	p.prev = function() {
		this.index--;
		if (this.index < 0) { this.index = 0; }
		return this.lines[this.index] || "";
	};
	
	p.next = function() {
		this.index++;
		if (this.index > this.lines.length) { this.index = this.lines.length; }
		return this.lines[this.index] || "";
	};
	
	p.apply = function(f/*(value, index, array)*/, context) {
		this.lines.forEach(f, context);
	};
}(History.prototype));


//------------------------------------------------------------
function CommandLine(prompt, onsubmit, theme) {
	this.prompt = prompt || "";
	
	if (typeof this.prompt !== "string") {
		throw new TypeError("btk/cmdline.CommandLine: prompt is not a string");
	}
	
	onsubmit = onsubmit || btk.nothing;
	
	if (typeof onsubmit !== "function") {
		throw new TypeError("btk/cmdline.CommandLine: onsubmit is not a function");
	}
	
	this.onsubmit = onsubmit;
	
	theme = theme || "";
	if (typeof theme !== "string") {
		throw new TypeError("btk/cmdline.CommandLine: theme is not a string");
	}
	
	this.theme = theme? theme + " commandline": "commandline";
	
	this.handlers = {};
	
	this.history = new History();
}


(function(p){
	p.className = "CommandLine";
	
	p.setPrompt = function(prompt) {
		var oldPrompt = this.prompt;
		
		this.prompt = prompt;
		if (this.eprompt) {
			this.eprompt.innerHTML = prompt;
		}
		
		return oldPrompt;
	};
	
	p.getPrompt = function() {
		return this.prompt;
	};
	
	p.setValue = function(value) {
		this.value = value;
		if (this.einput) {
			this.einput.value = this.value;
		}
	};
	
	p.getValue = function() {
		return this.value || "";
	};
	
	p.setSpellcheck = function(spellcheck) {
		this.spellcheck = !!spellcheck;
		if (this.einput) {
			this.einput.spellcheck = this.spellcheck;
		}
	};
	
	p.getSpellcheck = function() {
		return !!this.spellcheck;
	};
	
	p.setPlaceholder = function(placeholder) {
		this.placeholder = placeholder;
		if (this.einput) {
			this.einput.placeholder = this.placeholder;
		}
	};
	
	p.getPlaceholder = function() {
		return this.placeholder || "";
	};
	
	p.focus = function() {
		if (this.einput) {
			this.einput.focus();
		}
	};
	
	function addHandler(cmdline, eventName, handler) {
		if (!cmdline.einput) { return; }
		
		addEventListener(
			cmdline.einput,
			eventName,
			function(event) {
				handler.call(cmdline, event);
			}
		);
	};
	
	p.on = function(eventName, handler) {
		this.handlers[eventName] = handler;
		addHandler(this, eventName, handler);
	};
	
	function onkeydown(event) {
		switch (event.keyCode) {
			case 38: // UP
				this.setValue(this.history.prev());
				stopEvent(event);
				break;
			case 40: // DOWN
				this.setValue(this.history.next());
				stopEvent(event);
				break;
			case 13: // ENTER
				this.value = this.einput.value;
				this.history.push(this.value);
				this.onsubmit.call(this, this.value);
				this.setValue("");
				stopEvent(event);
				break;
		}
	}

	p.getEcho = function() {
		return de('table').klass('commandline')
			.start('tbody')
				.start('tr')
					.start('td').klass('prompt')
						.start('span').klass('prompt')
							.child(this.getPrompt())
						.end()
					.end()
					.start('td').klass('input')
						.start('span').klass('input')
							.child(this.getValue())
						.end()
					.end()
				.end()
			.end()
		;
	};
	
	p.createEcho = function() {
		return this.getEcho().create();
	};
	
	p.create = function() {
		if (this.element) { return this.element; }
		
		var prompt = de('span')
			.klass('prompt')
			.child( this.prompt )
			.create();
			
		var input = de('input')
			.type('text')
			.klass('input')
			.att('name', 'commandLineInput')
			.create();
			
		input.value       = this.getValue();
		input.spellcheck  = this.getSpellcheck();
		input.placeholder = this.getPlaceholder();
		
		var element = de('table')
			.klass(this.theme)
			.start('tbody')
				.start('tr')
					.start('td').klass('prompt').child(prompt).end()
					.start('td').klass('input').child(input).end()
				.end()
			.end()
			.create();
		
		this.element = element;
		this.eprompt = prompt;
		this.einput  = input;
		
		forEach(this.handlers, function(handler, event) {
			addHandler(this, event, handler);
		}, this);

		addHandler(this, "keydown", onkeydown);
		
		return element;
	};
	
	p.toString = function() {
		return this.className + "(" + this.getPrompt() + ")"
	};
	
	p.toNode = p.create;
	
}(CommandLine.prototype));


return CommandLine;


//------------------------------------------------------------
}});
