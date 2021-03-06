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
	
	var promise   = libs.promise;
	var Promise   = promise.Promise;
	var Result    = promise.Result;
	var PIterator = promise.PIterator;
	var PWhile    = promise.PWhile;
	
	var isNumber  = btk.isNumber;
	var isObject  = btk.isObject;
	var isArray   = btk.isArray;
	var isDefined = btk.isDefined;
	
	var SYSTEM = 0;


	var Chain = Result.chain;
	
	var forEach = btk.object.forEach;

	
	//-------------------------------------------------------------
	function DSElement(element, id) {
		this.setElement(element);
		
		if (!btk.isNumber(id)) {
			throw new TypeError('DSElement: expected element:Object, id:Integer');
		}
	
		this.id = id;
		
		this.isDirty = false;
	}
	
	(function(p){
	
		p.className = 'DSElement';

		
		p.getId = function() {
			return this.id;
		};
		
		
		p.getElement = function() {
			return this.element;
		};
		
		
		p.setElement = function(element) {
			if (btk.isDefined(this.element)) {
				// the element *must not* be changed once set
				throw new TypeError('DSElement.setElement: already set');
			}
			
			if (!isDefined(element)) {
				element = {};
			}
			
			if (!isObject(element)) {
				throw new TypeError('DSElement.setElement: expected [null | Object]');
			}

			this.element = element;
			
			if (!isDefined(element.created)) {
				element.created = Date.now();
			}
		};


		p.smudge = function() {
			if (!this.isDirty) {
				this.isDirty = true;
				
				this.dsm.smudge();
			}
		};
		
		
		p.clean = function() {
			this.isDirty = false;
		};
		
		
		p.update = function() {
			this.getElement().updated = Date.now();
			this.smudge();
		};
		

		p.getField = function(key) {
			return this.getElement()[key];
		};
		
		
		p.setField = function(key, value) {
			var element = this.getElement();
			
			if (element[key] !== value) {
				if (isDefined(value)) {
					element[key] = value;
				} else {
					delete element[key];
				}
				
				this.update();
				
				return true;
			}
			
			return false;
		};
		
		
		p.getData = function() {
			return this.getField('data');
		}
		
		p.setData = function(data) {
			this.setField('data', data);
		};
		
		
		p.getTags = function() {
			var tags = this.getField('tags');
			if (!tags) {
				tags = [];
				this.setTags(tags);
			}
			
			return tags;
		};
		
		
		p.setTags = function(tags) {
			if (!isArray(tags)) {
				throw new TypeError('DSElement.setTags: expected Array[Integer]');
			};
			
			return this.setField('tags', tags);
		};
		
		
		p.hasTag = function(tagId) {
			var tags = this.getTags();
			
			return tags.indexOf(tagId) !== -1;
		};
		
		
		p.hasTagName = function(tagName) {
			return this.hasTag(this.dsm.tagNameToId(tagName));
		};
		
		
		p.addTag = function(tagId) {
			if (!this.hasTag(tagId)) {
				this.getTags().push(tagId);
				this.update();
				return true;
			}
			
			return false;
		};
		
		
		p.removeTag = function(tagId) {
			var tags = this.getTags();
			var i = tags.indexOf(tagId);
			
			if (i === -1) {
				return false;
			}
			
			tags.splice(i,1);
			this.update();
			return true;
		};
		
		
		// title is an optional field
		p.getTitle = function() {
			return this.getField('title');
		};

		
		p.setTitle = function(title) {
			return this.setField('title', title);
		};
		
		
		// link is an optional field
		p.getLink = function() {
			return this.getField('link');
		};

		
		p.setLink = function(link) {
			return this.setField('link', link);
		};
		
		
	}(DSElement.prototype));
	
	
	//-------------------------------------------------------------
	var QUEUE_LENGTH = 100;
	var DUMMY_ID = -999;	// DSElement.id always >= 0
	
	function DSMCache(dsManager) {
		this.dsm = dsManager;
		
		this.queue = new Array(QUEUE_LENGTH);
		
		var dummy = {
			'id': DUMMY_ID,
			'qcount': 0
		};
		
		for (var i=0; i<QUEUE_LENGTH; i++) {
			this.queue[i] = DUMMY_ID;
		//	dummy.qcount++;
		}
		
		dummy.qcount = QUEUE_LENGTH;
		
		this.qi = 0;
		
		this.hash = {};
		this.hash[dummy.id] = dummy;
	}
	
	(function(p) {
	
		p.className = 'DSMCache';
		
		p.add = function(dselement) {
			dselement.qcount = dselement.qcount || 0;
			
			var q = this.queue;
			var i = this.qi;
			
			var oldId = q[i];
			var newId = dselement.getId();
			q[i] = newId;
			dselement.qcount++;
			i++;
			this.qi = i % QUEUE_LENGTH;
			
			var hash = this.hash;
			var old = hash[oldId];
			old.qcount--;
			if (old.qcount === 0) {
				if (old.isDirty && !dselement.removed) {
					// have to make sure it gets put back into the store
					this.dsm.putElement(old);
				}
				
				delete hash[oldId];
			}
			
			hash[newId] = dselement;
		};
		

		p.get = function(id) {
			var dselement = this.hash[id];
			
			if (dselement && !dselement.removed) {
				return dselement;
			}
		};
		
		
		p.remove = function(id) {
			var dse = this.hash[id];
			if (dse) {
				dse.removed = true;
			}
		};
		
		
		p.getDirty = function() {
			var result = [];
			
			forEach(this.hash, function(dse, id) {
				if (dse.isDirty && !dselement.removed	) {
					result.push(dse);
				}
			});
			
			return result;
		};
		
		
	}(DSMCache.prototype));
	
		
	//-------------------------------------------------------------
	function DSManager(dssManager) {
		if (!(dssManager instanceof DSSManager)) {
			throw new TypeError('DSManager: expected dssManager:DSSManager');
		}
		
		this.source  = dssManager;
		this.isOpen  = false;
		this.isdirty = false;
		
		this.source.onsmudge = this.smudge.bind(this);
		this.source.onclean  = this.clean.bind(this);
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
			if (this.isDirty) { return this; }
			
			this.isDirty = true;
			
			if (this.onsmudge && btk.isFunction(this.onsmudge)) {
				return this.onsmudge();
			}
		};
		
		
		p.newResult = function(value) {
			return new Result(this, value).promise();
		};
		
		p.newErrorResult = function(value, data) {
			return new Result(this, value).error(data);
		};
		

		p.open = function() {
		
			if (this.isOpen) {
				return this.newResult(this);
			}
			
			return this.source.open().chain([
			
				function(result) {
					return this.getElement(SYSTEM);
				},
				
				function(result) {
					this.system = result.value;
					this.tagmapid = this.system.getData().tagmapid;
					
					return this.getElement(this.tagmapid)
				},
				
				function(result) {
					this.tagmap = result.value;
					this.tagmapName = this.tagmap.getData();
					this.tagmapId = {};
					
					forEach( this.tagmapName, function(id, name) {
						this.tagmapId[id] = name;
					}, this );
					
					this.isOpen = true;
					
					return new Result(this, this);
				}
				
			], this );
			
		};
		
		
		p.wrapElement = function(element, id) {
			var dselement = new DSElement(element, id);
			
			dselement.dsm = this;
			
			return dselement;
		};
		
		
		p.newElement = function() {
			var id = this.system.getData().nextid++;
			this.system.update();
			
			var dselement = this.wrapElement({}, id);
			
			return dselement;
		};
		
		
		p.getElement = function(id) {
			return this.source.getElement(id).then(
			
				function(result) {
					result.value = this.wrapElement(
						result.value,
						result.id
					);
					
				}, this
				
			);
		};
		
		
		p.getElements = function(ids) {
			var it = new PIterator();
			
			it.dsm = this;
			it.ids = ids;
			it.length = ids.length;
			
			it.fetch = function() {
				if (this.i < this.length) {
					return this.dsm.getElement(this.ids[this.i]).then(
						function(result) {
							this._value = result.value;
							return new Result(this, this._value);
						}, this
					);
					
				} else {
					this._value = undefined;
					return new Result(this, this._value).promise();
				}
			};
			
			it.init = function() {
				this.i = 0;
				return this.fetch();
			};
			
			it.advance = function() {
				this.i++;
				return this.fetch();
			};

			
			var w = new PWhile(it, btk.identity);
			w.progress = 'element';
			
			return w.start().then({
				'default': function(result) {
					return new Result(this, result.value);
				}
			}, this );
		};
		
		
		p.putElement = function(dselement) {
			if (!(dselement instanceof DSElement)) {
				throw new TypeError('DSManager.putElement: expected dselement:DSElement');
			}
			
			if (!btk.isDefined(dselement.getId())) {
				throw new TypeError('DSManager.putElement: dselement.id is undefined');
			}
			
			return this.source.putElement(
					dselement.getId(), dselement.getElement()
				).then(function(result){
				
					dselement.clean();
					
					result.source = this;
					result.value = dselement;
					
				}, this);
		};
		
		
		p.removeElement = function(dse) {
			console.log('DSManager.removeElement: ' + dse.getId());
			
			if (!(dse instanceof DSElement)) {
				throw new TypeError('DSManager.removeElement: expected dselement:DSElement');
			}
			
			if (!btk.isDefined(dse.getId())) {
				throw new TypeError('DSManager.removeElement: dselement.id is undefined');
			}
			
			var dsm = this;
			
			return Chain([
			
				function() {
					return dsm.removeElementFromTags(
						dse,
						dse.getTags().slice(0)
					);
				},
				
				function() {
					return dsm.source.removeElement(dse.getId());
				},
				
				function(result) {
					result.source = dsm;
					result.value  = dse.getId();
				}
				
			]);
		};
		
		
		p.commit = function() {
			if (!this.isDirty) { return this.newResult(); }
			
			Chain([
				function() {
					if (this.system.isDirty) {			
						return this.putElement(SYSTEM, this.system);
					}
				},
				
				function() {
					if (this.tagmap.isDirty) {
						return this.putElement(this.tagmapid, this.tagmap);
					}
				},
				
				function() {
					return this.source.commit();
				}
				
			], this );
		};
		
		p.close = function() {
			if (!this.isOpen) { return this.newResult(); }

			return Chain([
			
				function() {
					return this.commit();
				},
			
				function() {
					return this.source.close();
				},
				
				function() {
					this.isOpen = false;
					
					return new Result(this);
				},
				
			], this );
		};
		
		
		p.tagNameToId = function(tagName) {
			if (!this.isOpen) {
				throw new Error('DSManager.tagNameToId: dsm is not open');
			}
			
			return this.tagmapName[tagName];
		};
		
		
		p.tagNames = function() {
			if (!this.isOpen) {
				throw new Error('DSManager.tagNames: dsm is not open');
			}
			
			return Object.keys(this.tagmapName);
		};
		
		
		p.tagIds = function() {
			if (!this.isOpen) {
				throw new Error('DSManager.tagIds: dsm is not open');
			}
			
			return Object.keys(this.tagmapId);
		};
		
		
		p.tagIdToName = function(tagId) {
			if (!this.isOpen) {
				throw new Error('DSManager.tagIdToName: dsm is not open');
			}
			
			return this.tagmapId[tagId];
		};
		
		
		p.getTagById = function(tagId) {
			if (!this.isOpen) {
				throw new Error('DSManager.getTagByName: dsm is not open');
			}

			if (!btk.isNumber(tagId)) {
				throw new TypeError('DSManager.getTagById: expected tagId:Number');
			}
			
			return this.getElement(tagId);
		};
		
		
		p.getTagByName = function(tagName) {
			if (!this.isOpen) {
				throw new Error('DSManager.getTagByName: dsm is not open');
			}
			
			if (!btk.isString(tagName)) {
				throw new TypeError('DSManager.getTagByName: expected tagName:String');
			}
			
			var tagId = this.tagNameToId(tagName);
			
			if (!tagId) {
				throw new TypeError('DSManager.getTagByName: no such tag: ' + tagName);
			}
			
			return this.getTagById(tagId);
		};
		
		
		p.addElementToTag = function(dselement, tagName) {
			if (!this.isOpen) {
				throw new Error('DSManager.addElementToTag: dsm is not open');
			}
			
			if (!btk.isString(tagName)) {
				throw new TypeError('DSManager.addElementToTag: expected tagName:String');
			}
			
			if (!(dselement instanceof DSElement)) {
				throw new TypeError('DSManager.addElementToTag: expected dselement:DSElement');
			}
			
			if (!btk.isDefined(dselement.getId())) {
				throw new TypeError('DSManager.addElementToTag: dselement.id is undefined');
			}
			
			return Chain([
				function () {
					return this.dsm.getTagByName(this.tn);
				},
				
				function(result) {
					var tag = result.value;
					
					tag.getData().unshift(this.dse.getId());
					tag.update();
					
					this.dse.addTag(tag.getId());
				},
				
				function(result) {
					// putting the tag
					return this.dsm.putElement(result.value);
				},
				
				function() {
					return this.dsm.putElement(this.dse);
				}
			], { 'dsm':this, 'dse':dselement, 'tn':tagName } );
		};
		

		p.addElementToTags = function(dselement, tagNameArray) {
			if (!this.isOpen) {
				throw new Error('DSManager.addElementToTags: dsm is not open');
			}
			
			if (!btk.isArray(tagNameArray)) {
				throw new TypeError('DSManager.addElementToTags: expected tagNameArray:Array[String]');
			}
			
			if (!(dselement instanceof DSElement)) {
				throw new TypeError('DSManager.addElementToTags: expected dselement:DSElement');
			}
			
			
			return new Result().error('DSManager.addElementToTags: not implemented yet');
		};
		
		
		p.removeElementFromTag = function(dselement, tagName) {
			if (!this.isOpen) {
				throw new Error('DSManager.removeElementFromTag: dsm is not open');
			}
			
			if (!btk.isString(tagName)) {
				throw new TypeError('DSManager.removeElementFromTag: expected tagName:String');
			}
			
			if (!(dselement instanceof DSElement)) {
				throw new TypeError('DSManager.removeElementFromTag: expected dselement:DSElement');
			}
			
			if (!btk.isDefined(dselement.getId())) {
				throw new TypeError('DSManager.removeElementFromTag: dselement.id is undefined');
			}
			
			return Chain([
				function () {
					return this.dsm.getTagByName(this.tn);
				},
				
				function(result) {
					var tag = result.value;
					var elements = tag.getData();
					
					elements.splice(elements.indexOf(this.dse.getId()), 1);
					tag.update();
					
					this.dse.removeTag(tag.getId());
				},
				
				function(result) {
					// putting the tag
					return this.dsm.putElement(result.value);
				},
				
				function() {
					return this.dsm.putElement(this.dse);
				}
			], { 'dsm':this, 'dse':dselement, 'tn':tagName } );
		};
		
		
		p.removeElementFromTags = function(dselement, tagNameArray) {
			console.log('DSManager.removeElementFromTags: ' + dselement.getId());
			
			if (!this.isOpen) {
				throw new Error('DSManager.removeElementFromTags: dsm is not open');
			}
			
			if (!btk.isArray(tagNameArray)) {
				throw new TypeError('DSManager.removeElementFromTags: expected tagNameArray:Array[String]');
			}
			
			if (!(dselement instanceof DSElement)) {
				throw new TypeError('DSManager.removeElementFromTags: expected dselement:DSElement');
			}
			
			
			return new Result(this).error('DSManager.removeElementFromTags: not implemented yet');
		};
		
		
		p.addTag = function(tagName) {
			if (!this.isOpen) {
				throw new Error('DSManager.addTag: dsm is not open');
			}
			
			if (!btk.isString(tagName)) {
				throw new TypeError('DSManager.addTag: expected tagName:String');
			}
			
			var tagId = this.tagNameToId(tagName);
			
			if (tagId) {
				// already exists
				return this.getElement(tagId);
			}
			
			
			var tag = this.newElement();
			tag.setTitle(tagName);
			tag.setData([]);

			function addToTag(tag, tagName) {
				return function(result) {
					this.addElementToTag(tag, tagName);
				};
			}
			
			return this.putElement(tag).chain([
				addToTag(tag, '@@@live'),
				addToTag(tag, '@@tag'),
				
				function(result) {
					result.source = this;
					result.value = tag;
					
					this.tagmapId[tag.getId()] = tag.getTitle();
					this.tagmapName[tag.getTitle()] = tag.getId();
					this.tagmap.update();
				},
			], this	);
		};
		
		
	}(DSManager.prototype));
	
	
	//-------------------------------------------------------------
	
	return DSManager;
	
}	// end init
});	// end define
