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
// the main module
//-----------------------------------------------------------------
btk.define.library.prefix('bookmarks', 'scripts/bookmarks/');

btk.define({
name: 'main@page',
load: true,
libs: {
	base: 'base@common',
	log: 'log@util',
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

	var promise = libs.promise;
	var Promise = promise.Promise;
	var wrap    = promise.wrap;
	
	var DSSMObject = libs.DSSMObject;
	var DSManager  = libs.DSManager;
	
	var de = libs.de;
	
	var widgets = libs.widgets;
	var error = widgets.error;
	
	var CodeMirror = libs.CodeMirror;
	
	var g = btk.global;
	var doc = btk.document;
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
	// the model
	
	namespace('model', page);
	
	page.model.initial = initial;
	page.model.dssm = new DSSMObject(initial);
	page.model.dsm  = new DSManager(page.model.dssm);

	
	//-------------------------------------------------------------
	// the view
	
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
		
	}(page.view));
	
	
	//-------------------------------------------------------------
	// the control
	
	namespace('control.datalist', page);

	(function(dl){
	
		var dsm = page.model.dsm;
		
		function getTagIds(tagNames) {
			var tagIds = [];
			var tagId;
			
			for (var i=0; i<tagNames.length; i++) {
				tagId = dsm.tagNameToId(tagNames[i]);
				if (tagId) {
					tagIds.push(tagId);
				}
			}
			
			return tagIds;
		}
		
		// returns a promise since it has to reference tag elements
		function getElementIds(tagIds) {
			var context = {
				'elements': {},
				'first': true
			};
			
			return dsm.getElements(tagIds).then(
				{
					'element': function(result, message) {
						console.info('from tag ' + result.value.getId());
						
						var dseids = result.value.getData();
						console.info([
							JSON.stringify(dseids),
							'(',
							dseids.length,
							')'
						].join(''));
						
						var other = {};
						
						// make a set
						dseids.forEach(function(id) {
							other[id] = true;
						});
						
						if (this.first) {
							// initial population
							this.elements = other;
							this.first = false;
							
						} else {
							// intersection
							Object.keys(this.elements).forEach(
								function(id) {
									if (!other[id]) {
										delete this.elements[id];
									}
								}, this
							);
						}
						
						// don't want these processed down the chain
						message.stop();
					},
					
					'ok': function(result) {
						result.value = Object.keys(this.elements).map(
							function(id) {
								return parseInt(id);
							}
						);
					}
				}, context
			);
		}
		
		function listToString(list) {
			return [ JSON.stringify(list), '(', list.length, ')' ].join('');
		}
		
		var rid_next = 0;
		var rid_last = -1;
		var lock = wrap(true);
		var refresh_active = false;
		
		dl.dorefresh = function(tagNames,rid, lock) {
			if (rid != rid_last) {
				// there are later refreshes pending
				// let them take care of things
				console.info('dl.refresh skipped ('+rid+')');
				lock.ok(true);
				return;
			}
		/*
			if (refresh_active) {
				// a refresh is already active
				// have to wait
				console.info('dl.refresh deferred ('+rid+')');
				btk.defer({}, dl.dorefresh, [tagNames, rid]);
				return;
			}
		*/
			// this is the only remaining refresh
			console.info('dl.refresh activated ('+rid+')');
		//	refresh_active = true;
			
			var context = {
				'output': page.view.datalist,
				'count': 0,
				'lock': lock
			};
			
			if (tagNames.length === 0) {
				tagNames = ['@@@live'];
			}
			
			console.info('control.datalist.refresh: ' + listToString(tagNames));
			
			var tagIds = getTagIds(tagNames);
			console.info('control.datalist.refresh: ' + listToString(tagIds));
			
			getElementIds(tagIds).chain([
			
				function(result) {
					console.info('all element ids')
					console.info(listToString(result.value));
					
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
						this.lock.ok(true);
					}
				}
				
			], context );
		};

		dl.refresh = function(tagNames) {
			rid_last = rid_next;
			rid_next++;

			var context = {
				'tagNames': tagNames,
				'rid': rid_last,
				'lock': new Promise()
			};
			
			lock.then(function() {
				dl.dorefresh(this.tagNames, this.rid, this.lock);
			}, context);
			
			lock = context.lock;
		};
		
	}(page.control.datalist));

	
	namespace('control.filter', page);
	
	(function(f) {
	
		var dl = page.control.datalist;
		
		var tags = {};
		
		f.tags = tags;
		
		var filter = page.view.filter;
		
		f.refreshValue = function() {
			filter.value = Object.keys(tags).sort().join(' ');
		}
		
		f.add = function(tagName) {
			if (!tags[tagName]) {
				tags[tagName] = true;
				
				f.refreshValue();
				
				dl.refresh(Object.keys(tags));
			}
		};
		
		f.remove = function(tagName) {
			if (tags[tagName]) {
				delete tags[tagName];
				
				f.refreshValue();
				
				dl.refresh(Object.keys(tags));
			}
		};
		
		f.clear = function() {
			error('control.filter.clear not implemented yet');
		};
		
		// called when filter input field changes
		f.refresh = function() {
			tags = {};
			var value = filter.value;
			var tagNames = value.split(' ').filter(function(t){ return t !== '';});
			
			for (var i=0; i<tagNames.length; i++) {
				tags[tagNames[i]] = true;
			}
			
			f.refreshValue();
			
			dl.refresh(Object.keys(tags));
		};
		
	}(page.control.filter));
	

	namespace('control.taglist', page);
	
	(function(tl){
	
		var dsm = page.model.dsm;
		
		tl.refresh = function() {
			if (!dsm.isOpen) { return; }
			
			var output = page.view.taglist;
			var tagnames = Object.keys(dsm.tagmapName);

			output.innerHTML = '';
			
			tagnames.sort();
			tagnames.forEach(function(name){
				var entry = de('wdstview', name);
				
				output.appendChild(entry.create());
			});
		};
		
	}(page.control.taglist));
	
	
	page.control.init = function() {
		page.model.dsm.open().chain([
			page.control.taglist.refresh,
			page.control.filter.add.bind({},'@@@live')
		]);
	};
	
	
	page.control.init();
	
	
	//-------------------------------------------------------------
	// TEST STUFF
	
	if (page.test) {
		g.x = (function(){
			var x = {};
			x.de  = de;
			x.kpr = btk.require('promise@btk');
			x.P   = x.kpr.Promise;
			x.R   = x.kpr.Result;
			x.DSM = DSManager;
			
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
			
			x.build = function() {
				var context =  {
					'dsm': page.model.dsm,
					'output': page.view.datalist
				};
				
				context.dsm.open().chain([
				
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
						page.control.datalist.refresh([]);
					},
					/*
					function(result) {
						return this.dsm.getTagByName('@@@live');
					},
					
					function(result) {
						this.live = result.value.getData();
						
						return this.dsm.getTagByName('@@@dead');
					},
					
					function(result) {
						this.dead = result.value.getData();
						
						var ids = this.live.concat(this.dead);
						
						return this.dsm.getElements(ids);
					},
					
					{	
						'ok': function(result) {
							// all elements retrieved
						},
						
						'element': function(result) {
							var dseview = de('wdseview', result.value);
							
							this.output.appendChild(dseview.create());
						},
						
						'default': function(result, message) {
							console.info('unrecognised message');
							console.log(message);
						}
					}
					*/
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
