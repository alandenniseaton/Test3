'use strict';

// see
// https://developer.mozilla.org/en/IndexedDB/Using_IndexedDB
// http://www.html5rocks.com/en/tutorials/indexeddb/todo/

btk.define({
name: 'idb@util',
libs: { log: 'log@util' },
//when: [ 'state::page.loaded' ],
init: function(libs, idb) {

	var log = libs.log;
	
    idb.log = log;
    
    
	//-------------------------------------------------------------
	var window = btk.global;
	
	idb.DB =
		window.IndexedDB ||
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

		
	var current = {};
	idb.current = current;
	
	
	//-------------------------------------------------------------
	idb.close = function() {
		if (!current.db) {
			log.log.error('idb.close: no db opened');
			return;
		}
		
		log.log.msg('idb.close: ' + current.db.name);
		current.db.close();
		
		delete current.db;
		delete current.store;
	}
	
	
	//-------------------------------------------------------------
	//	params : {
	//		name: String,
	//		version?: String | Number(long long),
	//		onsuccess?: Function(db),
	//		onerror?: Function(e),
	//		onversionchange?: Function(e),
	//		block?: Boolean
	//			if true then the db will not be automatically
	//			closed on version change notification
	//	}
	idb.open = function(params, p2) {
		if (btk.isString(params)) {
			params = { name: params };
			
			if (btk.isString(p2)) {
				params.store = p2;
			}
		}
		
		params = btk.ifObject(params, {});
		params.name = btk.ifString(params.name, '');
		
		if (!params.name) {
			log.log.error('idb.open: db name not specified');
			return;
		}
		
		// Chrome does not use the version parameter at all
		var request = idb.DB.open(params.name, params.version);
		
		//console.info('idb.open request: ' + params.name);
		//console.log(request);
		
		request.onsuccess = function(e) {
			log.log.msg('idb.open: onsuccess: ' + params.name);

			if (current.db) {
				close();
			}
			
			var db = e.target.result;
			current.db = db;
			
			db.onversionchange = function(e) {
    			log.log.msg('idb.open: onversionchange');
				if (params.onversionchange) {
					params.onversionchange(e, params);
				}
				
				if (!params.block) {
					close();
				}
			};
			
			if (params.store) {
				idb.select(params.store);
			}
			
			if (params.onsuccess) {
				params.onsuccess(db, e, params);
			}
		};
		
        request.onupgradeneeded = function(e) {
            // does not fire in Chrome
            log.log.msg('idb.open: onupgradeneeded');
        };
        
		request.onerror = function(e) {
			log.log.error('idb.open: could not open database: ' + params.name);
			if (params.onerror) {
				params.onerror(e, params);
			}
		};
	}
	

	//-------------------------------------------------------------
	function setVersionMsg(params, txt) {
		return [
			'idb.setVersion: (',
			current.db.name,
			',',
			params.version,
			'): ',
			txt
		].join('');
	}
	
	idb.setVersion = function(params) {
		if (!btk.isObject(params)) {
			params = { version: params };
		}
		
		params = btk.ifObject(params, {});
	
		if (!current.db) {
			log.log.error('idb.setVersion: no db opened');
			return;
		}
		
		params.version = params.version || current.db.version;
		
		var request = current.db.setVersion(params.version);
		
		//console.info(setVersionMsg(params, 'request'));
		//console.log(request);
		
		request.onsuccess = function(e) {
			log.log.msg(setVersionMsg(params, 'success'));
			
			if (params.onsuccess) {
				params.onsuccess(e, params);
			}
		};
		
		request.onerror = function(e) {
			log.log.error(setVersionMsg(params, 'failed'));
			if (params.onerror) {
				params.onerror(e, params);
			}
		};
		
		request.onblocked = function(e) {
			// called when some other tab has the db open
			log.log.error(setVersionMsg(params, 'blocked'));
			if (params.onblocked) {
				params.onblocked(e, params);
			}
		};
		
		/*
		// chrome does not use this
		request.onupgradeneeded = function(e) {
			// called when the specified version differs from actual version
			// and all other instances have been closed.
			log.log.msg(setVersionMsg(params, 'upgrade needed'));
			if (params.onupgradeneeded) {
				params.onupgradeneeded(e, params);
			}
		};
		*/
	}
	
	
	//-------------------------------------------------------------
	idb.deleteDB = function(params) {
        log.log.msg('idb.deleteDB: not implemented yet');
        
        // something like this.
        if (current.db && current.db.name == params.name) {
            idb.close();
        }
        
        idb.DB.deleteDatabase(params.name);
    };
    
    
	//-------------------------------------------------------------
	idb.select = function(storename) {
		if (!current.db) {
			log.log.error('idb.select: no db opened');
			return;
		}
		
		if (!storename) {
			log.log.error('idb.select: store name not specified');
			return;
		}
		
		current.store = storename;
		
		log.log.msg('idb.select: ' + current.store);
	}
	
	
	//-------------------------------------------------------------
	function createStoreMsg(params, txt) {
		return [
			'idb.createStore: (',
			current.db.name,
			',',
			params.store,
			'): ',
			txt
		].join('');
	}
	
	idb.createStore = function(params) {
		if (btk.isString(params)) {
			params = { store: params };
		}
		
		params = btk.ifObject(params, {});
		
		if (!current.db) {
			log.log.error('idb.createStore: no db opened');
			return;
		}
		
		params.store = btk.ifString(params.store, btk.ifString(params.name, ''));
		if (!params.store) {
			log.log.error('idb.createStore: no store specified');
			return;
		}
		
		setVersion({
			version: current.db.version,
			
			onsuccess: function(e) {
				var store = current.db.createObjectStore(
					params.store,
					{	keyPath: params.keyPath,
						autoIncrement:params.autoIncrement
					}
				);
				
				current.store = params.store;
				
				log.log.msg(createStoreMsg(params,'success'));
				
				if (params.onsuccess) {
					params.onsuccess(store, e, params);
				}
			},
			
			onerror: function(e) {
				log.log.error(createStoreMsg('failure'));
				if (params.onerror) {
					params.onerror(e, params);
				}
			}
		});
	}

	
	//-------------------------------------------------------------
	function deleteStoreMsg(txt) {
		return [
			'idb.deleteStore: (',
			current.db.name,
			',',
			current.store,
			'): ',
			txt
		].join('');
	}
	
	idb.deleteStore = function(params) {
		params = btk.ifObject(params, {});
		
		if (!current.db) {
			log.log.error('idb.deleteStore: no db opened');
			return;
		}
		
		if (!current.store) {
			log.log.error('idb.deleteStore: no store selected');
			return;
		}

		setVersion({
			version: params.version || current.db.version,
			
			onsuccess: function(e) {
				var trans = e.target.result;
				current.db.deleteObjectStore(current.store);
				
				log.log.msg(deleteStoreMsg('success'));
				
				delete current.store;
				
				if (params.onsuccess) {
					params.onsuccess(e, params);
				}
			},
			
			onerror: function(e) {
				log.log.error(deleteStoreMsg('failure'));
				if (params.onerror) {
					params.onerror(e, params);
				}
			}
		});
	}
	
	
	//-------------------------------------------------------------
	function clear(params) {
		params = btk.ifObject(params, {});
		
		if (!current.db) {
			log.log.error('idb.clear: no db opened');
			return;
		}
		
		if (!current.store) {
			log.log.error('idb.clear: no store selected');
			return;
		}

		var trans = current.db.transaction(
			[current.store],
			idb.Transaction.READ_WRITE
		);
		var store = trans.objectStore(current.store);
		
		var request = store.clear();
		console.info('idb.clear: request');
		console.log(request);
		
		request.onsuccess = function(e) {
			log.log.msg('idb.clear: store cleared');
			if (params.onsuccess) {
				params.onsuccess(e, params);
			}
		};
		
		request.onerror = function(e) {
			log.log.error('idb.clear: could not clear the store');
			if (params.onerror) {
				params.onerror(e, params);
			}
		};
	}
	
	
	//-------------------------------------------------------------
	idb.add = function(params) {
		params = btk.ifObject(params, {});
		
		if (!current.db) {
			log.log.error('idb.add: no db opened');
			return;
		}
		
		if (!current.store) {
			log.log.error('idb.add: no store selected');
			return;
		}

		var trans = current.db.transaction(
			[current.store],
			idb.Transaction.READ_WRITE
			//0	// timeout in milliseconds (no longer works)
		);
		var store = trans.objectStore(current.store);
		
        // both of these work
		//var request = store.put(params.data);
		var request = store.add(params.data);
		
		request.onsuccess = function(e) {
			log.log.msg('idb.add: record added');
			if (params.onsuccess) {
				params.onsuccess(e, params);
			}
		};
		
		request.onerror = function(e) {
			log.log.error('idb.add: could not add record');
			if (params.onerror) {
				params.onerror(e, params);
			}
		};
	};
	
	//-------------------------------------------------------------
	idb.remove = function(params) {
		params = btk.ifObject(params, {});
		
		if (!current.db) {
			log.log.error('idb.remove: no db opened');
			return;
		}
		
		if (!current.store) {
			log.log.error('idb.remove: no store selected');
			return;
		}

		var trans = current.db.transaction(
			[current.store],
			idb.Transaction.READ_WRITE
		);
		var store = trans.objectStore(current.store);
		
		var request = store.delete(params.key);
		
		request.onsuccess = function(e) {
			log.log.msg('idb.remove: removed record: ' + params.key);
			if (params.onsuccess) {
				params.onsuccess(e, params);
			}
		};
		
		request.onerror = function(e) {
			log.log.error('idb.remove: could not remove record: ' + params.key);
			if (params.onerror) {
				params.onerror(e, params);
			}
		};
	};
	
	//-------------------------------------------------------------
	idb.get = function(params) {
		params = btk.ifObject(params, {});
		
		if (!current.db) {
			log.log.error('idb.get: no db opened');
			return;
		}
		
		if (!current.store) {
			log.log.error('idb.get: no store selected');
			return;
		}

		var trans = current.db.transaction(
			[current.store],
			idb.Transaction.READ_WRITE
		);
		var store = trans.objectStore(current.store);
		
		var request = store.get(params.key);
		
		request.onsuccess = function(e) {
			log.log.msg('idb.get: got record: ' + params.key);
			
			var result = e.target.result;
			
			log.log.msg(JSON.stringify(result), 'blue');
			
			if (params.onsuccess) {
				params.onsuccess(result, e, params);
			}
		};
		
		request.onerror = function(e) {
			log.log.error('could not get record: ' + params.key);
			if (params.onerror) {
				params.onerror(e, params);
			}
		};
	};
	
	//-------------------------------------------------------------
	idb.list = {};
	
	idb.list.stores = function() {
		if (!current.db) {
			log.log.error('idb.list.stores: no db opened');
			return;
		}
		
		log.db.msg(current.db.name, 'blue');
		log.db.msg(
			log.indent + '(version: ' + current.db.version + ')',
			'blue'
		);
		
		var names = current.db.objectStoreNames;
		for (var i = 0; i < names.length; i++) {
			log.db.msg(log.indent + names[i], 'green');
		}
	};

	
	idb.list.databases = function() {
		var request = idb.DB.getDatabaseNames();
		
		request.onsuccess = function(e) {
			var names = e.target.result;
			for (var i = 0; i < names.length; i++) {
				idb.open({
					name: names[i],
					
					onsuccess: function(db) {
						idb.list.stores();
						idb.close();
					}
				});
			}
		};
		
		request.onerror = function(e) {
			log.log.error('idb.list.databases: could not get names');
		};
	};

	
}	// end init
});	// end define
