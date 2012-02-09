//============================================================
// TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST
//============================================================

btk.define({
name: "bbb@test",
libs: {
	btk: 'btk@btk',
	c: 'bbb/ccc@test'
},
need: ["state::document.ready"],
init: function(libs) {
	var btk = libs.btk;
	
	btk.message("-");
	btk.message("!!test/bbb");
	btk.message("test/bbb/ccc.value.message = " + libs.c.message); 
	btk.message("-");
	
	return "hello from test/bbb";
}});

btk.define({
name: "bbb/ccc@test",
libs: {
	btk: 'btk@btk'
},
init: function(lib, exp) {
	btk.message("-");
	btk.message("!!test/bbb/ccc");
	
	btk.define({
	name: "bbb/ccc/ddd@test",
	libs: {
		btk: 'btk@btk',
		e: 'bbb/ccc/eee@test'
	},
	init: function(libs) {
		var btk = libs.btk;
	
		btk.message("-");
		btk.message("!!test/bbb/ccc/ddd");
		btk.message("test/bbb/ccc/eee.value = " + libs.e); 
		btk.message("-");
		
		return "hello from test/bbb/ccc/ddd";
	}});
	
	btk.define({
	name: "test/bbb/ccc/eee@test",
	libs: { btk: 'btk@btk' },
	init: function() {
		var btk = libs.btk;
	
		btk.message("-");
		btk.message("!!test/bbb/ccc/eee");
		btk.message("-");
		
		return "hello from test/bbb/ccc/eee";
	}});
	
	btk.message("-");
	
	exp.message = "hello from test/bbb/ccc";
}});

