'use strict';

//============================================================
//	lstorage :: Module
//============================================================


btk.define({
name: 'lstorage@btk',
libs: {},
init: function(libs, exports) {

	
	//--------------------------------------------------------
	function Manager(prefix, parent) {
		this.prefix = btk.ifString(prefix, '???');
		
		this.parent = parent;
        
        this.fullPrefix = this.getPrefix();
	}
	
	(function(p){
	
		p.className = 'lstorage.Manager';
		
		p.spawn = function(prefix) {
			return new Manager(prefix, this);
		};
		
		p.getPrefix = function() {
			if (this.parent) {
				var pprefix = this.parent.getPrefix();
				return pprefix? pprefix + '.' + this.prefix: this.prefix;
			}
			
			return this.prefix;
		};
		
		p.expand = function(key) {
			var prefix = this.fullPrefix;
			
			return prefix? prefix + '.' + key: key;
		};
		
		p.get = function(key) {
			var v = localStorage.getItem(this.expand(key));
			var value = null;
			
			if (typeof v === 'string') {
				try { value = JSON.parse(v); }
				catch(e) {}
			}
			
			return value;
		};

		
		p.set = function(key, value) {
			var done = false;
			
			try {
				localStorage.setItem(this.expand(key), JSON.stringify(value));
				done = true;
			}
			catch(e) {}
			
			if (done) { return value; }
            
            return null;
		};
		

		p.getset = function(key, defaultValue) {
			var value = this.get(key);
			
			if (!btk.isDefined(value)) {
				value = defaultValue;
				this.set(key, value);
			}
			
			return value;
		};
			
		
		p.remove = function(key) {
			localStorage.removeItem(this.expand(key));
		};
		
		
		p.toString = function() {
			return this.className + '(\'' + this.getPrefix() + '\')';
		};
		
	}(Manager.prototype));
	
	
	exports.Manager = Manager;
	
	
//------------------------------------------------------------
}});