'use strict';

//-----------------------------------------------------------------
btk.define({
name: 'page@wtk',
libs: { de: 'element@wtk' },
css : [ 'base@wtk', 'page@wtk' ],
init: function(libs, exports) {

	var de = libs.de;

	//-------------------------------------------------------------
	function _Page(tag, atts, children) {
		_Page.SUPERCLASS.call(this, tag, atts, children);
		
		this.klass('wpage')
			.klass('root')
			.klass('box')
			.klass('stretch');
			
		this._element = {};
	}
	btk.inherits(_Page, de.dElement);
	
	(function(p) {
	
		p.className = '_Page';

		p.element = function(pos, klass, tag) {
			var element = this._element[pos];
			
			if (!element) {
				tag = tag || 'div';
			
				element = de(tag).klass('wpage').klass(klass);
				
				if (pos === 'body') {
					element.klass('flex');
				}
				
				this._element[pos] = element;
			}
			
			element._parent = this;
			
			return element;
		};
		
		p.body = function(tag) {
			return this.element('body', 'body', tag);
		};
		
		p.middle = p.body;
		
		p.addElement = function(pos, klass) {
			var element = this._element[pos];
			if (element) {
				this.child(element);
			}
		};
		
		p.create = function() {
			this.addElement('first');
			this.addElement('body');
			this.addElement('last');
			
			return _Page.SUPER.create.call(this);
			
			return node;
		};
		
		p.toNode = p.create;
		
	}(_Page.prototype));
	
	
	//-------------------------------------------------------------
	function VPage(tag, atts, children) {
		VPage.SUPERCLASS.call(this, tag, atts, children);
		
		this.klass('vertical');
	}
	btk.inherits(VPage, _Page);
	
	(function(p) {
	
		p.className = 'VPage';

		p.head = function(tag) {
			return this.element('first', 'head', tag);
		};
		
		p.foot = function(tag) {
			return this.element('last', 'foot', tag);
		};
		
	}(VPage.prototype));
	
	
	de.widgets.wvpage = VPage;
	
	
	//-------------------------------------------------------------
	function HPage(tag, atts, children) {
		HPage.SUPERCLASS.call(this, tag, atts, children);
		
		this.klass('horizontal');
	}
	btk.inherits(HPage, _Page);
	
	(function(p) {
	
		p.className = 'HPage';

		p.left = function(tag) {
			return this.element('first', 'left', tag);
		};
		
		p.right = function(tag) {
			return this.element('last', 'right', tag);
		};
		
	}(HPage.prototype));
	
	
	de.widgets.whpage = HPage;
	
	
	//-------------------------------------------------------------
	exports.VPage = VPage;
	exports.HPage = HPage;
	
}
});
