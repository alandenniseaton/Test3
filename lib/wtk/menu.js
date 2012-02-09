//-----------------------------------------------------------------
btk.define({
name: 'menu@wtk',
libs: { de : 'element@wtk' },
css : [ 'menu@wtk' ],
init: function(libs, exports) {

	var de = libs.de;

	
	//-------------------------------------------------------------
	var seq = new btk.Sequence(0);
	
	
	//-------------------------------------------------------------
	function MenuItem(atts, children) {
		MenuItem.SUPERCLASS.call(this, 'div', atts, children);
		
		this.id('wmitem-' + seq.next());
	}
	btk.inherits(MenuItem, de.dElement);
	
	(function(p) {
	
		p.name = 'MenuItem';
		
		p.label = function(label) {
			if (!this._label) {
				this._label = (label);
				this.child(label);
			}
			
			return this;
		};
		
		p.action = function(action) {
			if (!this._action) {
				this._action = action;
				this.on('click', action);
			}
			
			return this;
		};
		
		p.create = function() {
			if (!this._label) {
				this.label('no label');
			}
			
			if (!this._action) {
				this.action(btk.nothing);
			}
			
			var element = Menu.SUPER.create.call(this);
			
			element.classList.add('wmitem');
			
			return element;
		};
		
		p.toNode = p.create;
		
	}(MenuItem.prototype));
	
	
	de.widgets.wmitem = MenuItem;
	
	
	//-------------------------------------------------------------
	function Menu(atts, children) {
		Menu.SUPERCLASS.call(this, 'div', atts, children);
	}
	btk.inherits(Menu, de.dElement);
	
	(function(p) {
		p.name = 'Menu';
		
		p.head = function(label) {
			label = btk.ifString(label, 'no head');
			
			this.start('div')
				.att('class', 'wmhead')
				.child(label)
				.end()
			;
			
			return this;
		};
		
		p.item = function(label, action) {
			this.start('wmitem')
				.label(label)
				.action(action)
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
		
		p.create = function() {
			var element = Menu.SUPER.create.call(this);
			
			element.id = 'wmenu-' + seq.next();
			element.classList.add('wmenu');
			
			return element;
		};
		
		p.toNode = p.create;
		
	}(Menu.prototype));
	
	
	de.widgets.wmenu = Menu;
	
	
	//-------------------------------------------------------------
	function MenuBox(atts, children) {
		MenuItem.SUPERCLASS.call(this, 'div', atts, children);
		
		this._button = de('div')
			.id('wmbutton-' + seq.next())
			.klass('wmbutton')
		;
		
		this._menu = de('wmenu')
			.on('mouseout', function(e){
				if (e.fromElement.id === this.id && e.toElement.parentElement !== this) {
					this.parentElement.removeChild(this);
				}
			})
		;
		
		
		this.id('wmbox-' + seq.next());
		
		var that = this;
		this.on('click', function(e) {
			this.appendChild(that._menu.create());
		});

		this.child(this._button);
	}
	btk.inherits(MenuBox, de.dElement);
	
		
	(function(p) {
		p.name = 'MenuBox';

		p.button = function() {
			this._button._parent = this;
			return this._button;
		}
		
		p.menu = function() {
			this._menu._parent = this;
			return this._menu;
		}
		
		p.create = function() {
			var element = Menu.SUPER.create.call(this);
			
			element.classList.add('wmbox');
			
			return element;
		};
		
		p.toNode = p.create;
		
	}(MenuBox.prototype));
	
	de.widgets.wmbox = MenuBox;
	
	
	//-------------------------------------------------------------
	exports.MenuItem = MenuItem;
	exports.Menu = Menu;
	exports.MenuBox = MenuBox;
}
});
