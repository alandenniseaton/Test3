//============================================================
//	File System(test) :: Module
//============================================================

btk.define({
name: "lfs@test",
libs: {
	btk : "btk@btk",
	lfsr: "./lfs.request",
	lfsu: "./lfs.url",
	tfs1: "./lfs.fileinput",
	tfs2: "./lfs.dropzone"
},
// need this state for synchronisation
when: [ "state::lfs.access" ],
init: function(libs, lfs) {
	var btk  = libs.btk;
	var lfsr = libs.lfsr;
	var lfsu = libs.lfsu;
	
	console.info('lfsr');
	console.log(lfsr);
	
	lfs.FS = lfsr.FS;
	lfs.convertError = lfsr.convertError;
	
	lfs.lfst = lfsu.lfst;
	lfs.lfsp = lfsu.lfsp;
	
	lfs.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder;

	// convenience
	btk.FS   = lfs.FS;
	btk.lfs  = lfs;
	btk.lfsr = lfsr;

	console.info('lfs');
	console.log(lfs);

	console.info('btk.lfs');
	console.log(btk.lfs);

	console.info('btk.lfsr');
	console.log(btk.lfsr);
	
	return lfs;
}});


//------------------------------------------------------------
btk.define({
name: "lfs.request@test",
libs: { btk:"btk@btk" },
init: function(libs, exports){

	var btk = libs.btk;
	
	var K = 1024;
	var M = K*K;
	var G = K*M;
	
	if (!window.FileError) {
		btk.trigger.state('lfs.access.no');
		return;
	}

	var requestFS = window.requestFileSystem || window.webkitRequestFileSystem;
	
	var fileErrors = { };

	(function() {
		var names = Object.keys(FileError);
		var i;
		for (i=0; i<names.length; i++) {
			if (names[i].substr(-4) == "_ERR") {
				fileErrors[FileError[names[i]]] = names[i];
			}
		}
	}());

	function convertError(fileError) {
		if (fileError instanceof FileError) {
			return fileErrors[fileError.code];
		}
		
		return String(fileError);
	}
	exports.convertError = convertError;
	
	
	function onOK(fs) {
		btk.message('#test/lfs.request: got filesystem');
		
		exports.FS = fs;
		
		btk.trigger.state('lfs.access');
		btk.trigger.state('lfs.access.yes');
	}
	
	function onError(fileError) {
		btk.message('*test/lfs.request: failed to get filesystem');
		btk.message('*test/lfs.request: ' + convertError(fileError));
		
		btk.trigger.state('lfs.access');
		btk.trigger.state('lfs.access.no');
	}
	
	if (requestFS) {
		//requestFS(window.TEMPORARY, 1*M, onOK, onError);
		requestFS(window.PERSISTENT, 1*M, onOK, onError);
	} else {
		onError('no function window.requestFileSystem || window.webkitRequestFileSystem');
	}
	
	return exports;
}});


//------------------------------------------------------------
btk.define({
name: "lfs.url@test",
libs: { lfsr:"./lfs.request" },
init: function(lib, exports) {

	var root = 'filesystem:' + document.location.origin + '/';
	
	function lfs(path, type) {
		return root + type + '/' + path;
	}

	
	function lfst(path) {
		return lfs(path, 'temporary');
	}
	exports.lfst = lfst;
	
	
	function lfsp(path) {
		return lfs(path, 'persistent');
	}
	exports.lfsp = lfsp;
	
}});


//------------------------------------------------------------
/*
<div id="testInputFiles" class="frame">
	<input type="file" id="testMyFile" multiple"/>
</div>
*/
btk.define({
name: "lfs.fileinput@test",
libs: {
	btk: "btk@btk",
	dom: "dom@btk",
	de : "element@wtk"
},
when: [ "state::document.ready" ],
init: function(libs){
	var btk = libs.btk;
	var dom = libs.dom;
	var de  = libs.de;
	
	var location = document.getElementById("pageMiddle") || document.body;
	
	location.appendChild(de('div')
		.atts({
			"id": "testInputFiles",
			"class": "frame"
		})
		.child(de("input")
			.atts({
				"id": "testMyFile",
				"type": "file",
				"multiple": "multiple"
			})
		)
		.create()
	);
	
	var input = document.getElementById('testMyFile');
	if (!input) {
		btk.message("*could not find #testMyFile");
		return;
	}
	
	function handleFiles(files) {
		for (var i=0; i<files.length; i++) {
			btk.message("testMyFile.onchange: file[" + i + "] = " + files[i].name);
		}
	};
	
	input.onchange = function(e) { handleFiles(this.files); };
}});


//------------------------------------------------------------
//<div id="dropzone" class="frame">dropzone</div>

btk.define({
name: "lfs.dropzone@test",
libs: {
	btk: "btk@btk",
	dom: "dom@btk",
	de : "element@wtk",
	tbase: "./base"
},
when: [ "state::document.ready" ],
init: function(libs){
	var btk = libs.btk;
	var dom = libs.dom;
	var de  = libs.de;
	
	var showProps = libs.tbase.showProps;
	
	var location = document.getElementById("pageMiddle") || document.body;
	
	location.appendChild(de('div')
		.atts({
			"id": "dropzone",
			"class": "frame"
		})
		.child("dropzone")
		.create()
	);
	
	var dropzone = document.getElementById('dropzone');
	if (!dropzone) {
		btk.message("*could not find #dropzone");
		return;
	}
	
	function handleFiles(files) {
		for (var i=0; i<files.length; i++) {
			btk.message("dropzone.drop: file[" + i + "] = " + files[i].name);
			btk.message("dropzone.drop: file[" + i + "] = " + webkitURL.createObjectURL(files[i]));
			showProps(files[i].name, files[i]);
		}
	};
	
	function dragenter(e) { dom.stopEvent(e); }
	function dragover(e) { dom.stopEvent(e); }
	function drop(e) {
		dom.stopEvent(e);
		
		handleFiles(e.dataTransfer.files);
	}
	
	dom.addEventListener(dropzone, "dragenter", dragenter);
	dom.addEventListener(dropzone, "dragover", dragover);
	dom.addEventListener(dropzone, "drop", drop);
}});
