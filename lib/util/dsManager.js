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

	var SYSTEM = 0;

	
	var forEach = btk.object.forEach;

	
	//-------------------------------------------------------------
	function DSElement(id, element) {
		this.setId(id);
		this.setElement(element);
	}
	
	(function(p){
	
		p.className = 'DSElement';
		
		p.getId = function() {
			return this._id;
		};
		
		
		p.setId = function(id) {
			if (btk.isDefined(id) && !btk.isNumber(id)) {
				throw new TypeError('DSElement.setId: expected Undefined|Integer');
			}
		
			this._id = id;
		};
		
		
		p.getElement = function() {
			return this._element;
		};
		
		
		p.setElement = function(element) {
			if (!btk.isDefined(element)) {
				element = {};
			}
			
			if (!btk.isObject(element)) {
				throw new TypeError('DSElement.setElement: expected [null | Object]');
			}

			this._element = element;
			
			if (!element.created) {
				element.created = Date.now();
			}
		};


		p.update = function() {
			this.getElement().updated = Date.now();
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
		
		
	}(DSElement.prototype));
	
	
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
	
	DSManager.DSElement = DSElement;
	
	
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
			return new Result(this, value, params).promise();
		};
		
		p.newErrorResult = function(value, params) {
			return new Result(this, value, params).error();
		};
		

		var setResultSource = {
			'default': function(result) {
				result.source = this;
			}
		};
		
		
		p.open = function() {
		
			return this.source.open().chain([
			
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
					this.tagmapName = this.tagmap.data;
					this.tagmapId = {};
					
					forEach(
						this.tagmapName,
						function(id, name) {
							this.tagmapId[id] = name;
						},
						this
					);
					
					this.isOpen = true;
				},
				
				setResultSource
				
			], this );
			
		};
		
		
		p.getElement = function(id) {
			return this.source.getElement(id).chain([
				function(result) {
					result.value = new DSElement(
						result.id,
						result.value
					);
				},
				
				setResultSource
			], this);
		};
		
		
		p.getElements = function(ids) {
			return this.source.getElements(ids).chain([
			
				{ 'element': function(result) {
					result.value = new DSElement(
						result.id,
						result.value
					);
				}},
				
				setResultSource
				
			], this);
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
					result.source = this;
					result.value = dselement;
				}, this);
		};
		
		
		p.addElement = function(dselement) {
			if (!(dselement instanceof DSElement)) {
				throw new TypeError('DSManager.addElement: expected dselement:DSElement');
			}
			
			if (btk.isDefined(dselement.getId())) {
				throw new TypeError('DSManager.addElement: dselement.id is defined');
			}
			
			dselement.setId(this.system.data.nextid++);
			
			return this.putElement(dselement);
		};
		
		
		p.removeElement = function(id) {
			return this.source.removeElement(id).then(setResultSource, this);
		};

		
		p.commit = function() {
			if (!this.isDirty) { return this.newResult(); }
			
			return Result.chain([
			
				function() {
					return this.putElement(SYSTEM, this.system);
				},
				
				function() {
					return this.putElement(this.tagmapid, this.tagmap);
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
		
		
		p.getTagId = function(tagName) {
			if (!this.isOpen) {
				throw new Error('DSManager.getTagId: dsm is not open');
			}
			
			return this.tagmapName[tagName];
		};
		
		
		p.getTagName = function(tagId) {
			if (!this.isOpen) {
				throw new Error('DSManager.getTagName: dsm is not open');
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
			
			var tagId = this.getTagId(tagName);
			
			if (!tagId) {
				throw new TypeError('DSManager.getTagByName: no such tag: ' + tagName);
			}
			
			return this.getTagById(tagId);
		};
		
		
		p.addToTag = function(tagName, dselement) {
			if (!this.isOpen) {
				throw new Error('DSManager.addToTag: dsm is not open');
			}
			
			if (!btk.isString(tagName)) {
				throw new TypeError('DSManager.addToTag: expected tagName:String');
			}
			
			if (!(dselement instanceof DSElement)) {
				throw new TypeError('DSManager.addToTag: expected dselement:DSElement');
			}
			
			if (!btk.isDefined(dselement.getId())) {
				throw new TypeError('DSManager.addToTag: dselement.id is undefined');
			}
			
			return this.getTagByName(tagName).then(
				function(result) {
					var tag = result.value;
					tag.getData().unshift(dselement.getId());
					return this.putElement(tag);
				},
				this
			);
		};
		

		p.removeFromTag = function(tagName, dselement) {
		};
		
		
		p.addTag = function(tagName) {
			if (!this.isOpen) {
				throw new Error('DSManager.addTag: dsm is not open');
			}
			
			if (!btk.isString(tagName)) {
				throw new TypeError('DSManager.addTag: expected tagName:String');
			}
			
			var tagId = this.getTagId(tagName);
			
			if (tagId) {
				// already exists
				return this.getElement(tagId);
			}
			
			var tag = new DSElement();
			tag.setTitle(tagName);
			tag.setData([]);
			tag.addTag(this.getTagId('@live'));
			tag.addTag(this.getTagId('@system'));
			tag.addTag(this.getTagId('@tag'));
			tag.addTag(this.getTagId('@json'));
			tag.addTag(this.getTagId('@noview'));
			tag.addTag(this.getTagId('@noedit'));
			tag.addTag(this.getTagId('@nodelete'));
			
			return this.addElement(tag).chain([
				function(result) {
					result.source = this;
					result.value = tag;
					
					this.tagmapId[tag.getId()] = tag.getTitle();
					this.tagmapName[tag.getTitle()] = tag.getId();
				},
			], this	);
		};
		
		
	}(DSManager.prototype));
	
	
	//-------------------------------------------------------------
	
	return DSManager;
	
}	// end init
});	// end define
