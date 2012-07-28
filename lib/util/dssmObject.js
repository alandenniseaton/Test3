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
	
	var Result  = DSSManager.Result;
	var Promise = DSSManager.Promise;
	var Keeper  = Promise.Keeper;
	
	
	//-------------------------------------------------------------
	// use by DSSMObject.doGetElements
	function Iterator(source, ids) {
		this.source = source;
		this.ids = ids;
		this.i = 0;
	}
	
	(function(p) {
	
		p.className = 'DSSMObject.Iterator';
		
		p.setTarget = function(target) {
			this.target = target;
		};
		
		// schedule retrieving the next element
		p.next = function next() {
			this.id = this.ids[this.i];
			this.i++;
			btk.defer(this.step, [], this);
		};
		
		p.step = function step() {
			if (this.id) {

				this.source.getElement(this.id).then({
					'ok': function(result) {
						var result = new Result(this.source, result.value);
						result.id = this.id;
						
						this.target.set('element', result);

						// continue to the next element
						this.next();
					},
					
					'error': function(result, message) {
						// forward the error message so that
						// the client is notified
						this.target.receive(message);
					}
					
				} ,this );
				
			} else {
				this.target.ok( new Result(this.source, 'done') );
			}
		};
		
	}(Iterator.prototype));
	
	
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
		//	console.info('DSSMObject.doGetElement: ' + id);
			
			var element = this.dspace[id] || this.initial[id];
			
			// element may be null or undefined (indicating it is missing)
			// DSSManager issues the appropriate error
			var result = new Result(this, element);
			result.id = id;
			
			return result.promise();
		};

		
		p.doGetElements = function(ids) {
		//	console.info('DSSMObject.doGetElements: ' + JSON.stringify(ids));
			
			var keeper = new Keeper(
			
				function onStart(target) {
					this.setTarget(target);

					// schedule retrieval of the first element
					this.next();
				},
				
				function onCancel(reason) {
					// TODO
					// really should respond to cancellation
				},
				
				// context
				new Iterator(this, ids)
			);
			

			return new Promise(keeper);
		};

		
		p.doPutElement = function(id, element) {
		//	console.info('DSSMObject.doPutElement: ' + id);
			
			this.dspace[id] = element;
			
			var result = new Result(this, element);
			result.id = id;
			
			return result.promise();
		};

		
		p.doRemoveElement = function(id) {
		//	console.info('DSSMObject.doRemoveElement: ' + id);

			var result = new Result(this);
			result.id = id;
			
			if (this.dspace[id]) {
				delete this.dspace[id];
				
				result.value = true;
				return result.promise();
			}
			
			result.value = false;
			return result.error('nothing to remove');
		};

	}(DSSMObject.prototype));
	
	
	//-------------------------------------------------------------
	
	return DSSMObject;
	
	
}	// end init
});	// end define
