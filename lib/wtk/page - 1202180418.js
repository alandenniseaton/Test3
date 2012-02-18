'use strict';

//-----------------------------------------------------------------
btk.define({
name: 'page@wtk',
libs: { de: 'element@wtk' },
css : [ 'base@wtk', 'page@wtk' ],
init: function(libs, exports) {

	var de = libs.de;

	
	//-------------------------------------------------------------
	var seq = new btk.Sequence(0);
	
	
	//-------------------------------------------------------------
	function Cell(pos) {
		Page.SUPERCLASS.call(this, 'td');
		
		this._pos = pos;
	}
	btk.inherits(Cell, de.dElement);
	
	
	(function(p) {
	
		p.className = 'Page.Cell';

		p.create = function() {
			var element = Cell.SUPER.create.call(this);
			
			element.classList.add(this._pos)
			element.classList.add('cell');
			
			return element;
		};
		
		p.toNode = p.create;
		
	}(Cell.prototype));
	
	
	//-------------------------------------------------------------
	function Row(pos) {
		Page.SUPERCLASS.call(this, 'tr');
		
		this._pos = pos;
		this._cell = {};
	}
	btk.inherits(Row, de.dElement);
	
	
	(function(p) {
	
		p.className = 'Page.Row';

		p.cell = function(pos) {
			var cell = this._cell[pos];
			if (!cell) {
				cell = new Cell(pos);
				this._cell[pos] = cell;
			}
			
			cell._parent = this;
			
			return cell;
		};
		
		p.left = function() {
			return this.cell('left');
		};
		
		p.middle = function() {
			return this.cell('middle');
		};
		
		p.right = function() {
			return this.cell('right');
		};
		
		p.addCell = function(pos) {
			var cell = this._cell[pos];
			if (cell) {
				this.child(cell);
			}
		};
		
		p.create = function() {
			this.addCell('left');
			this.addCell('middle');
			this.addCell('right');
			
			var element = Row.SUPER.create.call(this);
			
			element.classList.add(this._pos)
			element.classList.add('row');
			
			return element;
		};
		
		p.toNode = p.create;
		
	}(Row.prototype));
	
	
	//-------------------------------------------------------------
	function Page(atts, children) {
		Page.SUPERCLASS.call(this, 'table', atts, children);
		
		this._row = {};
		
		this._tbody = de('tbody');
		
		this.klass('wpage').child(this._tbody);
	}
	btk.inherits(Page, de.dElement);
	
	(function(p) {
	
		p.className = 'WPage';

		p.row = function(pos) {
			var row = this._row[pos];
			if (!row) {
				row = new Row(pos);
				this._row[pos] = row;
			}
			
			row._parent = this;
			
			return row;
		};
		
		p.top = function() {
			return this.row('top');
		};
		
		p.middle = function() {
			return this.row('middle');
		};
		
		p.bottom = function() {
			return this.row('bottom');
		};
		
		p.addRow = function(pos) {
			var row = this._row[pos];
			if (row) {
				this._tbody.child(row);
			}
		};
		
		p.create = function() {
			this.addRow('top');
			this.addRow('middle');
			this.addRow('bottom');
			
			var element = Page.SUPER.create.call(this);
			
			element.classList.add('wpage');
			
			return element;
		};
		
		p.toNode = p.create;
		
	}(Page.prototype));
	
	
	de.widgets.wpage = Page;
	
	
	//-------------------------------------------------------------
	exports.Cell = Cell;
	exports.Row = Row;
	exports.Page = Page;
	
}
});
