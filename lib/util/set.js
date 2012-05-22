'use strict';

//-----------------------------------------------------------------
// an implementation of sets
//-----------------------------------------------------------------
btk.define({
name: 'set@util',
init: function() {

	var forEach = btk.object.forEach;
	
	
	function Set() {
		this._element = {};
		this._size = 0;
	};
	
	(function(p){
	
		p.className = 'Set';

		p.isEmpty = function() {
			return this._size === 0;
		};
		
		p.size = function() {
			return this._size;
		};
		
		p.elements = function() {
			return Object.keys(this._element);
		};
		
		p.toArray = p.elements;
		
		p.has = function(x) {
			return this._element[x];
		};
		
		p.add = function(x) {
			if (!this.has(x)) {
				this._element[x] = true;
				this._size++;
			}
			
			return this;
		};

		p.addArray = function(a) {
			if (!btk.isArray(a)) {
				throw new TypeError('Set.addArray: expected a:Array');
			}
			
			for (var i=0, l=a.length; i<l; i++) {
				this.add(a[i]);
			}
			
			return this;
		};
		
		p.remove = function(x) {
			if (this.has(x)) {
				delete this._element[x];
				this._size--;
			}
			
			return this;
		};
		
		p.apply = function(f, context) {
			forEach(this._element, function(bool, element) {
				f.call(this, element);
			}, context );
			
			return this;
		};
		
		p.map = function(f, context) {
			var result = new Set();
			
			this.apply(function(element) {
				result.add(f.call(this, element));
			}, context );
			
			return result;
		};
		
		p.clone = function() {
			var result = new Set();
			
			this.apply(function(element) {
				result.add(element);
			}, result);
			
			return result;
		};
		
		p.merge = function(other) {
			if (!(other instanceof Set)) {
				throw new TypeError('Set.merge: expected other:Set');
			}
			
			other.apply(function(element){ this.add(element); }, this);
			
			return this;
		};
		
		p.union = function(other) {
			return this.clone().merge(other);
		};

		p.diff = function(other) {
			if (!(other instanceof Set)) {
				throw new TypeError('Set.diff: expected other:Set');
			}
			
			var result = new Set();
			
			this.apply(function(element) {
				if (!other.has(element)) {
					result.add(element);
				}
			}, result);
			
			return result;
		};
		
		p.sdiff = function(other) {
			return this.diff(other).union(other.diff(this));
		};
		
		p.intersect = function(other) {
			if (!(other instanceof Set)) {
				throw new TypeError('Set.intersect: expected other:Set');
			}
			
			var result = new Set();
			
			this.apply(function(element) {
				if (other.has(element)) {
					result.add(element);
				}
			});
			
			return result;
		};
		
	}(Set.prototype));
	
	
	return Set;
	
}	// end init
});	// end define
