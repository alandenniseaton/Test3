//============================================================
//	util :: Module
//============================================================

btk.define({
name: "util@test",
libs: { btk:"btk@btk" },
init: function(lib, exports) {


//------------------------------------------------------------
// imports

var btk = lib.btk;
var inherits = btk.inherits;


//------------------------------------------------------------
//	Vector :: Class, extends Object

function Vector(x, y, z) {
	this.x = x;
	this.y = y;
	this.z = z;
}

function vector(x, y, z) { return new Vector(x, y, z); }

exports.Vector = Vector;
exports.vector = vector;


(function(p){

	p.className = "Vector";
	
	p.add = function(other) {
		if (!(other instanceof Vector)) {
			throw new TypeError("test/util.Vector.add: expected Vector");
		}
		
		return new Vector(
			this.x + other.x,
			this.y + other.y,
			this.z + other.z
		);
	};
	
	p.sub = function(other) {
		if (!(other instanceof Vector)) {
			throw new TypeError("test/util.Vector.sub: expected Vector");
		}
		
		return new Vector(
			this.x - other.x,
			this.y - other.y,
			this.z - other.z
		);
	};
	
	p.scale = function(s) {
		if (typeof s !== "number") {
			throw new TypeError("test/util.Vector.scale: expected number");
		}
		
		return new Vector(
			s*this.x,
			s*this.y,
			s*this.z
		);
	};
	
	p.dot = function(other) {
		if (!(other instanceof Vector)) {
			throw new TypeError("test/util.Vector.dot: expected Vector");
		}
		
		return (
			this.x * other.x +
			this.y * other.y +
			this.z * other.z
		);
	};
	
	p.cross = function(other) {
		if (!(other instanceof Vector)) {
			throw new TypeError("test/util.Vector.cross: expected Vector");
		}
		
		return new Vector(
			this.y * other.z - this.z * other.y,
			this.z * other.x - this.x * other.z,
			this.x * other.y - this.y * other.x
		);
	};
	
	p.norm2 = function() {
		return this.dot(this);
	};
	
	p.norm = function() {
		return Math.sqrt(this.dot(this));
	};
	
	p.normalise = function() {
		var norm = this.norm();
		if (norm === 0) {
			return this;
		}
		
		return this.scale(1/norm);
	};

	p.eq = function(that) {
		return this.x === that.x && this.y === that.y && this.z === that.z;
	};
	
	p.toString = function(){
		return this.className + "(" + this.x + "," + this.y + "," + this.z + ")";
	};
	
}(Vector.prototype));


Vector.X = vector(1,0,0);
Vector.Y = vector(0,1,0);
Vector.Z = vector(0,0,1);

Vector.Zero = vector(0,0,0);
Vector.One  = vector(1,1,1);


//------------------------------------------------------------
//	Line :: Class, extends Object

function Line(from, to) {
	if (!(from instanceof Vector) || !(to instanceof Vector)) {
		throw new TypeError("test/util.Line: expected (from:Vector, to:Vector)");
	}
	
	this.from = from;
	this.dir  = to.sub(from);
	this.ndir = this.dir.normalise();
}

function line(from, to) { return new Line(from, to); }

exports.Line = Line;
exports.line = line;


(function(p){

	p.className = "Line";
	
	p.at = function(s) {
		return this.from.add(this.dir.scale(s));
	};
	
	p.nat = function(s) {
		return this.from.add(this.ndir.scale(s));
	};
	
	p.toString = function() {
		return [
			this.className,
			"(",
			this.from.toString(),
			" + s*",
			this.dir.toString(),
			")"
		].join("");
	};
	
}(Line.prototype));


//------------------------------------------------------------
//	Runable:: Class, extends Object

function Runable(func, context) {
	if (typeof func !== "function") {
		throw new TypeError("test/util.Runable: expected (func:Function, context:Object)");
	}
	
	this.func = func;
	this.context = context || {};
}

function runable(func, context) { return new Runable(func, context); }

exports.Runable = Runable;
exports.runable = runable;


(function(p){

	p.className = "Runable";
	
	p.run = function(/*arguments...*/) {
		return this.func.apply(this.context, arguments);
	};
	
	p.call = function(/*context, args...*/) {
		var f = this.func;
		// f.call(context, args...)
		// f.call.call(f, context, args...)
		// f.call.apply(f, [context, args...])
		// f.call.apply(f, arguments)
		return f.call.apply(f, arguments);
	};
	
	p.apply = function(context, args) {
		return this.func.apply(context, args);
	};
	
}(Runable.prototype));


//------------------------------------------------------------
//	convenience

btk.kut = exports;
btk.global.kut = exports;


//------------------------------------------------------------
return exports;


//------------------------------------------------------------
}});
