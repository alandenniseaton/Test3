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

	var DSSMObject = libs.DSSMObject;
	var DSManager  = libs.DSManager;
	
	var de = libs.de;
	
	var widgets = libs.widgets;
	
	var CodeMirror = libs.CodeMirror;
	
	var error = widgets.error;
	
	
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

	var dssm = new DSSMObject(initial);
	var dsm = new DSManager(dssm);


	//-------------------------------------------------------------
	
	page.dspace = {};
	
	page.dspace.dssm = dssm;
	page.dspace.dsm = dsm;

	
	var doc = btk.document;
	
	var getElement = function(id) {
		return doc.getElementById(id);
	};
	
	page.getElement = getElement;
	
	
	//-------------------------------------------------------------
	// actions (for button clicks etc)
	
	var action = widgets.action;
	page.action = action;
	
	
	//-------------------------------------------------------------
	// build interface
	
	page.element = {};
	
	(function(pel){
	
		pel.body = doc.getElementsByTagName('body')[0];
		
		pel.page = de('wdsmview')
			.taglist().id('taglist').end()
			.datalist().id('datalist').end()
			.create()
		;
		
		pel.body.appendChild(pel.page);
		pel.taglist = getElement('taglist');
		pel.datalist = getElement('datalist');
		
	}(page.element));
	
	
	//-------------------------------------------------------------
	// populate interface
	
	var DSEView = widgets.DSEView;
	var DSView  = widgets.DSView;
	
	
	page.dspace.view = new DSView(page.dsm);

	
	//-------------------------------------------------------------
	// TEST STUFF
	
	if (page.test) {
		page.dspace.initial = initial;

		btk.global.x = (function(){
			var x = {};
			x.de  = de;
			x.kpr = btk.require('promise@btk');
			x.P   = x.kpr.Promise;
			x.R   = x.kpr.Result;
			x.DSM = DSManager;
			
			x.dssm = page.dspace.dssm;
			x.dsm  = page.dspace.dsm;
			
			x.build = function() {
				var context =  {
					'dsm': page.dspace.dsm,
					'output': page.element.datalist
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
						return this.dsm.addElementToTag(this.dse, '@@@live');
					},
					
					function(result) {
						return this.dsm.putElement(this.dse);
					},
					
					function(result) {
						var output = page.element.taglist;
						var tagnames = Object.keys(this.dsm.tagmapName);

						tagnames.sort();
						tagnames.forEach(function(name){
							var entry = de('wdstview', name);
							
							output.appendChild(entry.create());
						});
					},
					
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
					
					{	'ok': function(result) {
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
