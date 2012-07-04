//============================================================
//	Base(test) :: Module
//============================================================

btk.define({
name: "base@test",
libs: {
	btk: "btk@btk",
	dom: "dom@btk",
	kde: "element@wtk",
	bea: "beautify@3rdParty"
},
css: [ "./base", "base@wtk" ],
init: function(lib, exports) {


//------------------------------------------------------------
// imports

var btk = lib.btk
var dom = lib.dom;
var kde = lib.kde;

var beautify = lib.bea;


//------------------------------------------------------------
function showProps(name, obj) {
	var NONAME = "*no name*";
	
	if (arguments.length < 2) {
		obj  = name;
		name = null;
	}
	
	if (typeof name !== "string") {
		if (obj) {
			name = obj.fullName || obj.name || null;
			if (!name && obj.constructor.name) {
				name = "a " + obj.constructor.name;
			}
		} else {
			name = null;
		}
	}
	
	name = name || NONAME;
	
	var table =
		kde("table")
			.klass("showProps")
			.start("thead")
				.start("tr") 
					.children([
						kde("th", {}, ["Name"]),
						kde("th", {}, ["Type"]),
						kde("th", {}, ["Value"])
					])
				.end()
			.end()
			.start("caption")
				.start("h2")
					.child("Properties of " + name + ": type '" + typeof obj + "'")
				.end()
			.end()
		;
	
	var body = kde("tbody");
	table.child(body);
	
	function tr(children) {
		body.start("tr")
			.children(children)
		.end();
	}
	
	function td(content) {
		return kde("td")
			.start('span')
				.child(content)
			.end()
		;
	}
	
	function tdcode(content) {
		return kde("td")
			.start('span')
				.klass("code")
				.child(content)
			.end()
		;
	}
	
	if (obj === null) {
		tr(["Null object"]);
	} else if (obj === undefined) {
		tr(["Undefined object"]);
	} else if (! (obj instanceof Object)) {
		tr([String(obj)]);
	} else {
		var props = Object.getOwnPropertyNames(obj).sort();
		var i, limit=props.length;
		for (i=0; i<limit; i++) {
			var prop = props[i];
			if (obj[prop] === null) {
				tr([td(prop.toString()), td("null"), td("")]);
			} else if (obj[prop] === undefined){
				tr([td(prop.toString()), td("undefined"), td("")]);
			} else if (typeof obj[prop] === "string"){
				tr([
					td(prop),
					td("string"),
					td(obj[prop])
				]);
			} else if (typeof obj[prop] === "function"){
				tr([
					td(prop),
					td("function"),
					tdcode(beautify(obj[prop].toString(), {"brace_style":"collapse"}))
				]);
			} else if (typeof obj === "function" && prop === "prototype"){
				// prototypes may have toString methods.
				// they will get called by objectToString unless told not to
				tr([
					td("prototype"),
					td("object"),
					tdcode(btk.objectToString(obj[prop], "(not showable)", 4, true))
				]);
			} else {
				tr([
					td(prop),
					td(typeof obj[prop]),
					tdcode(btk.objectToString(obj[prop], "(not showable)", 4))
				]);
			}
		}
	}
	
	btk.message(table.create());
	btk.message("");
};

//------------------------------------------------------------
function Test(title, body) {
	this.title = title;
	this.body  = body;
};
btk.inherits(Test, Object);

(function(p){
	p.className = "Test";

	function error(e) {
		return [
			'$<pre style="color:red;">',
			e.stack || e,
			'</pre>'
		].join('');
	}
	
	p.run = function() {
		btk.message("-");
		btk.message("!!!Test: " + this.title);
		
		var result;
		
		try {
			result = this.body();
			btk.message("#result = " + btk.objectToString(result));
		} catch(e) {
			btk.message(error(e));
		}
		
		btk.message("-");
		
		return result;
	};

	p.toString = function() {
		return this.className + "(" + String(this.title) + ")";
	};
}(Test.prototype));

//------------------------------------------------------------
// some exports

exports.Test = Test;

exports.table =
	kde("table",
	{	"class":"showProps",
		style:"border-collapse:collapse; background-color:#dddddd"
	},
	[	kde("caption", {}, ["Test Table"]),
		kde("tbody", {},
		[	kde("tr", {},
			[	kde("td", {}, ["hello there world"]),
				kde("td", {}, ["how are you today?"])
			]),
			kde("tr", {},
			[	kde("td", {}, ["row2"]),
				kde("td", {}, ["i am fine thankyou."])
			]),
			kde("tr", {},
			[	kde("td", {}, ["row3"]),
				kde("td", {}, ["and how are you?"])
			]),
		])
	]);
	
exports.showProps = showProps;

btk.showProps = showProps;

//------------------------------------------------------------
}});
