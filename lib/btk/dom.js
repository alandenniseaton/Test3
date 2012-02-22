'use strict';

//------------------------------------------------------------	
btk.define({
name: "dom@btk",
init: function(libs, exports) {


//------------------------------------------------------------	
exports.isBadIE = (function() {
	if (!btk.config.browser.isIE)
		return false;
	
	var goodVersion = '9.0'.split('.');
	var glen        = goodVersion.length;
	var thisVersion = btk.config.browser.ieVersion[1].split('.');
	var tlen        = thisVersion.length;
	
	for (var i=0; i<tlen, i<glen; i++) {
		if (Number(thisVersion[i]) < Number(goodVersion[i])) {
			return true;
		}
	}
	
	return false;
})();

if (exports.isBadIE)
	btk.message("btk.dom: *** bad IE ***");
	

//------------------------------------------------------------
exports.createElement = function(tag) {
	return btk.document.createElement(tag);
}


exports.createTextNode = function(text) {
	return btk.document.createTextNode(text);
}


exports.getElementById = function(id) {
	return btk.document.getElementById(id);
}


if (exports.isBadIE) {
	Window.prototype.getComputedStyle = function(element) {
		return element.currentStyle;
	}
}

// !!! IE9 key events are NOT instances of Event
// so this will not work for them
if (!Event.prototype.stopPropagation) {
	if (btk.config.browser.isIE) {
		Event.prototype.stopPropagation = function() {
			this.cancelBubble = true;
		};
	}
}

// ??? does this work for key events
exports.stopPropagation = function(event) {
	if (event.stopPropagation) {
		event.stopPropagation();
	} else if (btk.config.browser.isIE) {
		event.cancelBubble = true;
	}
};

exports.preventDefault = function(event) {
	if (event.preventDefault) {
		event.preventDefault();
		
	} else if (btk.config.browser.isIE) {
		switch (event.type) {
			case "keydown" :
			case "keypress" :
			case "keyup" :
				try {
					event.keyCode = 0;
					event.returnValue = false;
				} catch(e) {
					//nothing
				}
				break;
			default:
				//nothign
				break;
		}
	}
};

exports.stopEvent = function(event) {
	exports.stopPropagation(event);
	exports.preventDefault(event);
};

// name does NOT have an 'on' prefix
// the global object is passed as 'this'
exports.addEventListener = (function(){
	var w = btk.global;
	var add;
	
	if (w.attachEvent) {
		add = "attachEvent";
		return function(el, name, f) {
			name = 'on' + name;
			el[add](name, function(){ f.call(el, w.event); });
		};
	} else if (w.addEventListener) {
		add = "addEventListener";
		return function(el, name, f, capture) {
			el[add](name, function(event){ f.call(el, event); }, capture);
		};
	} else {
		add = "nothing";
		return nothing;
	}
}());


//------------------------------------------------------------
}});
