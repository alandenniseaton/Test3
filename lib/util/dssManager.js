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
	var Result = libs.promise.Result;
	
	
	//-------------------------------------------------------------
	var ERROR = {
		'OK': {
			'code': 0,
			'msg' : 'Everything is OK'
		},
		'ABSTRACT':	{
			'code': 1,
			'msg' : 'Attempt to instantiate an abstract class'
		},
		'PARAMS': {
			'code': 2,
			'msg' : 'Invalid parameters'
		},
		'NOT_OPEN': {
			'code': 99,
			'msg' : 'Data space storage manager is not open'
		}
	};

	
	function DSSManager() {
		throw this.error(null, ERROR.ABSTRACT);
	}
	
	
	DSSManager.ERROR = ERROR;
	
	function error(ErrorClass, where, data, msg) {
		var err = new ErrorClass(data.msg + (msg || ''));
		
		err.where = this.className + (where? ('.' + where): '');
		err.code = data.code;
		
		return err;
	}
	
	
	(function(p){
	
		p.className = 'DSSManager';
		
		//
		// the child classes provide methods to do the real work.
		// the methods in this class orchestrate things.
		//
		
		p.newResult = function(value, params) {
			return Result.make(this, value, params);
		};
		
		
		p.error = function(where, data, msg) {
			return error.call(this, Error, where, data, msg);
		};
		
		
		p.typeError = function(where, data, msg) {
			return error.call(this, TypeError, where, data, msg);
		};
		
		
		p.init = function() {
			this.isDirty = false;
			this.isOpen = false;
		};
		
		
		p.clean = function() {
			if (!this.isDirty) { return this; }
			
			this.isDirty = false;
			
			if (this.onclean && btk.isFunction(this.onclean)) {
				return this.onclean();
			}
		};
		
		
		p.smudge = function() {
			if (this.isDirty) { return this; }
			
			this.isDirty = true;
			
			if (this.onsmudge && btk.isFunction(this.onsmudge)) {
				return this.onsmudge();
			}
		};
		
		
		p.open = function() {
			if (this.isOpen) { return this.newResult(); }
			
			return this.doOpen().then(function(result) {
				this.isOpen = true;
			}, this );
		};
		
		
		// child overrides this
		p.doOpen = function() {
			return this.newResult();
		};

		
		p.getElement = function(id) {
			if (!this.isOpen) {
				throw this.error('getElement', ERROR.NOT_OPEN);
			}
		
			if (!btk.isNumber(id)) {
				throw this.typeError('getElement', ERROR.PARAMS, ': expected id:Integer');
			}
		
			return this.doGetElement(id);
		};
		
		
		// child overrides this
		p.doGetElement = function(id, element) {
			return this.newResult(null);
		};

		
		p.putElement = function(id, element) {
			if (!this.isOpen) {
				throw this.error('putElement', ERROR.NOT_OPEN);
			}
		
			if (!btk.isNumber(id)) {
				throw this.typeError('putElement', ERROR.PARAMS, ': expected id:Integer');
			}
		
			return this.doPutElement(id, element).then(function(result) {
				this.smudge();
			}, this );
		};
		
		
		// child overrides this
		p.doPutElement = function(id, element) {
			return this.newResult();
		};

		
		p.removeElement = function(id) {
			if (!this.isOpen) {
				throw this.error('removeElement', ERROR.NOT_OPEN);
			}
		
			if (!btk.isNumber(id)) {
				throw this.typeError('removeElement', ERROR.PARAMS, ': expected id:Integer');
			}
		
			return this.doRemoveElement(id).then(function(result) {
				this.smudge();
			}, this );
		};
		
		
		// child overrides this
		p.doRemoveElement = function(id) {
			return this.newResult();
		};

		
		p.commit = function() {
			if (!this.isOpen) {
				throw this.error('commit', ERROR.NOT_OPEN);
			}
		
			if (!this.isDirty) {
				return this.newResult();
			}
			
			return this.doCommit().then(function(result) {
				this.clean();
			}, this );
		};
		
		
		// child overrides this
		p.doCommit = function() {
			return this.newResult();
		};

		
		p.close = function() {
			if (!this.isOpen) { return this.newResult(); }
		
			return this.commit().chain([
			
				function(result) {
					return this.doClose();
				},
				
				function(result) {
					this.isOpen = false
				},
				
			], this );
		};

		
		// child overrides this
		p.doClose = function() {
			return this.newResult();
		};
		
		
	}(DSSManager.prototype));

	
	//-------------------------------------------------------------
	
	return DSSManager;
	
	
}	// end init
});	// end define
