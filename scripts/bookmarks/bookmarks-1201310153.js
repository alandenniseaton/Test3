btk.define({
name: 'main@page',
load: true,
libs: { ls: 'lstorage@btk' },
when: [ 'state::page.loaded' ],
init: function(libs, exports) {

	//-------------------------------------------------------------
	function MessageLog(id) {
		id = btk.ifString(id, 'log');
		this.output = document.getElementById(id) || document.body;
	}

	(function(p){
		p.msg = function(text, colour) {
			colour = colour || this.colour || 'black';
			
			var div = document.createElement('div');
			
			div.setAttribute('style', 'color:' + colour);
			div.innerHTML = text;
			
			this.output.appendChild(div);
		};
		
		p.line = function() {
			var hr = document.createElement('hr');
			this.output.appendChild(hr);
		};
		
		p.error = function(text) {
			this.msg(text, 'red');
		};
	
		p.clear = function() {
			var output = this.output;
			while (output.firstChild) {
				output.removeChild(output.firstChild);
			}
		};
		
	}(MessageLog.prototype));
	
	//-------------------------------------------------------------
	var ls = libs.ls;
	
	page.lsm = new ls.Manager('bookmarks');


	//-------------------------------------------------------------
	// see
	// https://developer.mozilla.org/en/IndexedDB/Using_IndexedDB
	// http://www.html5rocks.com/en/tutorials/indexeddb/todo/
	
	//var VERSION = '1.0';
	var VERSION = '20001.0';
	//var DB = 'bookmarks-' + VERSION;
	var DB = 'bookmarks';
	var STORE = 'bookmarks';
	var KEYPATH = 'id';
	
	var idb = {};
	
	var log = new MessageLog('log');
	idb.log = log;

	var databases = new MessageLog('databases');
	idb.databases = databases;
	
	idb.seq = new btk.Sequence(page.lsm.getset('seq', 0));
	
	var window = btk.global;
	idb.Factory =
		window.indexedDB ||
		window.webkitIndexedDB ||
		window.mozIndexedDB ||
		window.msIndexedDB;
	idb.Transaction =
		window.IDBTransaction ||
		window.webkitIDBTransaction ||
		window.mozIDBTransaction ||
		window.msIDBTransaction;
	idb.KeyRange =
		window.IDBKeyRange ||
		window.webkitIDBKeyRange ||
		window.mozIDBKeyRange ||
		window.msIDBKeyRange;
	
	var indent = '<span style="padding-left:2em"></span>';
	
	//-------------------------------------------------------------
	//	params : {
	//		name: String,
	//		version?: String | Number(long long),
	//		onsuccess?: Function(db),
	//		onerror?: Function(e),
	//		onblocked: Function(e),
	//		onupgradeneeded: Function(e)
	//	}
	idb.open = function(params) {
		params = btk.ifObject(params, {});
		params.name = params.name || DB;
		var request = idb.Factory.open(params.name, params.version);
		//console.info('open request: ' + dbname);
		//console.log(request);
		
		request.onsuccess = function(e) {
			var db = e.target.result;
			
			log.msg('opened database: ' + params.name);
			if (params.onsuccess) {
				params.onsuccess(db);
			}
		};
		
		request.onerror = function(e) {
			log.error('could not open database: ' + params.name);
			if (params.onerror) {
				params.onerror(e);
			}
		};
		
		request.onblocked = function(e) {
			// called when some other tab has the db open
			log.error('blocked: db in use: ' + params.name);
			if (params.onblocked) {
				params.onblocked(e);
			}
		};
		
		request.onupgradeneeded = function(e) {
			// called when the specified version differs from actual version
			// and all other instances have been closed.
			log.error('upgrade needed for database: ' + params.name);
			if (params.onupgradeneeded) {
				params.onupgradeneeded(e);
			}
		};
	};
	
	//-------------------------------------------------------------
	idb.liststores = function(dbname) {
		dbname = dbname || DB;
		idb.open({
			name: dbname,
			onsuccess: function(db) {
				databases.msg(db.name, 'blue');
				databases.msg(
					indent + '(version: ' + db.version + ')',
					'blue'
				);
				
				var names = db.objectStoreNames;
				for (var i = 0; i < names.length; i++) {
					databases.msg(indent + names[i], 'green');
				}
				
				db.close();
			}
		});
	};
	
	idb.listdatabases = function() {
		var request = idb.Factory.getDatabaseNames();
		
		request.onsuccess = function(e) {
			var names = e.target.result;
			for (var i = 0; i < names.length; i++) {
				idb.liststores(names[i]);
			}
		};
		
		request.onerror = function(e) {
			log.error('could not get database names');
		};
	};
	//idb.listdatabases();
	idb.relistdatabases = function() {
		idb.databases.clear();
		idb.listdatabases();
	};

	//-------------------------------------------------------------
	// deleteDatabase
	// available in Chrome 17
	//
	idb.deletestore = function(dbname, store) {
		dbname = dbname || DB;
		idb.open({
			name: dbname,
			
			onsuccess: function(db) {
				console.info('deletestore: success opening: ' + dbname);
				console.log(db);

				db.onversionchange = function(e) {
					console.info('version change requested for: ' + db.name);
					log.msg('version change requested for: ' + db.name);
					db.close();
				};
				
				//var version = '1' + (db.version).toString();
				var version = db.version;
				var request = db.setVersion(version);
				
				request.onblocked = function(e) {
					console.info('blocked at: ' + db.name);
					log.msg('blocked at: ' + db.name);
				};
				
				request.onsuccess = function(e) {
					console.info('new version set: ' + db.version);
					log.msg('new version set: ' + db.version);
					console.info('deleting store: ' + store);
					log.msg('deleting store: ' + store);
					
					var trans = e.target.result;
					db.deleteObjectStore(store);
					
					log.msg('deleted store: ' + store);
					console.info('deleted store: ' + store);
					console.log(db);
					db.close();
				}
				request.onerror = function(e) {
					log.error('could not set version: ' + version);
					log.error('could not delete store: ' + store);
				}
			},
			
			onerror: function(e) {
				console.info('deletestore: error opening: ' + dbname);
				console.log(e);
			}
		});
	};
	
	//-------------------------------------------------------------
	// create the database
	idb.opencreate = function(params) {
		params = params || {};
		params.name = params.name || DB;
		params.store = params.store || STORE;
		params.keypath = params.keypath || KEYPATH;
		params.version = params.version || VERSION;
		
		idb.open({
			name: params.name,
			
			onsuccess: function(db) {
				idb.db = db;
				
				db.onversionchange = function(e) {
					console.info('version change requested for: ' + db.name);
					log.msg('version change requested for: ' + db.name);
					db.close();
					delete idb.db;
				};
				
				if (params.version > db.version) {
					// create a store
					var request = db.setVersion(params.version);
					//console.info('request: setVersion: ' + version);
					//console.log(request);
					
					request.onblocked = function(e) {
						console.info('blocked at: ' + db.name);
						log.msg('blocked at: ' + db.name);
					};
					
					request.onsuccess = function(e) {
						//console.info('setVersion event');
						//console.log(e);
						var trans = e.target.result;
						var store = db.createObjectStore(
							params.store,
							{	keyPath: params.keypath,
								autoIncrement:true
							}
						);
						log.msg('created store: ' + params.store);
					};
					
					request.onerror = function() {
						log.error('opencreate: failed to set db version');
					};
				}
			},
			
			onerror: function(e) {
				console.info('opencreate: error opening: ' + params.dbname);
				console.log(e);
			}
		});
	};
	//idb.opencreate();
	
	
	//-------------------------------------------------------------
	//	record: {
	//		title: String,	// default 'no title'
	//		link: String,	// default ''
	//		data: Anything	// default ''
	//	}
	idb.add = function(record) {
		if (!idb.db) {
			log.error('add: database is not open');
			return;
		}
		
		var trans = idb.db.transaction(
			[STORE],
			idb.Transaction.READ_WRITE,
			0	// timeout in milliseconds
		);
		var store = trans.objectStore(STORE);
		
		record.title = btk.ifString(record.title, 'no title');
		record.link  = btk.ifString(record.link, '');
		//record.data  = btk.ifString(record.data, '');
		//record[KEYPATH] = idb.seq.next();
		
		var request = store.put(record);
		//console.info('request: put');
		//	console.log(request);
		
		request.oncomplete = function(e) {
			// called when ALL requests against the
			// transaction are completed.
		};
		
		request.onsuccess = function(e) {
			log.msg('record added: ' + record[KEYPATH]);
			//page.lsm.set(KEYPATH, record[KEYPATH]);
		};
		
		request.onerror = function(e) {
			log.error('could not add record: ' + record[KEYPATH]);
		};
	};
	
	//-------------------------------------------------------------
	idb.remove = function(key) {
		if (!idb.db) {
			log.error('remove: database is not open');
			return;
		}
		
		var trans = idb.db.transaction(
			[STORE],
			idb.Transaction.READ_WRITE,
			0
		);
		var store = trans.objectStore(STORE);
		
		var request = store.delete(key);
		
		request.onsuccess = function(e) {
			log.msg('removed record: ' + key);
		};
		
		request.onerror = function(e) {
			log.error('could not remove record: ' + key);
		};
	};
	
	//-------------------------------------------------------------
	idb.get = function(key) {
		if (!idb.db) {
			log.error('remove: database is not open');
			return;
		}
		
		var trans = idb.db.transaction(
			[STORE],
			idb.Transaction.READ_WRITE,
			0
		);
		var store = trans.objectStore(STORE);
		
		var request = store.get(key);
		
		request.onsuccess = function(e) {
			log.msg('got record: ' + key);
			log.msg(JSON.stringify(e.target.result),'blue');
		};
		
		request.onerror = function(e) {
			log.error('could not get record: ' + key);
		};
	};
	
	//-------------------------------------------------------------
	function dump(db) {
		log.line();
		log.msg('database dump: ' + db.name);
		
		var trans = db.transaction(
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
			if (!!cursor == false) {
				// no more entries
				return;
			}
			
			var row = cursor.value;
			log.msg(JSON.stringify(row), 'blue');
			
			cursor.continue();
		};
		
		request.onerror = function(e) {
			log.error('could not query store');
		};
	};
	
	idb.dump = function(dbname) {
		dbname = dbname || DB;
		
		if (!idb.db) {
			log.error('dump: database is not open');
			return;
		}
		
		dump(idb.db);
	};
	
	
	//-------------------------------------------------------------
	page.idb = idb;
	
	if (page.lsm.get('test')) {
		btk.global.idb = idb;
		console.info('---test mode---');
	}
	
}	// end init
});	// end btk.define
