//	control where modules are sourced from.
//	a particular source should only be specified once.
//	if multiple modules depend on a single source then
//	create a parent module that the others depend on.

btk.define.library.path('wtk', 'lib/wtk/');

btk.define.library.path('util', 'lib/util/');

btk.define.library.path('test', 'test/');

btk.define.library.path('scripts', 'scripts/');

btk.define.library.path('common', 'scripts/common/');


btk.define.library.path('bookmarks', 'scripts/bookmarks/');


btk.define.library.prefix('gchrome', 'lib/platform/chrome');


btk.define.library.prefix('3rdParty', 'lib/3rdParty/');

btk.define({
	name: "beautify@3rdParty",
	init: function(){ return js_beautify; }
});


btk.define.library.prefix('CodeMirror', 'lib/3rdParty/CodeMirror/');

btk.define({
	name: 'codemirror@CodeMirror@lib/',
	css: [ './codemirror' ],
	init: function(){ return CodeMirror; }
});
