//============================================================
// TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST
//============================================================

btk.define({
load: true,
libs: {
	btk: 'btk@btk',
	kdf: 'dataflow@btk'
},
init: function(libs) {
	var btk = libs.btk;
	var kdf = libs.kdf;
	
	var kto = btk.topic;
	
	kto.f = {};

	kto.f.h = new kdf.Filter({
		"*": function(){
			btk.message(
				"[" + this.topic + "](" +
				this.channel +
				((this.block || this.trace)? ")(": "") +
				(this.block? "B": "") +
				(this.trace? "T": "") +
				") " +
				btk.objectToString(this.data)
			);
		}
	});

	kto.open('hello');
	kto.lock('hello', 123);

	kto.f.s = [
		kto.subscribe('hello', kto.f.h, 123),
		kto.link('hello', 'hello1', 123),
		kto.link('hello', 'hello2', 123, 456),
		kto.subscribe('hello1', kto.f.h),
		kto.subscribe('hello2', kto.f.h, 456)
	];
}});


//============================================================
btk.define({
name: "aaa@test",
libs: {
	btk: 'btk@btk',
	xxx: 'bbb@test'
},
init: function(lib) {
	btk.message("-");
	btk.message("!!" + "test/aaa");
	
	btk.message("test/bbb.value = " + lib.xxx);
	btk.message("-");
	
	return "hello from test/aaa";
}});
