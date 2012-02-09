//============================================================
//	Log :: Module
//============================================================


btk.define({
name: "log@wtk",
libs: { btk:'btk@btk' },
css : [ './base', './log' ],
init: function(libs, exports) {


//------------------------------------------------------------
// imports

var btk = libs.btk;

var nothing  = btk.nothing;
var isNumber = btk.isNumber;
var isString = btk.isString;
var isArray = btk.isArray;

var Node = btk.global.Node;


//------------------------------------------------------------
// Log :: Class, extends Object
//
// a class for information logging

btk.namespace('config.log');

var maxSize = btk.config.log.maxSize || 500;
if (!isNumber(maxSize) || maxSize <= 0) {
	maxSize = 500;
}

function Log(a0, a1)/*[(view:Node)|(id:String)], [size:Number]*/ {

	if (isString(a0)) {
		this.view = document.getElementById(a0);
		this.size = a1;
	} else if (a0 instanceof Node) {
		this.view = a0;
		this.size = a1;
	} else if (isNumber(a0)) {
		this.size = a0;
	}

	if (!isNumber(this.size) || this.size <= 0) {
		this.size = maxSize;
	}
	
	this.stack    = [];
	this.lastType = "";
	this.length   = 0;
	
	this.onappend = nothing;
}

(function(p){
	p.className = "Log";

	p.blockStart = function(klass) {
		var old = {
			view: this.view,
			lastType: "block"
		};
		
		this.view = btk.document.createElement("div");
		klass = "log block" + (klass? " "+klass: "");
		this.view.className = klass;
		
		old.view.appendChild(this.view);
		
		this.stack.push(old);
	};
	
	p.blockEnd = function() {
		if (this.stack.length === 0) { return this; }
		
		var old       = this.stack.pop();
		this.view     = old.view;
		this.lastType = old.lastType;
		
		return this;
	};
	
	p.blockEndAll = function() {
		if (this.stack.length === 0) { return this; }
		
		var old = this.stack[0];
		
		this.stack    = [];
		this.view     = old.view;
		this.lastType = old.lastType;
	};
	
	p.append = function(el, type) {
		type = type || '';
		
		this.view.appendChild(el);
		this.length++;
		
		this.lastType = type;
		
		if (this.length > this.size) {
			this.view.removeChild(this.view.firstChild);
			this.length--;
		}
		
		this.onappend.call(this, el);
	};
	
	p.log = function(msg) {
		var that = this;
		var view = that.view;
		var doc  = btk.document;
		
		function appendLine(msg) {
			// collapse lines.
			// if msg has more than 1 character:
			//		output line anyway
			if (that.lastType === "hr" && msg === "-") { return; }
			
			var hr = doc.createElement("hr");
			that.append(hr, "hr");
		}
		
		function appendHeading(msg) {
			var i = 0;
			while (i < msg.length && msg.charAt(i) === "!") {
				i++;
			}
			
			if (i > 6) { i = 6; }
			
			msg = msg.slice(i);
			
			var h = doc.createElement("h"+i.toString());
			h.innerHTML = msg;
			that.append(h, "heading");
		}
		
		function appendType(msg, klass) {
			var div  = doc.createElement("div");
			var text = doc.createTextNode(msg);
			
			div.setAttribute("class", klass);
			div.appendChild(text);
			that.append(div, klass);
		}
		
		function appendText(msg) {
			appendType(msg, 'text');
		}
		
		function appendError(msg) {
			appendType(msg.slice(1), 'error');
		}
		
		function appendInfo(msg) {
			appendType(msg.slice(1), 'info');
		}
		
		function appendNode(element) {
			var div = doc.createElement("div");
			
			div.appendChild(element);
			that.append(div, "node");
		}
		
		function appendHTML(msg) {
			var div = doc.createElement("div");
			
			div.innerHTML = msg.slice(1);
			that.append(div, "html");
		}
		
		function appendArray(msgs) {
			msgs.forEach(function(msg){
				if (isArray(msg)) {
					msg = msg.join("");
				}
				that.message(msg);
			});
		}
		
		function appendBreak() {
			var div = doc.createElement("div");
			
			div.innerHTML = "<br/>";
			that.append(div, "break");
		}
		
		function appendBlockStart(msg) {
			that.blockStart(msg.slice(1) || 'indent1');
		}
		
		function appendBlockEnd() {
			that.blockEnd();
		}
		
		if (msg) {
			if (msg instanceof Node) {
				appendNode(msg);
			} else if (isArray(msg)) {
				appendArray(msg);
			} else {
				msg = String(msg);
				if (msg.length > 0) {
					var c = msg.charAt(0);
					
					switch(c) {
						case "-": appendLine(msg); break;
						case "!": appendHeading(msg); break;
						case "#": appendInfo(msg); break;
						case "*": appendError(msg); break;
						case "$": appendHTML(msg); break;
						case "[": appendBlockStart(msg); break;
						case "]": appendBlockEnd(msg); break;
						case "\\": appendText(msg.slice(1)); break;
						default: appendText(msg); break;
					}
				} else {
					appendBreak();
				}
			}
		}
		else {
			appendBreak();
		}
		
		return this;
	};

	p.message = p.log;
	
	p.clear = function() {
		var view = this.view;
		
		while(view.firstChild) {
			view.removeChild(view.firstChild);
		}
		
		this.length = 0;
		
		return this;
	};
	
	p.create = function() {
		if (this.view) { return this.view; }
		
		this.view = btk.document.createElement('div')
		this.view.className = 'log';
		
		return this.view;
	};
	
	p.toNode = p.create;
	
}(Log.prototype));


//------------------------------------------------------------
return Log;

}});
