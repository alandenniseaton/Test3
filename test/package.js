//	control where modules are sourced from.
//	a particular source should only be specified once.
//	if multiple modules depend on a single source then
//	create a parent module that the others depend on.

//------------------------------------------------------------
//	TEST TEST TEST
//	proper section at the end
//------------------------------------------------------------

btk.define.library.source('3rdParty', 'lib/');

btk.define({
	name: "s1@3rdParty",
	libs: { btk:"btk@btk" },
	init: function(libs) { return libs.btk.testpkg.s1; }
});
btk.define({
	name: "s1.a",
	load: true,
	libs: {s1:"s1@3rdParty"},
	init: function(libs){ return libs.s1.a; }
});

btk.define({
	name: "s1.b",
	load: true,
	libs: {s1:"s1@3rdParty"},
	when: [ "state::document.ready" ],
	init: function(libs){ return libs.s1.b; }
});

btk.define({
	name: "s2@3rdParty",
	libs: { btk: "btk@btk" },
	init: function(libs) { return libs.btk.testpkg.s2; }
});

btk.define({
	name: "s2.a",
	libs: {s2:"s2@3rdParty"},
	init: function(libs){ return libs.s2.a; }
});
/*/
// this should trigger an error
// don't know how to see it in Firefox
// works in Chrome and IE9 (script.onerror)
btk.define({
	name: "garbage",
	load: true,
	from: "dsaflkjsamnxzcvisad.js"
});

// this should catch it
(function(module){
	btk.define({
		load: true,
		when: [ require('btk.module').state("garbage", "loadFailed") ],
		init: function() { console.info("*** garbage ***"); }
	});
}(require('btk.module')))
/*/

//------------------------------------------------------------
//	The proper section :)
//------------------------------------------------------------

btk.define.library.path('scripts', 'scripts/');

btk.define.library.path('page', 'scripts/');

btk.define.library.path('wtk', 'lib/wtk/');

btk.define.library.path('test', 'test/');

// note redefinition of 3rdParty
btk.define.library.source('3rdParty', 'lib/3rdParty/');

//	actually using this
//	see test/base.showProps
//	needs to be local when running as app
btk.define({
	name: "beautify@3rdParty",
	init: function(){ return js_beautify; }
});

btk.define.library.prefix('CodeMirror', 'lib/3rdParty/CodeMirror/');

btk.define({
	load: true,
	name: 'codemirror@CodeMirror@lib/',
	css: [ 'codemirror@CodeMirror@lib/' ]
});

//	these need to be local if running in app mode
//
btk.define.library.prefix('jQuery', '../../Libs/JQuery/');

btk.define({
	name: "base@jQuery@jquery-1.6.1.min",
	init: function(){ return jQuery; }
});

btk.define({
	name: "ui@jQuery@ui/1.8.13/ui.min",
	libs: {
		inject: "btk.inject",
		jQuery: "base@jQuery"
	},
	wait: true,
	css : [ 'ui@jQuery@ui/1.8.13/' ]
});
