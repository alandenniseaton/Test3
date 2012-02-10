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
	
		p.name = 'DSSMObject';
		
		p.doGetElement = function(id) {
			return this.newResult(this.dspace[id] || this.initial[id]);
		};

		
		p.doPutElement = function(id, element) {
			this.dspace[id] = element;
			
			return this.newResult();
		};

	}(DSSMObject.prototype));
	
	
	//-------------------------------------------------------------
	
	return DSSMObject;
	
	
}	// end init
});	// end define
