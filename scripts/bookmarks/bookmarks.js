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
	initial: 'initial@bookmarks',
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
	
	// the initial state of the data space
	var initial = libs.initial;
	
	var g         = btk.global;
	var doc       = btk.document;
	var namespace = btk.namespace;
	
	g.page = btk.ifDefined(g.page, {});
	
	page.error = error;

	page.log = log;

	
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
			'showtags': getWidget('showtags'),
			'hidetags': getWidget('hidetags'),
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

	exports.done = true;
	
}	// end init
});	// end define
