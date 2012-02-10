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
	var Promise = promise.Promise;
	var wrap = promise.wrap;
	

	var SYSTEM = 0;
	
	
	//-------------------------------------------------------------
	function DSManager(dssManager) {
		if (!(dssManager instanceof DSSManager)) {
			throw new TypeError('DSManager: expected dssManager:DSSManager');
		}
		
		this.dssm = dssManager;
		this.isOpen = false;
		this.isdirty = false;
	}
	
	DSManager.Result = function(dsm, element) {
		this.dsm = this;
		this.element = element;
	};
	
	
	(function(p){
		p.name = 'DSManager';
		
		p.clean = function() {
			if (!this.isDirty) {
				return this;
			}
			
			this.isDirty = false;
			
			if (this.onclean && btk.isFunction(this.onclean)) {
				return this.onclean();
			}
		};
		
		
		p.smudge = function() {
			if (this.isDirty) {
				return this;
			}
			
			this.isDirty = true;
			
			if (this.onsmudge && btk.isFunction(this.onsmudge)) {
				return this.onsmudge();
			}
		};
		
		
		p.newResult = function(element) {
			return new DSManager.Result(this, element);
		};
		
		
		p.open = function() {
		
			return this.dssm.open().chain([
			
				function(result) {
					return result.dssm.getElement(SYSTEM)
				},
				
				function(result) {
					this.system = result.element;
					return result;
				},
				
				function(result) {
					this.tagmapid = this.system.data.tagmapid
					return result.dssm.getElement(this.tagmapid)
				},
				
				function(result) {
					this.tagmap = result.element;
					return result;
				},
				
				function(result) {
					this.isOpen = true;
					return this.newResult();
				}
			], this );
			
		};
		
		p.getElement = function(id) {
			return this.dssm.getElement(id).then(
				function(result) {
					return this.newResult(result.element);
				}, this
			);
		};
		
		p.putElement = function(id, element) {
			return this.dssm.putElement(id, element).then(
				function(result) {
					return this.newResult();
				}, this
			);
		};
		
		p.commit = function() {
			return this.dssm.commit().then(
				function(result) {
					return this.newResult();
				}, this
			);
		};
		
		p.close = function() {
			return this.dssm.close().then(
				function(result) {
					this.isOpen = false;
					return this.newResult();
				}, this
			);
		};
		
	}(DSManager.prototype));
	
	
	//-------------------------------------------------------------
	
	return DSManager;
	
}	// end init
});	// end define
