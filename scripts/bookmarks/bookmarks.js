'use strict';

//-----------------------------------------------------------------
btk.define({
	name: 'htmlmixed@CodeMirror@mode/htmlmixed/',
	libs: { CodeMirror: 'codemirror@CodeMirror' },
	wait: true
});

btk.define({
	name: 'javascript@CodeMirror@mode/javascript/',
	libs: { CodeMirror: 'codemirror@CodeMirror' },
	wait: true
});


btk.define({
	name: 'codemirror@util',
	libs: {
		htmlmixed: 'htmlmixed@CodeMirror',
		javascript: 'javascript@CodeMirror'
	},
	css: [ 'elegant@CodeMirror@theme/' ],
	init: function(libs) { return CodeMirror; }
});


//-----------------------------------------------------------------
// an implementation of sets
//-----------------------------------------------------------------
btk.define({
name: 'set@util',
init: function() {

	var forEach = btk.object.forEach;
	
	
	function Set() {
		this._element = {};
		this._size = 0;
	};
	
	(function(p){
	
		p.className = 'Set';

		p.isEmpty = function() {
			return this._size === 0;
		};
		
		p.size = function() {
			return this._size;
		};
		
		p.elements = function() {
			return Object.keys(this._element);
		};
		
		p.toArray = p.elements;
		
		p.has = function(x) {
			return this._element[x];
		};
		
		p.add = function(x) {
			if (!this.has(x)) {
				this._element[x] = true;
				this._size++;
			}
			
			return this;
		};

		p.addArray = function(a) {
			if (!btk.isArray(a)) {
				throw new TypeError('Set.addArray: expected a:Array');
			}
			
			for (var i=0, l=a.length; i<l; i++) {
				this.add(a[i]);
			}
			
			return this;
		};
		
		p.remove = function(x) {
			if (this.has(x)) {
				delete this._element[x];
				this._size--;
			}
			
			return this;
		};
		
		p.apply = function(f, context) {
			forEach(this._element, function(bool, element) {
				f.call(this, element);
			}, context );
			
			return this;
		};
		
		p.map = function(f, context) {
			var result = new Set();
			
			this.apply(function(element) {
				result.add(f.call(this, element));
			}, context );
			
			return result;
		};
		
		p.clone = function() {
			var result = new Set();
			
			this.apply(function(element) {
				result.add(element);
			}, result);
			
			return result;
		};
		
		p.merge = function(other) {
			if (!(other instanceof Set)) {
				throw new TypeError('Set.merge: expected other:Set');
			}
			
			other.apply(function(element){ this.add(element); }, this);
			
			return this;
		};
		
		p.union = function(other) {
			return this.clone().merge(other);
		};

		p.diff = function(other) {
			if (!(other instanceof Set)) {
				throw new TypeError('Set.diff: expected other:Set');
			}
			
			var result = new Set();
			
			this.apply(function(element) {
				if (!other.has(element)) {
					result.add(element);
				}
			}, result);
			
			return result;
		};
		
		p.sdiff = function(other) {
			return this.diff(other).union(other.diff(this));
		};
		
		p.intersect = function(other) {
			if (!(other instanceof Set)) {
				throw new TypeError('Set.intersect: expected other:Set');
			}
			
			var result = new Set();
			
			this.apply(function(element) {
				if (other.has(element)) {
					result.add(element);
				}
			});
			
			return result;
		};
		
	}(Set.prototype));
	
	
	return Set;
	
}	// end init
});	// end define

	
//-----------------------------------------------------------------
// the main module
//-----------------------------------------------------------------
btk.define.library.prefix('bookmarks', 'scripts/bookmarks/');

btk.define({
name: 'main@page',
load: true,
libs: {
	base: 'base@common',
	log: 'log@util',
	Set: 'set@util',
	promise: 'promise@btk',
	de : 'element@wtk',
	menu: 'menu@wtk',
	page: 'page@wtk',
	DSSMObject: 'dssmObject@util',
	DSManager: 'dsManager@util',
	widgets: 'widgets@bookmarks',
	CodeMirror: 'codemirror@util'
},
css : [ 'base@wtk', 'scroll-plain@wtk' ],
when: [ 'state::page.loaded' ],
init: function(libs, exports) {

	var log = libs.log;
	var Set = libs.Set;

	var promise = libs.promise;
	var Promise = promise.Promise;
	var wrap    = promise.wrap;
	
	var DSSMObject = libs.DSSMObject;
	var DSManager  = libs.DSManager;
	
	var de = libs.de;
	
	var widgets = libs.widgets;
	var error = widgets.error;
	
	var CodeMirror = libs.CodeMirror;
	
	var g         = btk.global;
	var doc       = btk.document;
	var namespace = btk.namespace;
	
	g.page = btk.ifDefined(g.page, {});
	
	page.error = error;

	page.log = log;

	
	//-------------------------------------------------------------
	// the initial state of the data space.
	// this should probably be in an external file.
	//
	var initial = {
		//system elements
		"0": {
			"title": "system",
			"created": Date.now(),
			"updated": Date.now(),
			"data": {
				// data space parameters
				"name": "Bookmarks",
				"tagmapid": 1,
				"nextid": 100,
			},
			"tags": [10,20,22,30,31,32]
		},
		
		"1": {
			"title": "Tag Map",
			"created": Date.now(),
			"updated": Date.now(),
			"data": {
				"@@@live": 10,
				"@@@dead": 11,
				
				"@@system": 20,
				"@@tag": 21,
				"@json": 22,
				"@html": 23,
				"@code": 24,
				
				"@noview": 30,
				"@noedit": 31,
				"@nodelete": 32,
			},
			"tags": [10,20,22,30,31,32]
		},
		
		// system tags
		"10": {
			"title": "@@@live",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"11": {
			"title": "@@@dead",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [],
			"tags": [10,20,21,30,31,32]
		},
		
		"20": {
			"title": "@@system",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"21": {
			"title": "@@tag",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"22": {
			"title": "@json",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"23": {
			"title": "@html",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [],
			"tags": [10,20,21,30,31,32]
		},
		
		"24": {
			"title": "@code",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [],
			"tags": [10,20,21,30,31,32]
		},
		
		"30": {
			"title": "@noview",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"31": {
			"title": "@noedit",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"32": {
			"title": "@nodelete",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		}
	};

	
	//-------------------------------------------------------------
	// model
	//-------------------------------------------------------------
	
	namespace('model', page);
	
	page.model.initial = initial;
	page.model.dssm = new DSSMObject(initial);
	page.model.dsm  = new DSManager(page.model.dssm);

	
	//-------------------------------------------------------------
	// view
	//-------------------------------------------------------------
	
	namespace('view', page);
	
	(function(pv){
	
		pv.body = doc.getElementsByTagName('body')[0];
		
		pv.root = de('wdsmview')
			.taglist().att('data-widgetid','taglist').end()
			.datalist().att('data-widgetid','datalist').end()
			.create()
		;
		
		pv.body.appendChild(pv.root);

		
		var getWidget = function(id) {
			return pv.root.querySelector('[data-widgetid="' + id + '"]');
		};
		pv.getWidget = getWidget;
		
		
		pv.filter = getWidget('filter-input');
		pv.button = {
			'saveall': getWidget('saveall'),
			'newbookmark': getWidget('newbookmark'),
			'showdead': getWidget('showdead'),
			'showlive': getWidget('showlive'),
			'transfer': getWidget('transfer'),
		};
		
		pv.taglist = getWidget('taglist');
		pv.datalist = getWidget('datalist');
		
		pv.getDSElement = function(id) {
			return pv.datalist.querySelector('[data-dseid="' + id + '"]');
		};
		
		pv.getDSTag = function(id) {
			return pv.taglist.querySelector('[data-dseid="' + id + '"]');
		};
		
	}(page.view));
	
	
	//-------------------------------------------------------------
	// control
	//-------------------------------------------------------------
	
	// builtin parseInt() is not useable in Array.map()
	function myParseInt(x) {
		return parseInt(x);
	}
	
	namespace('control.datalist', page);

	namespace('control.taglist', page);
	
	namespace('control.filter', page);
	
	(function(dl){
	
		var dsm = page.model.dsm;
		
		function listToString(list) {
			return [ JSON.stringify(list), ' (', list.length, ')' ].join('');
		}
		
		// stuff for synchronising
		// change to use btk.Sequence
		var refreshId = new btk.Sequence();
		dl.Lock = promise.LockClass('datalist');

		
		// returns a promise since it has to reference tag elements
		function getElementIds(tagIds) {
			var context = {
				'elements': new Set(),
				'first': true
			};
			
			// dsm.getElements requires an array of Integers
			// Set.toArray() always returns an array of Strings
			var ids = tagIds.toArray().map(myParseInt);
			console.info('tags: ' + listToString(ids));
			
			return dsm.getElements(ids).then({
			
				'element': function(result, message) {
					
					var dseids = result.value.getData();
					
					var other = new Set().addArray(dseids);
					console.info([
						'tag(',
						result.value.getId(),
						') ',
						listToString(other.toArray().map(myParseInt))
					].join(''));
					
					if (this.first) {
						// initial population
						this.elements.merge(other);
						this.first = false;
						
					} else {
						this.elements = this.elements.intersect(other);
					}
					
					// don't want these processed down the chain
					message.handled();
				},
				
				'ok': function(result) {
					this.elements = this.elements || new Set();
					result.value = this.elements.toArray().map(myParseInt);
					
					console.info('intersection ' + listToString(result.value));
				},
				
				'default': function(result, message) {
					console.info('unrecognised message');
					console.log(message);
				}
				
			}, context );
		}
		
		dl.dorefresh = function(tagIds, rid, lock) {
			if (rid != refreshId.current()) {
				// there are later refreshes pending
				// let them take care of things
				console.info('dl.dorefresh: (' + rid + ') skipped');
				lock.open();
				return;
			}
			
			// this is the most recent refresh
			console.info('dl.dorefresh: (' + rid + ') activated');
			
			var context = {
				'output': page.view.datalist,
				'count': 0,
				'lock': lock
			};
			
			if (tagIds.isEmpty()) {
				tagIds.add(dsm.tagNameToId('@@@live'));
			}
			
			console.info('dl.dorefresh: ' + listToString(tagIds.elements()));
			
			getElementIds(tagIds).chain([
			
				function(result) {
					this.output.innerHTML = '';
					return dsm.getElements(result.value);
				},
				
				{
					'element': function(result) {
						var dseview = de('wdseview', result.value);
						
						this.output.appendChild(dseview.create());
						
						this.count++;
					},
					
					'ok': function(result) {
						console.info(this.count + ' elements displayed');
					//	refresh_active = false;
						this.lock.open();
					}
				}
				
			], context );
		};

		dl.refresh = function(tagIds) {
			var context = {
				'tagIds': tagIds,
				'rid': refreshId.next(),
				'lock': new dl.Lock()
			};
			
			// wait for the old lock to open before initiating
			// this refresh
			context.lock.old.then(function() {
				dl.dorefresh(this.tagIds, this.rid, this.lock);
			}, context);
		};
		
	}(page.control.datalist));

	
	(function(f) {
	
		var tl = page.control.taglist;
		
		var tags = new Set();
		
		f.tags = tags;
		
		var filter = page.view.filter;
		
		f.refreshValue = function() {
			filter.value = tags.elements().sort().join(' ');
		}
		
		f.add = function(tagName) {
			tags.add(tagName);
			f.refreshValue();
		};
		
		f.remove = function(tagName) {
			tags.remove(tagName);
			f.refreshValue();
		};
		
		f.clear = function() {
			error('control.filter.clear not implemented yet');
		};
		
		// called when filter input field changes
		f.refresh = function() {
			var newtags = new Set();
			var value = filter.value;
			var tagNames = value.split(' ').filter(function(t){ return t !== '';});
			
			newtags.addArray(tagNames);
			
			tl.selectSet(newtags.diff(tags));
			tl.deselectSet(tags.diff(newtags));
			
			tags = newtags;
			
			f.refreshValue();
		};
		
	}(page.control.filter));
	

	(function(tl){
	
		var dsm = page.model.dsm;
		var f   = page.control.filter;
		var dl  = page.control.datalist;
		
		var selected = new Set();
		
		tl.setState = function(id, select) {
			if (!btk.isDefined(id)) { return; }
			
			if (!!selected.has(id) === !!select) { return; }
			
			var node = page.view.getDSTag(id);
			if (node) {
				if (select) {
					node.classList.add('selected');
					selected.add(id);
					f.add(dsm.tagIdToName(id));
					
				} else {
					node.classList.remove('selected');
					selected.remove(id);
					f.remove(dsm.tagIdToName(id));
					
					// making sure selected is never empty
					if (selected.isEmpty()) {
						// has to be defered to avoid confusion
						btk.defer({}, tl.select, ['@@@live']);
					}
				}
				
				dl.refresh(selected);
			}
		};
		
		function toid(x, showError) {
			if (btk.isString(x)) {
				var id = dsm.tagNameToId(x);
				if (!id && showError) {
					error('undefined tag: ' + String(x));
				}
				return id;
			}
			
			return x;
		}
		
		tl.select = function(id) {
			id = toid(id, true);
			tl.setState(id, true);
		};
		
		tl.selectSet = function(s) {
			s.apply(function(e){ tl.select(e); });
		};
		
		tl.deselect = function(id) {
			id = toid(id, false);
			tl.setState(id, false);
		};
		
		tl.deselectSet = function(s) {
			s.apply(function(e){ tl.deselect(e); });
		};
		
		tl.toggle = function(id) {
			id = toid(id, true);
			tl.setState(id, !selected.has(id));
		};
		
		tl.refresh = function() {
			var output = page.view.taglist;
			var tagnames = dsm.tagNames();

			output.innerHTML = '';
			
			tagnames.sort();
			tagnames.forEach(function(name){
				var id = dsm.tagNameToId(name)
				var entry = de('wdstview', name, id);
				
				if (selected.has(id)) {
					entry.klass('selected');
				}
				
				output.appendChild(entry.create());
			});
		};
		
	}(page.control.taglist));
	
	
	page.control.init = function() {
		page.model.dsm.open().chain([
		
			function(result) {
				page.control.taglist.refresh();
			},
			
			function(result) {
				page.control.taglist.select('@@@live');
			}
			
		]);
	};
	
	
	page.control.init();
	
	
	//-------------------------------------------------------------
	// TEST STUFF
	//-------------------------------------------------------------
	
	if (page.test) {
		g.x = (function(){
			var x = {};
			x.de  = de;
			x.kpr = btk.require('promise@btk');
			x.P   = x.kpr.Promise;
			x.R   = x.kpr.Result;
			x.DSM = DSManager;
			x.Set = Set;
			
			x.dssm = page.model.dssm;
			x.dsm  = page.model.dsm;

			x.f = function() {
				function g() {
					var a = {
						'this': this,
						'args': arguments
					};
					console.log(a);
				}
				
				g.apply({'g':'this object'}, arguments);
			};
			
			x.dl = page.control.datalist;
			
			x.build = function() {
				var context =  {
					'dsm': page.model.dsm,
					'output': page.view.datalist,
					'lock': new x.dl.Lock()
				};
				
				context.lock.old.chain([
				
					function(result) {
						return this.dsm.open();
					},
				
					function(result) {
						return this.dsm.addTag('my.tag');
					},
					
					function(result) {
						return this.dsm.addTag('my.other.tag');
					},
					
					function(result) {
						return this.dsm.addTag('@@@zombie');
					},
					
					page.control.taglist.refresh,
					
					function(result) {
						var dse = this.dsm.newElement();
						
						dse.setTitle('a test');
						dse.setField('f1', 'v1');
						dse.setField('f2', 'v2');
						dse.setField('f3', 'v3');
						dse.setField('f4', 'v4');
						
						dse.setLink([
							'the/first/link.html',
							'the/second/link.html'
						]);
						
						dse.setData([
							'Hello there <u>world</u>. ',
							'How <big><b>are</b></big> you today? ',
							'I am <span style="color:green">fine</span> thankyou. ',
							'Thats good then. ',
							'<br>',
							'This should be on another line. '
						]);
						
						this.dse = dse;
						
						return this.dsm.addElementToTag(this.dse, 'my.tag');
					},
						
					function(result) {
						return this.dsm.addElementToTag(this.dse, 'my.other.tag');
					},
					
					function(result) {
						return this.dsm.addElementToTag(this.dse, '@html');
					},
					
					function(result) {
						return this.dsm.addElementToTag(this.dse, '@@@dead');
					},
					
					function(result) {
						return this.dsm.putElement(this.dse);
					},
					
					function(result) {
						page.control.datalist.refresh(new Set());
					},
					
					function(result) {
						this.lock.open();
					}
					
				], context );
			};
			
			x.build();
			
			function onok(result) {
				console.info('OK');
				console.log(result);
			};
			
			function oninfo(result) {
				console.info('INFO');
				console.log(result);
			};
			
			function onelement(result) {
				console.info('ELEMENT');
				console.log(result);
			};
			
			function onerror(result) {
				console.error('ERROR');
				console.log(result);
			};
			
			function oncancel(result) {
				console.warn('CANCEL');
				console.log(result);
			};
			
			function ondefault(result, message) {
				console.info('DEFAULT: ' + message.type);
				console.log(result);
			};
			
			x.actions = {
				'ok'     : onok,
				'info'   : oninfo,
				'element': onelement,
				'cancel' : oncancel,
				'error'  : onerror,
				'default': ondefault
			};
			
			return x;
		}());
	}
	
	
}	// end init
});	// end define
