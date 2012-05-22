'use strict';

//-----------------------------------------------------------------
btk.define({
name: 'page@wtk',
libs: { de: 'element@wtk' },
css : [ 'base@wtk', 'box@wtk', 'page@wtk' ],
init: function(libs, exports) {

	var de = libs.de;

	//-------------------------------------------------------------
	function _Page(atts, children) {
		_Page.SUPERCLASS.call(this, 'div', atts, children);
		
		this.klass('wpage')
			.klass('box')
			.klass('stretch');
	}
	btk.inherits(_Page, de.dElement);
	
	(function(p) {
	
		p.className = '_Page';

		p.element = function(pos, klass, tag) {
			var element = this.getElement(pos);
			
			if (!element) {
				tag = tag || 'div';
			
				element = de(tag).klass('wpage').klass(klass);
				
				if (pos === 'body') {
					element.klass('flex');
				}
				
				this.setElement(pos, element);
			}
			
			element.setParent(this);
			
			return element;
		};
		
		p.body = function(tag) {
			return this.element('body', 'body', tag);
		};
		
		p.middle = p.body;
		
		p.getBody = function() {
			return this.getElement('body');
		};
		
		p.getMiddle = p.getBody;
		
		p.addElement = function(pos) {
			var element = this.getElement(pos);
			if (element) {
				this.child(element);
			}
		};
		
		p.create = function() {
			this.addElement('first');
			this.addElement('body');
			this.addElement('last');
			
			return _Page.SUPER.create.call(this);
		};
		
		p.toNode = p.create;
		
	}(_Page.prototype));
	
	
	//-------------------------------------------------------------
	function VPage(atts, children) {
		VPage.SUPERCLASS.call(this, atts, children);
		
		this.klass('vertical');
	}
	btk.inherits(VPage, _Page);
	
	(function(p) {
	
		p.className = 'VPage';

		p.head = function(tag) {
			return this.element('first', 'head', tag);
		};
		
		p.getHead = function() {
			return this.getElement('first');
		};
		
		p.foot = function(tag) {
			return this.element('last', 'foot', tag);
		};
		
		p.getfoot = function() {
			return this.getElement('last');
		};
		
	}(VPage.prototype));
	
	
	de.widgets.wvpage = VPage;
	
	
	//-------------------------------------------------------------
	function HPage(atts, children) {
		HPage.SUPERCLASS.call(this, atts, children);
		
		this.klass('horizontal');
	}
	btk.inherits(HPage, _Page);
	
	(function(p) {
	
		p.className = 'HPage';

		p.left = function(tag) {
			return this.element('first', 'left', tag);
		};
		
		p.getLeft = function() {
			return this.getElement('first');
		};
		
		p.right = function(tag) {
			return this.element('last', 'right', tag);
		};
		
		p.getRight = function() {
			return this.getElement('last');
		};
		
	}(HPage.prototype));
	
	
	de.widgets.whpage = HPage;
	
	
	//-------------------------------------------------------------
	exports.VPage = VPage;
	exports.HPage = HPage;
	
}
});
