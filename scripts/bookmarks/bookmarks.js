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
	de : 'element@wtk',
	menu: 'menu@wtk',
	Timer: 'timer@btk',
	DSSMObject: 'dssmObject@util',
	DSManager: 'dsManager@util',
	CodeMirror: 'codemirror@util'
},
css : [ 'base@wtk', 'scroll-plain@wtk' ],
when: [ 'state::page.loaded' ],
init: function(libs, exports) {

	var log = libs.log;

	var DSSMObject = libs.DSSMObject;
	var DSManager  = libs.DSManager;
	
	var de = libs.de;
	
	var Timer = libs.Timer;
	var CodeMirror = libs.CodeMirror;
	
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
			"tags": [10,20,21,30,31,32]
		},
		
		"1": {
			"title": "Tag Map",
			"created": Date.now(),
			"updated": Date.now(),
			"data": {
				"@live": 10,
				"@dead": 11,
				
				"@system": 20,
				"@json": 21,
				"@tag": 22,
				
				"@noview": 30,
				"@noedit": 31,
				"@nodelete": 32,
			},
			"tags": [10,20,21,30,31,32]
		},
		
		// system tags
		"10": {
			"title": "@live",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,30,31,32],
			"tags": [10,20,21,22,30,31,32]
		},
		
		"11": {
			"title": "@dead",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [],
			"tags": [10,20,21,22,30,31,32]
		},
		
		"20": {
			"title": "@system",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"21": {
			"title": "@json",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"22": {
			"title": "@tag",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [10,11,20,21,22,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"30": {
			"title": "@noview",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"31": {
			"title": "@noedit",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"32": {
			"title": "@nodelete",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,30,31,32],
			"tags": [10,20,21,30,31,32]
		}
	};

	var dssm = new DSSMObject(initial);
	var dsm = new DSManager(dssm);


	//-------------------------------------------------------------
	
	page.dspace = {};
	
	page.dspace.initial = initial;
	page.dspace.dssm = dssm;
	page.dspace.dsm = dsm;
	
	if (page.test) {
		btk.global.x = (function(){
			var x = {};
			x.pr = btk.require('promise@btk');
			x.p  = x.pr.Promise;
			x.r  = x.pr.Result;
			
			x.dssm = page.dspace.dssm;
			x.dsm  = page.dspace.dsm;
			
			x.log = function(result) {
				console.log(result);
			};
			
			x.error = function(result) {
				console.error('something went wrong');
			};
			
			return x;
		}());
	}
	
	
}	// end init
});	// end define


//-----------------------------------------------------------------
btk.define({
name: 'xmain@page',
//load: true,
libs: {
	base: 'base@common',
	log: 'log@util',
	ls : 'lstorage@btk',
	de : 'element@wtk',
	menu: 'menu@wtk',
	Timer: 'timer@btk'
},
css : [ 'base@wtk', 'scroll-plain@wtk' ],
when: [ 'state::page.loaded' ],
init: function(libs, exports) {

	var log = libs.log;
	var ls  = libs.ls;
	var de  = libs.de;
	
	var Timer = libs.Timer;
	var CodeMirror = libs.CodeMirror;
	
	var lsm = new ls.Manager('bookmarks');
	page.lsm = lsm;
	
	page.log = log;
	
	//-------------------------------------------------------------
	
	var bookmarks = lsm.getset(
		'bookmarks',
		{	next: 0,
			live: [],
			dead: [],
			data: {}
		}
	);
	
	// sort descending by update stamp then creation stamp
	function order(a,b) {
		var bma = bookmarks.data[a];
		var bmb = bookmarks.data[b];
		
		if (bma.updated > bmb.updated) { return -1; }
		if (bma.updated < bmb.updated) { return 1; }
		if (bma.updated == bmb.updated) {
			if (bma.created > bmb.created) { return -1; }
			if (bma.created < bmb.created) { return 1; }
			return 0;
		}
	}
	
	bookmarks.live.sort(order);
	bookmarks.dead.sort(order);
	
	page.bookmarks = bookmarks;
	
	btk.global.onbeforeunload = function(e) {
		if (bookmarks.dirty) {
			return 'There are unsaved changes.';
		}
	};
	
	//-------------------------------------------------------------
	// where the bookmarks will be rendered
	
	var live = btk.document.querySelector('#bookmarks #live');
	if (!live) {
		log.log.msg('could not find #bookmarks #live');
	}
	
	var dead = btk.document.querySelector('#bookmarks #dead');
	if (!dead) {
		log.log.msg('could not find #bookmarks #dead');
	}

	
	//-------------------------------------------------------------
	function dataToText(bookmark) {
		var text;
		
		if (bookmark.tags && bookmark.tags['@json']) {
			try {
				text = JSON.stringify(bookmark.data, null, 2);
			} catch(e) {
				// don't need to do anything
				// text is already undefined
				console.error(e);
			}
		}
		else {
			text = bookmark.data || '';
		}

		return text;
	}
	page.dataToText = dataToText;

	
	function textToData(bookmark, text) {
		var data;
		
		if (bookmark.tags && bookmark.tags['@json']) {
			try {
				data = JSON.parse(text);
			} catch(e) {
				// don't need to do anything
				// data is already undefined
				console.error(e);
			}
		}
		else {
			data = text;
		}

		return data;
	}
	page.textToData = textToData;

	
	//-------------------------------------------------------------
	// will be populated with event handlers for buttons etc
	var action = {};
	page.action = action;
	
	page.getElement = (function(){
		var doc = btk.document;
		
		return function(id) {
			return doc.getElementById(id);
		}
	}());
	
	action._live = true;

	action._viewport = page.getElement('viewport')
	action._saveall  = page.getElement('saveall');
	action._addnew   = page.getElement('addnew');
	action._showdead = page.getElement('showdead');
	action._showlive = page.getElement('showlive');
	
	action._error = page.getElement('error');
	
	
	function button(name, bookmark, prefix) {
		prefix = prefix || '';
		if (prefix) {
			prefix = prefix + '.';
		}
		
		return de('input')
			.atts({
				'type': 'button',
				'value': name,
				'onclick': [
					'page.action.', prefix, 'do', name ,
					'(', bookmark.id, ');'
				].join('')
			})
	}

	
	//-------------------------------------------------------------
	action.error = function(msg) {
		if (action.error.timer) {
			action.error.timer.stop();
		}
		
		var node = de('div').create();
		node.innerHTML = msg;
		
		action._error.appendChild(node);
		action._error.classList.remove('hidden');
		
		action.error.timer = new Timer(
			function(){
				action._error.innerHTML = '';
				action._error.classList.add('hidden');
				
				delete action.error.timer;
			},
			action.error.timeout
		);
		
		action.error.timer.start();
	}
	action.error.timeout = 5*Timer.SECOND;
	
	
	//-------------------------------------------------------------
	action.smudge = function() {
		bookmarks.dirty = true;
		action._saveall.classList.remove('hidden');
	};

	
	//-------------------------------------------------------------
	// TODO
	// saving to local storage is unacceptable
	// should use file system
	action.saveAll = function() {
		if (bookmarks.dirty) {
			if (action.editor.active) {
				action.error('Edit in progress.<br /> Cannot save until completed.');
			} else {
				delete bookmarks.dirty;
				lsm.set('bookmarks', bookmarks);
				action._saveall.classList.add('hidden');
			}
		}
	}
	
	
	//-------------------------------------------------------------
	action.showLive = function() {
		if (action._live) { return; }
		
		live.classList.remove('hidden');
		action._addnew.classList.remove('hidden');
		action._showlive.classList.add('hidden');
		
		dead.classList.add('hidden');
		action._showdead.classList.remove('hidden');
		
		action._live = true;
	};
	
	
	//-------------------------------------------------------------
	action.showDead = function() {
		if (!action._live) { return; }
		
		live.classList.add('hidden');
		action._addnew.classList.add('hidden');
		action._showlive.classList.remove('hidden');

		dead.classList.remove('hidden');
		action._showdead.classList.add('hidden');
		
		action._live = false;
	};
	
	
	//-------------------------------------------------------------
	action.editor = {};
	
	// only allow one instance at a time
	action.editor.active = false;


	// Changes to editor fields should not dirty
	// the main store. The user might request a
	// cancellation. Smudging should only occur
	// when the edit is complete
	action.editor.smudge = function() {
		action.editor.bookmark.dirty = true;
		action.editor._save.classList.remove('hidden');
		action.editor._restore.classList.remove('hidden');
	};

	
	action.editor.clean = function() {
		delete action.editor._save;
		delete action.editor._restore;
		delete action.editor.bookmark;
		delete action.editor.title;
		delete action.editor.link;
		delete action.editor.data;

		live.removeChild(action.editor.instance);
		delete action.editor.instance;
		
		action.editor.active = false;;
	};
	

	action.editor.addBookmark = function(bookmark) {
		if (bookmark.dirty) {
			bookmark.updated = Date.now();
			delete bookmark.dirty;
			action.smudge();
			
			if (!bookmark.created) {
				// a new bookmark
				bookmark.id = bookmarks.next;
				bookmarks.next++;
				
				bookmark.created = bookmark.updated;
				
				bookmarks.data[bookmark.id] = bookmark;
				bookmarks.live.unshift(bookmark.id);
			}
		}
		
		if (bookmark.created) {
			var bmNode = renderBookmark(bookmark).create();

			if (live.firstChild) {
				live.insertBefore(bmNode, live.firstChild);
			} else {
				live.appendChild(bmNode);
			}
			
			action._viewport.scrollTop = 0;
		}
	};
	
	
	action.editor.dorestore = function(id) {
		var bookmark = action.editor.bookmark;
		
		action.editor.title.value = bookmark.title;
		action.editor.link.value = bookmark.link;
		action.editor.data.value = dataToText(bookmark);
		
		// all clean again!
		delete bookmark.dirty;
		action.editor._save.classList.add('hidden');
		action.editor._restore.classList.add('hidden');
	};
	
	
	action.editor.dosave = function(id) {
		var bookmark = action.editor.bookmark;
		
		var data = textToData(bookmark, action.editor.data.value);
		
		if (btk.isDefined(data)) {
			bookmark.title = action.editor.title.value;
			bookmark.link = action.editor.link.value;
			bookmark.data = data;
		
			action.editor.clean();
			action.editor.addBookmark(bookmark)
		} else {
			action.error('invalid JSON String');
		}
	};
	
	
	action.editor.docancel = function(id) {
		var bookmark = action.editor.bookmark;
		
		if (bookmark.created) {
			// existing bookmark
			// reinstate it
			delete bookmark.dirty;
			var bmNode = renderBookmark(bookmark).create();
			live.insertBefore(bmNode, action.editor.instance);
		}
		
		action.editor.clean();
	};
	
	
	action.editor.render = function(bookmark) {
		action.editor.bookmark = bookmark;
		
		var title = de('input')
			.att('type', 'text')
			.att('value', bookmark.title)
			.att('onchange', 'page.action.editor.smudge()')
			.create()
		action.editor.title = title;
	
		var link = de('input')
			.att('type', 'text')
			.att('value', bookmark.link)
			.att('onchange', 'page.action.editor.smudge()')
			.create()
		action.editor.link = link;
			
		var data = de('textarea')
			.att('class', 'data scroll-plain')
			.att('onchange', 'page.action.editor.smudge()')
			.child(dataToText(bookmark))
			.create()
		action.editor.data = data;
		
		var save = button('save', bookmark, 'editor').create();
		var restore = button('restore', bookmark, 'editor').create();
		var cancel = button('cancel', bookmark, 'editor').create();
		
		save.classList.add('hidden');
		restore.classList.add('hidden');
		
		var instance = de('div')
			.att('class', 'editor')
			.start('div')
				.att('class', 'controls')
				.children([	save, restore, cancel ])
			.end()
			.start('div')
				.att('class', 'fields')
				.start('table')
					.att('class', 'fields')
					.start('tbody')
						.start('tr')
							.att('class', 'row')
							.start('td')
								.att('class', 'label')
								.child('Title')
							.end()
							.start('td')
								.att('class', 'input')
								.child(title)
							.end()
						.end()
						.start('tr')
							.att('class', 'row')
							.start('td')
								.att('class', 'label')
								.child('Link')
							.end()
							.start('td')
								.att('class', 'input')
								.child(link)
							.end()
						.end()
						.start('tr')
							.att('class', 'row')
							.start('td')
								.att('class', 'label')
								.child('Data')
							.end()
							.start('td')
								.att('class', 'input')
								.child(data)
							.end()
						.end()
					.end()
				.end()
			.end()
			.create()
			;
			
		action.editor._save = save;
		action.editor._restore = restore;
		action.editor.instance = instance;
		
		return instance;
	};

	
	//-------------------------------------------------------------
	action.newBookmark = function() {
		if (action.editor.active) {
			action.error('The editor is already active');
			return;
		}
		
		var bookmark = {
			title: '',
			link: '',
			data: ''
		};
		
		var editor = action.editor.render(bookmark)
		
		if (live.firstChild) {
			live.insertBefore(editor, live.firstChild);
		} else {
			live.appendChild(editor);
		}
		
		action.editor.active = true;
	};
	
	//-------------------------------------------------------------
	action.doedit = function(id) {
		if (action.editor.active) {
			action.error('The editor is already active');
			return;
		}
		
		var bookmark = bookmarks.data[id];
		var editor = action.editor.render(bookmark);

		var bmNode = btk.document.getElementById(bookmarkId(bookmark));
		live.replaceChild(editor, bmNode);
		
		action.editor.active = true;
	};
	
	//-------------------------------------------------------------
	action.dodelete = function(id) {
		var bookmark = bookmarks.data[id];
		var bmNode = btk.document.getElementById(bookmarkId(bookmark));
		
		if (!bookmark.dead) {
			// move a live bookmark to the dead list
			
			bookmark.dead = true;
			bookmark.updated = new Date().getTime();
			
			live.removeChild(bmNode);
			bmNode = renderBookmark(bookmark).create();
			
			if (dead.firstChild) {
				dead.insertBefore(bmNode, dead.firstChild);
			} else {
				dead.appendChild(bmNode);
			}
			
			bookmarks.dead.unshift(id);
			bookmarks.live.splice(bookmarks.live.lastIndexOf(id), 1);
		} else {
			// totally delete a dead node
			
			dead.removeChild(bmNode);
			
			delete bookmarks.data[id];
			bookmarks.dead.splice(bookmarks.dead.lastIndexOf(id), 1);
		}
		
		action.smudge();
	};
	
	//-------------------------------------------------------------
	action.dorestore = function(id) {
		var bookmark = bookmarks.data[id];
		delete bookmark.dead;
		bookmark.updated = new Date().getTime();
		
		var bmNode = btk.document.getElementById(bookmarkId(bookmark));
		dead.removeChild(bmNode);
		bmNode = renderBookmark(bookmark).create();
		
		if (live.firstChild) {
			live.insertBefore(bmNode, live.firstChild);
		} else {
			live.appendChild(bmNode);
		}
		
		bookmarks.live.unshift(id);
		bookmarks.dead.splice(bookmarks.dead.lastIndexOf(id), 1);
		
		action.smudge();
	};
	
	//-------------------------------------------------------------
	function pad(t) {
		if (t < 10) { return '0' + t; }
		return t.toString();
	}
	
	function timestamp(time) {
		var date = new Date(time);
		return [
			date.getFullYear(),
			'.',
			pad(date.getMonth()+1),
			'.',
			pad(date.getDate()),
			' at ',
			pad(date.getHours()),
			':',
			pad(date.getMinutes())
		].join('');
	}
	
	function timestampDetail(bookmark) {
		return [
			'Updated: ' + timestamp(bookmark.updated),
			'Created: ' + timestamp(bookmark.created)
		].join('\n');
	}
	
	function dates(bookmark) {
		return de('span')
			.att('class', 'date updated')
			.att('title', timestampDetail(bookmark))
			.child(timestamp(bookmark.updated))
		;
	}

	function bookmarkId(bookmark) {
		return 'bookmark' + bookmark.id.toString();
	}
	
	function buttons(bookmark) {
		return de('div')
			.att( 'class', 'buttons' )
			.child(
				bookmark.dead?
					button('restore', bookmark) :
					button('edit', bookmark)
			)
			.child(button('delete', bookmark))
	}
	
	function pair(left, right, klass) {
		return de('table')
			.klass(klass? klass + ' pair': 'pair')
			.start('tbody')
				.start('tr')
					.klass('top row')
					.start('td')
						.klass('left cell')
						.child(left)
					.end()
					.start('td')
						.klass('right cell')
						.child(right)
					.end()
				.end()
			.end()
		;
	}
	
	function link(bookmark) {
		if (bookmark.link) {
			return de('a')
				.att('class', 'link')
				.att('href', bookmark.link)
				.att('target', '_new')
				.child(bookmark.link || '');
			
		}
		
		return '';
	}
	
	function actionButton(bookmark) {
		return de('wmbox')
			.klass('below left')
			.button()
				.title('actions')
			.end()
			.menu()
				.child(
					bookmark.dead
					? de('wmitem')
						.label('restore')
						.action(function(e) {
							action.dorestore(bookmark.id);
						})
					: de('wmitem')
						.label('edit')
						.action(function(e) {
							action.doedit(bookmark.id);
						})
				)
				.item(
					'delete',
					function(e){
						action.dodelete(bookmark.id);
					}
				)
			.end()
		;
	}
	
	function data(bookmark) {
		var text = dataToText(bookmark);
		
		if (btk.isDefined(text)) {
			return de('div')
				.att('class', 'data scroll-plain')
				.child(text)
			;
		}
		
		return de('div')
			.att('style', [
				'font-weight:bold',
				'font-style:italic',
				'color:red'
			].join(';'))
			.child('invalid bookmark data')
		;
	}
		
	function renderBookmark(bookmark) {
		return de('div')
			.att('id', bookmarkId(bookmark))
			.att('class', bookmark.dead? 'bookmark dead': 'bookmark')
			.children([
				pair(
					de( 'div' )
						.start('div')
							.att('class', 'title')
							.child(bookmark.title || (bookmark.id).toString())
						.end()
						.child(link(bookmark))
					,
					de('div')
						.klass('control')
						.child(dates(bookmark))
						.child(actionButton(bookmark))
					,
					'head'
				),
				data(bookmark)
			])
		;
	}
	
	function renderList(where, list) {
		for (var i=0, j; j=list[i]; i++) {
			var bookmark = bookmarks.data[j];
			bookmark.id = j;
			where.appendChild(renderBookmark(bookmark).create());
		}
	}
	
	renderList(live, bookmarks.live);
	renderList(dead, bookmarks.dead);
	
	//-------------------------------------------------------------
	if (lsm.get('test')) {
		page.cm = CodeMirror;
		console.info('---test mode---');
	}
	
}	// end init
});	// end btk.define
