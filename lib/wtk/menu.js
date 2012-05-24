'use strict';

//-----------------------------------------------------------------
btk.define({
name: 'menu@wtk',
libs: {
	dom: 'dom@btk',
	de: 'element@wtk'
},
css : [ 'menu@wtk' ],
init: function(libs, exports) {

	var dom = libs.dom;
	var stopEvent = dom.stopEvent;
	
	var de = libs.de;

	
	//-------------------------------------------------------------
	var seq = new btk.Sequence(0);
	
	
	//-------------------------------------------------------------
	function MenuItem(atts, children) {
		MenuItem.SUPERCLASS.call(this, 'div', atts, children);
		
		this.id('wmitem-' + seq.next())
			.klass('wmitem')
		;
	}
	btk.inherits(MenuItem, de.dElement);
	
	(function(p) {
	
		p.className = 'WMenuItem';
		
		p.label = function(label) {
			if (!this._label) {
				this._label = (label);
				this.child(label);
			}
			
			return this;
		};
		
		p.action = function(action) {
			this._action = action;
			this.on('click', action);
			
			return this;
		};
		
		p.disable = function(disabled) {
			this.disabled = !!disabled;
			return this;
		};
		
		p.create = function() {
			if (!this._label) {
				this.label('no label');
			}
			
			if (this.disabled || !this._action) {
				this.klass('disabled');
				this.action(null);
			}
			
			return Menu.SUPER.create.call(this);
		};
		
		p.toNode = p.create;
		
	}(MenuItem.prototype));
	
	
	de.widgets.wmitem = MenuItem;
	
	
	//-------------------------------------------------------------
	function Menu(atts, children) {
		Menu.SUPERCLASS.call(this, 'div', atts, children);
		
		this.id('wmenu-' + seq.next())
			.klass('wmenu')
		;
	}
	btk.inherits(Menu, de.dElement);
	
	(function(p) {
		p.className = 'WMenu';
		
		p.head = function(label) {
			label = btk.ifString(label, 'no head');
			
			this.start('div')
				.klass('wmhead')
				.child(label)
				.end()
			;
			
			return this;
		};
		
		p.item = function(label, action, disabled) {
			this.start('wmitem')
				.label(label)
				.action(action)
				.disable(disabled)
				.end()
			;
			return this;
		};
		
		p.line = function() {
			this.child(
				de('div', {'class':'line'})
			);
			
			return this;
		};
		
	}(Menu.prototype));
	
	
	de.widgets.wmenu = Menu;
	
	
	//-------------------------------------------------------------
	function MenuBox(atts, children) {
		MenuBox.SUPERCLASS.call(this, 'div', atts, children);
		
		this.id('wmbox-' + seq.next())
			.klass('wmbox')
		;
		
		var button = de('div')
			.id('wmbutton-' + seq.next())
			.klass('wmbutton')
		;
		this.setElement('button', button);
		this.child(button);
		
		var menu = de('wmenu')
			.on('mouseout', function(e){
				if (e.fromElement.id === this.id && e.toElement.parentElement !== this) {
					this.parentElement.removeAttribute('data-clicked');
					this.parentElement.removeChild(this);
				}
			})
		;
		this.setElement('menu', menu);
		
		var that = this;
		that.on('click', function(e) {
			stopEvent(e);
			if (!this.dataset.clicked) {
				this.appendChild(that.getElement('menu').create());
				this.setAttribute('data-clicked', true);
			}
		});
	}
	btk.inherits(MenuBox, de.dElement);
	
		
	(function(p) {
		p.className = 'WMenuBox';

		p.button = function() {
			return this.selectElement('button');
		}
		
		p.menu = function() {
			return this.selectElement('menu');
		}
		
	}(MenuBox.prototype));
	
	de.widgets.wmbox = MenuBox;
	
	
	//-------------------------------------------------------------
	exports.MenuItem = MenuItem;
	exports.Menu = Menu;
	exports.MenuBox = MenuBox;
}
});
