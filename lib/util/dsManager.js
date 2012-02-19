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
	
	var SYSTEM = 0;

	
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
			
			if (!btk.isDefined(element)) {
				element = {};
			}
			
			if (!btk.isObject(element)) {
				throw new TypeError('DSElement.setElement: expected [null | Object]');
			}

			this.element = element;
			
			if (!element.created) {
				element.created = Date.now();
			}
		};


		p.smudge = function() {
			if (!this.isDirty) {
				this.isDirty = true;
				
				if (btk.isDefined(this.id)) {
					this.dsm.smudge();
				}
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
				element[key] = value;
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
			if (!btk.isArray(tags)) {
				throw new TypeError('DSElement.setTags: expected Array[Integer]');
			};
			
			return this.setField('tags', tags);
		};
		
		
		p.hasTag = function(tagId) {
			var tags = this.getTags();
			
			return tags.indexOf(tagId) !== -1;
		};
		
		
		p.hasTagName = function(tagName) {
			var tags = this.getTags();
			var tagId = this.dsm.tagmapName[tagName];
			
			return tags.indexOf(tagId) !== -1;
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
			'id': DUMMY_ID
		};
		
		for (var i=0; i<QUEUE_LENGTH; i++) {
			this.queue[i] = DUMMY_ID;
		}
		
		dummy.qcount = QUEUE_LENGTH;
		
		this.qi = 0;
		
		this.hash = {};
		this.hash[DUMMY_ID] = dummy;
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
		
		this.cache = new DSMCache(this);
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
		

		var setResultSource = {
			'default': function(result) {
				result.source = this;
			}
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
					
					result.value = this;
				},
				
				setResultSource
				
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
			this.cache.add(dselement);
			
			return dselement;
		};
		
		
		p.getElement = function(id) {
			var dselement = this.cache.get(id);
			
			if (dselement) {
				var result = new Result(this, dselement);
				
				result.id = id;
				
				// *every* get causes a cache add
				// in this case only the queue count is incremented
				this.cache.add(dselement);
				
				return result.promise();
			}
			
			return this.source.getElement(id).chain([
			
				function(result) {
					result.value = this.wrapElement(
						result.value,
						result.id
					);
					
					this.cache.add(result.value);
				},

				setResultSource
				
			], this );
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
						}, this
					);
					
				} else {
					this._value = undefined;
					return new Result(this._value).promise();
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
			
			return w.start();
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
		
		
		p.removeElement = function(id) {
			this.cache.remove(id);
			
			return this.source.removeElement(id).then(setResultSource, this);
		};

		
		p.flushCache = function() {
			var dirty = this.cache.getDirty();
			
			// not implemented yet
			// similar implementation to getElements()
			console.warn('DSManager.flushCache: not implemented yet');
			return this.newResult();
		};
		
		p.commit = function() {
			if (!this.isDirty) { return this.newResult(); }
			
			// remember that dirty cache elements need to be put back into the store
			
			return this.flushCache().chain([
			
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
				},
				
				setResultSource
				
			], this );
		};
		
		
		p.close = function() {
			if (!this.isOpen) { return this.newResult(); }

			return Result.chain([
			
				function() {
					return this.commit();
				},
			
				function() {
					return this.source.close();
				},
				
				function() {
					this.isOpen = false;
				},
				
				setResultSource
				
			], this );
		};
		
		
		p.tagNameToId = function(tagName) {
			if (!this.isOpen) {
				throw new Error('DSManager.tagNameToId: dsm is not open');
			}
			
			return this.tagmapName[tagName];
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
			
			return this.getTagByName(tagName).then(
				function(result) {
					var tag = result.value;
					
					tag.getData().unshift(dselement.getId());
					tag.update();
					
					dselement.addTag(tag.getId());
					
					// let the cache handle put
					// return this.putElement(tag);
				},
				this
			);
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
			
			return this.getTagByName(tagName).then(
				function(result) {
					var tag = result.value;
					var elements = tag.getData();
					
					elements.splice(elements.indexOf(dselement.getId()), 1);
					tag.update();
					
					dselement.removeTag(tag.getId());
					
					// let the cache handle put
					// return this.putElement(tag);
				},
				this
			);
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
