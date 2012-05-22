'use strict';

//-----------------------------------------------------------------
//
// FOR TESTING
//
// Import elements from the old bookmarks dataspace
//
//-----------------------------------------------------------------
btk.define({
name: 'importOld@bookmarks',
libs: {
	ls: 'lstorage@btk',
	pr: 'promise@btk',
//	dsm: 'dsManager@util'
},
init: function(libs, exports) {

	var LSManager = libs.ls.Manager;
	var Result    = libs.pr.Result;
	var PIterator = libs.pr.PIterator;
	var PWhile    = libs.pr.PWhile;
	
	function importOld(dsm) {
		console.log('importOld@bookmarks');
		console.log(dsm);

		var lsm = new LSManager('bookmarks-old');
		var dspace = lsm.get('bookmarks');
		console.log(dspace);
		
		
		function addElement(d) {
		//	console.log('importOld@bookmarks: adding element: ' + d.id);
			var dse = dsm.newElement();

			dse.setTitle(d.title);
			dse.setData(d.data.split('\n'));
			dse.setLink(d.link);
			dse.setField('created', d.created);
			
			return Result.chain([
			
				function(result) {
					if (this.link.indexOf('sci.math') !== -1) {
						this.tagged = true;
						return this.dsm.addElementToTag(this.dse, 'sci.math');
					}
				},
				
				function(result) {
					if (this.link.indexOf('sci.logic') !== -1) {
						this.tagged = true;
						return this.dsm.addElementToTag(this.dse, 'sci.logic');
					}
				},
				
				function(result) {
					if (this.link.indexOf('google') !== -1) {
						this.tagged = true;
						return this.dsm.addElementToTag(this.dse, 'google');
					}
				},
				
				function(result) {
					if (this.link.indexOf('group') !== -1) {
						this.tagged = true;
						return this.dsm.addElementToTag(this.dse, 'group');
					}
				},
				
				function(result) {
					if (this.link.indexOf('forum') !== -1) {
						this.tagged = true;
						return this.dsm.addElementToTag(this.dse, 'forum');
					}
				},
				
				function(result) {
					if (this.link.indexOf('philosophy') !== -1) {
						this.tagged = true;
						return this.dsm.addElementToTag(this.dse, 'philosophy');
					}
				},
				
				function(result) {
					if (this.link.indexOf('plato') !== -1) {
						this.tagged = true;
						return this.dsm.addElementToTag(this.dse, 'philosophy');
					}
				},
				
				function(result) {
					if (this.link.indexOf('.pdf') !== -1) {
						this.tagged = true;
						return this.dsm.addElementToTag(this.dse, 'pdf');
					}
				},
				
				function(result) {
					if (this.link.indexOf('faq') !== -1) {
						this.tagged = true;
						return this.dsm.addElementToTag(this.dse, 'faq');
					}
				},
				
				function(result) {
					if (this.link.indexOf('tutorial') !== -1) {
						this.tagged = true;
						return this.dsm.addElementToTag(this.dse, 'tutorial');
					}
				},
				
				function(result) {
					if (this.dse.getTitle().indexOf('TODO') !== -1) {
						this.tagged = true;
						return this.dsm.addElementToTag(this.dse, 'todo');
					}
				},
				
				function(result) {
					if (!this.tagged) {
						return this.dsm.addElementToTag(this.dse, 'misc');
					}
				},
				
				function() {
					var state = d.dead? '@@@dead': '@@@live';
			
					return this.dsm.addElementToTag(this.dse, state);
				},
				
				function(result) {
					// reinstate the old update value
					this.dse.getElement().updated = this.d.updated;
					
					return this.dsm.putElement(this.dse);
				}
				
			] ,{'dsm':dsm, 'dse':dse, 'd':d, 'link':dse.getLink()} );
		}
		
		
		var loop = function(data, list) {
			var it = new PIterator();
			
			it.data   = data;
			it.list   = list;
			it.length = it.list.length;
			
			it.init = function() {
				this.i = 0;
				this.d = this.data[this.list[this.i]];
				return new Result(this).promise();
			};
		
			it.advance = function() {
				this.i++;
				this.d = this.data[this.list[this.i]];
				return new Result(this).promise();
			};
			
			it.value = function() {
				return this.d;
			};
			
			it.done = function() {
				return !this.d;
			};
			
			var put = function(value, pwhile) {
			//	console.log('importOld@bookmarks: supposed to add element: ' + value.id);
				return addElement(value);
			};
			
			var pwhile = new PWhile(it, put);
			
			return pwhile.start().then({

				'ok' : function(result, message) {
					console.log('importOld@bookmarks: done');
				},
				
				'step': function(result, message) {
				//	console.log('importOld@bookmarks: step: new id: ' + result.value.id);
					message.stop();
				},
				
				'default': function(result, message) {
					console.log('importOld@bookmarks: default');
					message.stop();
				}
			});
		};
		
		
		return Result.chain([
		
			function() {
				return this.addTag('google');
			},
			
			function() {
				return this.addTag('group');
			},
			
			function() {
				return this.addTag('sci.math');
			},
			
			function() {
				return this.addTag('sci.logic');
			},
			
			function() {
				return this.addTag('philosophy');
			},
			
			function() {
				return this.addTag('forum');
			},
			
			function() {
				return this.addTag('misc');
			},
			
			function() {
				return this.addTag('faq');
			},
			
			function() {
				return this.addTag('pdf');
			},
			
			function() {
				return this.addTag('tutorial');
			},
			
			function() {
				return this.addTag('todo');
			},
			
			function() {
				return loop(dspace.data, dspace.live);
			},
			
			function() {
				return loop(dspace.data, dspace.dead);
			},
			
		], dsm);
	}
	
	
	//-------------------------------------------------------------
	
	return importOld;
	
}	//end init
})	// end define