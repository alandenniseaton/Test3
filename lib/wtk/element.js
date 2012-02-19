//============================================================
//	WTK/element :: Module
//
//	dom element construction
//============================================================

btk.define({
name: "element@wtk",
libs: {
	btk: 'btk@btk',
	dom: 'dom@btk'
},
init: function(libs, exports) {


//------------------------------------------------------------
// imports

var btk       = libs.btk;
var inherits  = btk.inherits;
var mixin     = btk.object.safeMixin;
var safeMixin = btk.object.safeMixin;
var forEach   = btk.object.forEach;

var dom              = libs.dom;
var createElement    = dom.createElement;
var createTextNode   = dom.createTextNode
var addEventListener = dom.addEventListener;


//------------------------------------------------------------
//	dElement :: Class, extends Object

//var seq = new btk.Sequence(0);

function dElement(tag, atts, children) {
	this._tag      = tag || "div";
	this._atts     = atts || {};
	this._klasses  = {};
	this._children = children || [];
	this._handlers = {};
	this._theme    = '';

	// these are elements related to this one in some special way
	// usually parents or children
	this._elements  = {};
	
	//this.id(tag + '-' + seq.next());
}

dElement.widgets = {};

function element(tag, atts, children) {
	var creator = dElement.widgets[tag];
	
	if (creator) {
		return new creator(atts, children);
	}
	
	return new dElement(tag, atts, children);
};

element.dElement = dElement;
element.widgets = dElement.widgets;


(function(p){

	function set(obj, key, value) {
		if (value) {
			obj[key] = value;
		} else {
			delete obj[key];
		}
	}

	
	p.getElement = function(pos) {
		return this._elements[pos];
	};
	
	p.setElement = function(pos, element) {
		set(this._elements, pos, element);
		
		return this;
	};
	
	p.getParent = function() {
		return this.getElement('parent');
	};
	
	p.setParent = function(parent) {
		this.setElement('parent', parent);
		
		return this;
	};
	
	p.selectElement = function(pos) {
		var element = this.getElement(pos);
		
		if (element) {
			element.setParent(this);
			return element;
		}
		
		// bad if reache here!
		throw new TypeError('dElement.selectElement: unrecognised position');
	};
	
	p.start = function(tag, atts, children) {
		var theChild = element(tag, atts, children);
		
		theChild.setParent(this);
		
		this.child(theChild);
		
		return theChild;
	};
	
	p.end = function() {
		var parent = this.getParent();
		
		this.setParent();
		
		return parent;
	};
	
	p.att = function(name, value) {
		set(this._atts, name, value);
		return this;
	};

	p.atts = function(atts) {
		mixin(this._atts, atts);
		return this;
	};

	p.id = function(id) {
		this.att('id', id);
		return this;
	};
	
	p.klass = function(klass) {
		this._klasses[klass] = true;
		return this;
	};
	
	p.style = function(style) {
		this.att('style', style);
		return this;
	};
	
	p.type = function(title) {
		this.att('type', title);
		return this;
	};
	
	p.title = function(title) {
		this.att('title', title);
		return this;
	};
	
	p.value = function(title) {
		this.att('value', title);
		return this;
	};
	
	p.child = function(child) {
		this._children.push(child);
		return this;
	};

	p.children = function(children) {
		if (children instanceof Array) {
			this._children = this._children.concat(children);
		}
		
		return this;
	};

	p.handler = function(name, handler) {
		set(this._handlers, name, handler);
		return this;
	};

	p.handlers = function(handlers) {
		mixin(this._handlers, handlers);
		return this;
	};

	p.on = function(p1, p2) {
		if (typeof p1 === "object") {
			this.handlers(p1);
		} else {
			this.handler(p1, p2);
		}
		return this;
	};

	p.theme = function(theme) {
		if (typeof theme === 'string') {
			this._theme = theme;
			
		} else {
			throw new TypeError(
				"dElement.theme: theme is not a string"
			);
		}
		
		return this;
	};
	
	// actually create the element
	p.create = function() {
		set(this._atts,
			'class',
			(Object.keys(this._klasses)).join(' ')
		);
		
		var element = createElement(this._tag);
		
		var children = this._children;
		var child;
		var i;

		forEach(this._atts, function(value, name) {
			if (typeof value === "string") {
				element.setAttribute(name, value);
			} else {
				throw new TypeError(
					"dElement.create: value is not a string for attribute '" + name + "'"
				);
			}
		});
		
		if (this._theme) {
			element.classList.add(this._theme);
		}
		
		for (i=0; i<children.length; i++) {
			child = children[i];
			
			if (typeof child === "string") {
				child = createTextNode(child);

			} else if (child && typeof child == "object" && child.toNode) {
				if (this._theme && child.theme) {
					child.theme(this._theme);
				}
				
				child = child.toNode();
				
				if (!(child instanceof Node)) {
					child = null;
				}
				
			} else if (child instanceof Node) {
				if (this._theme) {
					if (child.classList) {
						child.classList.add(this._theme);
					}
				}
				
			} else {
				child = null;
			}
			
			if (child) {
				element.appendChild(child);
			}
		}
		
		forEach(this._handlers, function(value, name) {
			if (typeof value === "function") {
				addEventListener(element, name, value);
			} else {
				throw new TypeError(
					"dElement.create: value is not a function for handler '" + name + "'"
				);
			}
		});
		
		return element;
	};

	p.toNode = p.create;

}(dElement.prototype));


//------------------------------------------------------------
return element;


//------------------------------------------------------------
}});