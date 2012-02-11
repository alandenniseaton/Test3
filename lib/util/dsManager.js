'use strict';

//-----------------------------------------------------------------
btk.define({
name: 'dsManager@util',
libs: {
	DSSManager: 'dssManager@util',
	promise: 'promise@btk'
},
init: function(libs, exports) {


	var DSSManager = libs.DSSManager;
	
	var promise = libs.promise;
	var Result  = promise.Result;
	var wrap    = promise.wrap;

	var SYSTEM = 0;
	
	
	//-------------------------------------------------------------
	function DSManager(dssManager) {
		if (!(dssManager instanceof DSSManager)) {
			throw new TypeError('DSManager: expected dssManager:DSSManager');
		}
		
		this.dssm = dssManager;
		this.isOpen = false;
		this.isdirty = false;
		
		this.dssm.onsmudge = this.smudge.bind(this);
		this.dssm.onclean  = this.clean.bind(this);
	}
	
	
	(function(p){
		p.className = 'DSManager';
		
		p.clean = function() {
			console.info('DSManager.clean');
			
			if (!this.isDirty) { return this; }
			
			this.isDirty = false;
			
			if (this.onclean && btk.isFunction(this.onclean)) {
				return this.onclean();
			}
		};
		
		
		p.smudge = function() {
			console.info('DSManager.smudge');
			
			if (this.isDirty) { return this; }
			
			this.isDirty = true;
			
			if (this.onsmudge && btk.isFunction(this.onsmudge)) {
				return this.onsmudge();
			}
		};
		
		
		p.newResult = function(value, params) {
			return Result.make(this, value, params);
		};
		
		
		p.open = function() {
		
			return this.dssm.open().chain([
			
				function(result) {
					return result.source.getElement(SYSTEM);
				},
				
				function(result) {
					this.system = result.value;
					this.tagmapid = this.system.data.tagmapid;
					
					return result.source.getElement(this.tagmapid)
				},
				
				function(result) {
					this.tagmap = result.value;
					this.isOpen = true;
					
					result.init(this);
				}
			], this );
			
		};
		
		
		p.getElement = function(id) {
			return this.dssm.getElement(id).then(
				function(result) {
					result.source = this;
				}, this
			);
		};
		
		
		p.putElement = function(id, element) {
			return this.dssm.putElement(id, element).then(
				function(result) {
					result.source = this;
				}, this
			);
		};
		
		
		p.addElement = function(element) {
			var id = this.system.data.nextid++;
			
			return this.putElement(id, element)
		};
		
		
		p.removeElement = function(id) {
			return this.dssm.removeElement(id).then(
				function(result) {
					result.init(this, true);
				}, this
			);
		};

		
		p.commit = function() {
			if (!this.isDirty) { return this.newResult(); }
			
			return Result.chain([
			
				function() {
					return this.putElement(SYSTEM, this.system);
				},
				
				function(result) {
					return this.putElement(this.tagmapid, this.tagmap);
				},
				
				function(result) {
					return this.dssm.commit();
				},
				
				function(result) {
					result.init(this);
				}
				
			], this );
		};
		
		
		p.close = function() {
			if (!this.isOpen) { return this.newResult(); }

			return Result.chain([
			
				function() {
					return this.commit();
				},
			
				function(result) {
					return this.dssm.close();
				},
				
				function(result) {
					this.isOpen = false;
					result.init(this);
				}
				
			], this );
		};
		
	}(DSManager.prototype));
	
	
	//-------------------------------------------------------------
	
	return DSManager;
	
}	// end init
});	// end define
