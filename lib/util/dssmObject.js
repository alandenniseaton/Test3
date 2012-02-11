'use strict';

//-----------------------------------------------------------------
// DSSMObject: extends DSSManager
//
// a very basic data space storage manager.
// data is simply stored in an object.

btk.define({
name: 'dssmObject@util',
libs: { DSSManager: 'dssManager@util' },
init: function(libs, exorts) {


	var DSSManager = libs.DSSManager;
	
	
	//-------------------------------------------------------------
	function DSSMObject(initial) {
		this.init();
		
		this.initial = btk.ifObject(initial, {});
		this.dspace  = {};
	}
	btk.inherits(DSSMObject, DSSManager);
	
	
	(function(p){
	
		p.className = 'DSSMObject';
		
		p.doGetElement = function(id) {
			console.info('DSSMObject.doGetElement: ' + id);
			
			return this.newResult(
				this.dspace[id] || this.initial[id]
			);
			
			if (this.dspace[id]) {
				delete this.dspace[id];
				
				return this.newResult();
			}
			
			return this.newResult(id).error('nothing to retrieve');
		};

		p.doPutElement = function(id, element) {
			console.info('DSSMObject.doPutElement: ' + id);
			
			this.dspace[id] = element;
			
			return this.newResult(id);
		};

		p.doRemoveElement = function(id) {
			console.info('DSSMObject.doRemoveElement: ' + id);

			if (this.dspace[id]) {
				delete this.dspace[id];
				
				return this.newResult();
			}
			
			return this.newResult(id).error('nothing to remove');
		};

	}(DSSMObject.prototype));
	
	
	//-------------------------------------------------------------
	
	return DSSMObject;
	
	
}	// end init
});	// end define
