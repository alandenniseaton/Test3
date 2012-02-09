//============================================================
//	_module :: Module
//============================================================


btk.define({
name: '_module@_library@_source',
libs: {
	btk: 'btk@btk',
	_mm: '_some_module@_some_library@_some_source'
},
when: ['state:_someState', 'event:_someEvent'],
init: function(libs, exports) {


//------------------------------------------------------------
// imports

var btk = libs.btk;
var inherits = btk.inherits;

var _mm = libs._mm;
var _className = _mm.className;
var _func = _mm._func;


//------------------------------------------------------------
// other stuff

//------------------------------------------------------------
}});