'use strict';

//-----------------------------------------------------------------
// DSSManager: extends Object
//
// this is an abstract class.
// don't make instances of it!
//
// dssm's return promises for a new state.
// doing so aids sequencing of commands.
// having ALL methods return an object also helps.

btk.define({
name: 'dssManager@util',
libs: { promise: 'promise@btk' },
init: function(libs, exorts) {


	var wrap = libs.promise.wrap;
	
	
	//-------------------------------------------------------------
	function DSSManager() {
		throw new Error('DSSManager: attempt to instantiate abstract class');
	}
	
	DSSManager.Result = function(dssm, element) {
		this.dssm = dssm;
		this.element = element;
	};
	
	(function(p){
	
		p.name = 'DSSManager';
		
		//
		// the child classes provide methods to do the real work
		// the methods in this class tie things together
		//
		
		p.init = function() {
			this.isDirty = false;
			this.isOpen = false;
		};
		
		
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
			return wrap(new DSSManager.Result(this, element));
		};
		
		
		p.open = function() {
			return this.doOpen().then(
				function(result) {
					this.isOpen = true;
					return result;
				},
				this
			);
		};
		
		
		p.doOpen = function() {
			return this.newResult();
		};

		
		p.getElement = function(id) {
			if (!btk.isNumber(id)) {
				throw new TypeError('DSSManager.getElement: expected id:Integer');
			}
		
			return this.doGetElement(id);
		};
		
		
		p.doGetElement = function(id, element) {
			return this.newResult(null);
		};

		
		p.putElement = function(id, element) {
			if (!btk.isNumber(id)) {
				throw new TypeError('DSSManager.putElement: expected id:Integer, element:Anything');
			}
			
			this.doPutElement(id, element).then(
				function(result) {
					this.smudge();
					return result;
				},
				this
			);
		};
		
		
		p.doPutElement = function(id, element) {
			return this.newResult();
		};

		
		p.commit = function() {
			if (!this.isDirty) {
				return this.newResult();
			}
			
			// commit all updates
			// the data space should be in a safe state at resolution
			// of the promise.
			
			this.doCommit().then(
				function(result) {
					this.clean();
					return result;
				},
				this
			);
		};
		
		
		p.doCommit = function() {
			return this.newResult();
		};

		
		p.close = function() {
			this.commit().chain([
			
				function(result) {
					return this.doClose();
				},
				
				function(result) {
					this.isOpen = false
					return result;
				},
				
			], this );
		};

		
		p.doClose = function() {
			return this.newResult();
		};
		
		
	}(DSSManager.prototype));

	
	//-------------------------------------------------------------
	
	return DSSManager;
	
	
}	// end init
});	// end define
