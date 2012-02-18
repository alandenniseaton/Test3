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
btk.define({
name: 'testwidgets@page',
//load: true,
libs: {
	base: 'base@common',
	de : 'element@wtk',
	wi : 'menu@wtk'
},
when: [ 'xstate::page.loaded' ],
init: function(libs, exports) {

	var de = libs.de;
	
	page.de = de;
	
	var y = {};
	
	y.sb = btk.document.getElementById('sandbox');
	
	function onclick_mi(e) {
		var text = de('div').child('clicked: ' + this.i).create();
		y.sb.appendChild(text);
	}
	/*
	y.m = de('wmenu')
		.theme('myTheme')
		.title('do some stuff')
	//	.head('hello there world')
		.att('style', 'text-align: center; min-width: 5em;')
		.item('item 1', onclick_mi.bind({i:1}))
		.item('item 2', onclick_mi.bind({i:2}))
		.item('item 3', onclick_mi.bind({i:3}))
		.line()
		.item('item 4', onclick_mi.bind({i:4}))
		.item('item 5', onclick_mi.bind({i:5}))
		.line()
		.item('item 6', onclick_mi.bind({i:6}))
	;
	
	y.mi = y.m.create();
	
	y.sb.appendChild(y.mi);
	*/
	
	function onclick_mb(e) {
		var menu = this.firstChild;
		
		if (menu) {
			if (menu.classList.contains('hidden')) {
				menu.classList.remove('hidden');
			} else {
				menu.classList.add('hidden');
			}
		} else {
			console.info(this.id + ': no children');
		}
	}
	
	y.mb = de('wmbox')
		.theme('myTheme')
		.title('do some stuff')
		.klass('below right')
		.style('width: 1em; height: 1em; margin:50px;')
		.menu()
			.title('blah blah')
			.style('text-align: center; min-width: 5em;')
			.item('item 1', onclick_mi.bind({i:1}))
			.item('item 2', onclick_mi.bind({i:2}))
			.item('item 3', onclick_mi.bind({i:3}))
			.line()
			.item('item 4', onclick_mi.bind({i:4}))
			.item('item 5', onclick_mi.bind({i:5}))
			.line()
			.item('item 6', onclick_mi.bind({i:6}))
		.end()
	;
	
	y.mbi = y.mb.create();
	
	y.sb.appendChild(y.mbi);
	
	
	btk.global.y = y;
}
});


//-----------------------------------------------------------------
btk.define({
name: 'main@page',
load: true,
libs: {
	base: 'base@common',
	log: 'log@util',
	ls : 'lstorage@btk',
	de : 'element@wtk',
	menu: 'menu@wtk',
	Timer: 'timer@btk',
	CodeMirror: 'codemirror@util'
},
css : [ 'base@wtk', 'scroll-plain@wtk' ],
when: [ 'state::page.loaded' ],
init: function(libs, exports) {

	var log = libs.log;
	var ls  = libs.ls;
	var de  = libs.de;
	
	var Timer = libs.Timer;
	var CodeMirror = libs.CodeMirror;
	
	var lsm = new ls.Manager('bookmarks-old');
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
			.klass('data scroll-plain')
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
			.klass('editor')
			.start('div')
				.klass('controls')
				.children([	save, restore, cancel ])
			.end()
			.start('div')
				.klass('fields')
				.start('table')
					.klass('fields')
					.start('tbody')
						.start('tr')
							.klass('row')
							.start('td')
								.klass('label')
								.child('Title')
							.end()
							.start('td')
								.klass('input')
								.child(title)
							.end()
						.end()
						.start('tr')
							.klass('row')
							.start('td')
								.klass('label')
								.child('Link')
							.end()
							.start('td')
								.klass('input')
								.child(link)
							.end()
						.end()
						.start('tr')
							.klass('row')
							.start('td')
								.klass('label')
								.child('Data')
							.end()
							.start('td')
								.klass('input')
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
			.klass('date updated')
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
				.klass('link')
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
				.klass('data scroll-plain')
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
			.klass(bookmark.dead? 'bookmark dead': 'bookmark')
			.children([
				pair(
					de( 'div' )
						.start('div')
							.klass('title')
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


//=================================================================
btk.define({
name: 'testidb@page',
load: true,
libs: {
	base: 'base@common',
	ls: 'lstorage@btk',
	log: 'log@util',
	idb: 'idb@util'
},
when: [ 'xxxstate::page.loaded' ],
init: function(libs, exports) {

	//-------------------------------------------------------------
	var ls  = libs.ls;
	var idb = libs.idb;
	var log = libs.log;
	
	page.idb = idb;
	page.lsm = new ls.Manager('bookmarks');


	var VERSION = '1.0';
	var DB = 'bookmarks';
	var STORE = 'bookmarks';
	var KEYPATH = 'id';
	
	//-------------------------------------------------------------
	// create the database
	page.opencreate = function(params) {
		params = params || {};
		params.name = params.name || DB;
		params.version = params.version || VERSION;
		params.store = params.store || STORE;
		params.keyPath = params.keypath || KEYPATH;
		
		idb.open({
			name: params.name,
			block: params.block,
			
			onversionchange: params.onversionchange,
			
			onsuccess: function(db) {
				if (params.version > db.version) {
					idb.setVersion({
						version: params.version,
						
						onsuccess: function(e) {
							log.log.msg('page.opencreate: set version: ' + params.version);
							var trans = e.target.result;
							var store = db.createObjectStore(
								params.store,
								{	keyPath: params.keyPath,
									autoIncrement: params.autoIncrement
								}
							);
							log.log.msg('page.opencreate: created store: ' + params.store);
							
							idb.current.store = params.store;
							
							if (params.onsuccess) {
								params.onsuccess(e, db, store, params);
							}
						},
						
						onblocked: function(e) {
							console.info('page.opencreate: blocked at: ' + params.name);
							log.log.msg('page.opencreate: blocked at: ' + params.name);
							
							if (params.onblocked) {
								params.onblocked(e, params);
							}
						},
						
						onerror: function(e) {
							log.log.error('page.opencreate: failed to set db version');
							
							if (params.onerror) {
								params.onerror(e, params);
							}
						}
					});
				}
					
			},
			
			onerror: function(e) {
				log.log.error('page.opencreate: error opening: ' + params.name);
				console.info('page.opencreate: error opening: ' + params.name);
				console.log(e);
				
				if (params.onerror) {
					params.onerror(e, params);
				}
			}
		});
	};
	//idb.opencreate();
	
	
	//-------------------------------------------------------------
	function dump() {
		if (!idb.current.db) {
			log.log.error('idb.dump: no db opened');
			return;
		}
		
		if (!idb.current.store) {
			log.log.error('idb.dump: no store selected');
			return;
		}

		log.log.line();
		log.log.msg('idb.dump: ' + idb.current.db.name);
		
		var trans = idb.current.db.transaction(
			[STORE],
			idb.Transaction.READ_ONLY,
			0
		);
		var store = trans.objectStore(STORE);
		var keyRange = idb.KeyRange.lowerBound(0);
		var request = store.openCursor(keyRange);
		//var request = store.openCursor();
		
		request.onsuccess = function(e) {
			var cursor = e.target.result;
			if (!cursor) {
				// no more entries
				return;
			}
			
			var row = cursor.value;
			log.log.msg(JSON.stringify(row), 'blue');
			
			cursor.continue();
		};
		
		request.onerror = function(e) {
			log.log.error('idb.dump: could not query store');
		};
	};
	
	idb.dump = function() {
		if (!idb.current.db) {
			log.log.error('idb.dump: no db open');
			return;
		}
		
		dump();
	};
	
	
	//-------------------------------------------------------------
	page.idb = idb;
	
	if (page.lsm.get('test')) {
		btk.global.idb = idb;
		console.info('---test mode---');
	}
	
}	// end init
});	// end btk.define
