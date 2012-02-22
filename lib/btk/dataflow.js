'use strict';

//============================================================
//	dataflow :: Module
//
//	data flow networks with deferred message transmision
//============================================================


btk.define({
name: "dataflow@btk",
libs: { btk:'btk@btk' },
init: function(lib, exports) {


//------------------------------------------------------------
// imports

var btk        = lib.btk;

var kob        = btk.object;
var forEach    = kob.forEach;
var mixin      = kob.mixin;
var create     = kob.create;

var oString    = btk.objectToString;
var Sequence   = btk.Sequence;
var ifDefined  = btk.ifDefined;
var ifFunction = btk.ifFunction;
var identity   = btk.identity;
var nothing    = btk.nothing;
var dmsg       = btk.dmsg;

var defer      = btk.defer;

// prepare for exports
var exports = {};


function cmsg(obj, msg) {
	dmsg(obj.toString() + msg);
}

// deferred message transmission
function send(node, message) {
	dmsg("send: " + node.toString() + ": " + message);
	defer(node, node.receive, [message]);
}

exports.send = send;


//--------------------------------------------------------
// some useful channels

var OK      = "ok";
var ERROR   = "error";
var INFO    = "info";
var DEFAULT = "*";

// message properties

var CHANNEL = "channel";
var DATA    = "data";
var BLOCK   = "block";
var TRACE   = "trace";


//--------------------------------------------------------
//	Message :: extends Object

function Message(data, channel, block, trace) {
	channel = channel || INFO;
	if (typeof channel !== "string") {
		throw new TypeError("btk/base.dataflow.Message: channel parameter must be a string");
	}
	
	this[DATA] = data;
	this[CHANNEL] = channel;
	if (block) { this[BLOCK] = !!block; }
	if (trace) { this[TRACE] = !!trace; }
}

(function(p){
	p.className = "Message";
	
	p.clone = function() {
		return mixin(create(p), this);
	};
	
	p.toString = function() {
		var fields = [];
		
		kob.forEach(this, function(value, key){
			fields.push(key + ":" + oString(value));
		});
		
		fields = fields.join(', ');
		
		return this.className + "(" + fields + ")";
	};
	
}(Message.prototype));

exports.Message = Message;


//--------------------------------------------------------
//	Node :: extends Object
//	Nodes receive and transmit Messages
//	Nodes can be connected to each other
//	Transmission of Messages is ALWAYS deferred
//
//		node[*]::Node
//
//		outputId[1] = node[1].input(source)
//		outputId[2] = node[2].input(source)
//		...
//		outputId[1] = source.output(node[1])
//		outputId[2] = source.output(node[2])
//		...
//		source.removeOutput(outputId[1]);
//		source.removeOutput(outputId[2]);

var nodeId = new Sequence(0);

function Node() {
	if (!this.id) {
		this.id = nodeId.next();
	}
}


(function(p){
	p.className = "Node",
	
	// may be overridden by child classes
	// should return an identifier to use with .removeOutput
	p.output = function(target) {
		return null;
	};

	p.to = function(target) {
		this.output(target);
		return target;
	};

	p.input = function(source) {
		return source.output(this);
	};
	
	p.from = function(source) {
		this.input(source);
		return source;
	};
	
	// may be overridden by child classes
	p.removeOutput = function(outputId) {
		return this;
	};
	
	// may be overridden by child classes
	p.transmit = function(message) {
		return this;
	};
	
	// may be overridden by child classes
	p.receive = function(message) {
		cmsg(this, ".receive: " + message);
		this.transmit(message);
		return this;
	};

	p.toString = function() {
		return this.className + "(" + this.id + ")";
	};
}(Node.prototype));

exports.Node = Node;


//--------------------------------------------------------
//	Pipe :: extends Node
//
//	has at most one output
//	passes received messages straight to output

function Pipe() {
	Pipe.SUPERCLASS.call(this);
	
	this.target = null;
};
btk.inherits(Pipe, Node);


(function(p){
	p.className = "Pipe";
	
	p.output = function(target) {
		cmsg(this, " --> " + target.toString());
		this.target = target;
		return 0;
	};
	
	p.removeOutput = function(outputId) {
		cmsg(this, ".removeOutput: " + outputId);
		if (outputId === 0) {
			this.target = null;
		}
		return this;
	};
	
	p.transmit = function(message) {
		if (this.target) {
			send(this.target, message);
		} else {
			cmsg(this, ".transmit: no target");
		}
		
		return this;
	};
}(Pipe.prototype));

exports.Pipe = Pipe;


//--------------------------------------------------------
//	Filter :: extends Pipe

function Filter(filters) {
	if (typeof filters !== "object") {
		throw new TypeError("btk/base.dataflow.Filter: parameter must be an Object");
	}
	
	Filter.SUPERCLASS.call(this);
	this.filters = filters;
	
	cmsg(this, ":constructed");
};
btk.inherits(Filter, Pipe);


(function(p){
	function frmsg(filter, dfmsg, msg) {
		cmsg(filter, ".receive[" + dfmsg.channel + "]: " + msg);
	}
	
	p.className = "Filter";
	
	p.receive = function(message) {
		cmsg(this, ".receive: " + message);

		// the message to be forwarded
		var nmsg;
		
		// a message is only processed if there is a filter for its channel
		// or if there is a 'default' filter
		var f = this.filters[message.channel];
		
		if (f === undefined) {
			// use the DEFAULT filter if exists
			frmsg(this, message, "no filter");
			frmsg(this, message, "trying '" + DEFAULT + "' filter");
			f = this.filters[DEFAULT];
		}
		
		if (f !== undefined) {
			// the message will be processed
			frmsg(this, message, "filtering");
			if (typeof f === "function") {
				// transmit a filtered version of the message
				frmsg(this, message, "functional filter");
				
				nmsg = message.clone();
				
				try {
					var data = f.call(nmsg, nmsg.data);
					if (data !== undefined) {
						nmsg.data = data;
						this.transmit(nmsg);
					} else {
						// the message will not be transmitted
						frmsg(this, message, "filter result undefined");
					}
				} catch(e) {
					// an error message will be transmitted
					frmsg(this, message, String(e));
					nmsg.channel = ERROR;
					nmsgdata     = e;
					this.transmit(nmsg);
				}
				
			} else if (typeof f === "string") {
				// change the message channel
				frmsg(this, message, "mapping to '" + f + "'");
				
				nmsg = message.clone();
				
				nmsg.channel = f;
				
				this.transmit(nmsg);
				
			} else if (typeof f === "boolean") {
				if (f) {
					// transmit the message as it is
					frmsg(this, message, "passing");
					this.transmit(message);
				} else {
					// the message will not be transmitted
					frmsg(this, message, "discarding");
				}
				
			} else {
				// the message will not be transmitted
				frmsg(this, message, "unrecognised filter");
			}
			
		} else {
			// the message will not be transmitted
			frmsg(this, message, "no filter");
		}
		
		return this;
	};
}(Filter.prototype));

exports.Filter = Filter;

	
Node.prototype.on = function(filters) {
	return this.to(new Filter(filters));
};


//--------------------------------------------------------
// TargetList :: extends Object

function TargetList() {
	this.targetId = new Sequence(0);
	this.targets  = {};
	this.length   = 0;
};
btk.inherits(TargetList, Object);


(function(p){
	p.className = "TargetList";
	
	p.add = function(target) {
		var targetId = this.targetId.next();
		
		this.targets[targetId] = target;
		this.length++;
		return targetId;
	};
	
	p.remove = function(targetId) {
		if (targetId && this.targets[targetId]) {
			delete this.targets[targetId];
			this.length--;
		}
		
		return this;
	};

	p.empty = function() {
		if (this.length > 0) {
			this.targetId.reset();
			this.targets = {};
			this.length  = 0;
		}
		
		return this;
	};
	
	p.transmit = function(message) {
		if (this.length > 0) {
			kob.forEach(this.targets,
				function(target) {
					send(target, message);
				}
			);
		} else {
			cmsg(this, ".transmit: no targets");
		}
		
		return this;
	};
	
	p.toString = function() {
		if (this.id) {
			return this.className + "(" + this.id + ")";
		} else {
			return this.className;
		}
	};
}(TargetList.prototype));


//--------------------------------------------------------
//	Branch :: extends Node

function Branch() {
	Branch.SUPERCLASS.call(this);
	
	this.targets = new TargetList();
	this.targets.id = this.id;
};
btk.inherits(Branch, Node);


(function(p){
	p.className = "Branch";
	
	p.output = function(target) {
		cmsg(this, " --> " + target.toString());
		return this.targets.add(target);
	}
	
	p.removeOutput = function(targetId) {
		cmsg(this, ".removeOutput: " + targetId);
		this.targets.remove(targetId);
		return this;
	};
	
	p.removeAllOutputs = function() {
		this.targets.empty();
		return this;
	};

	p.transmit = function(message) {
		cmsg(this, ".transmit: " + message);
		// deferral is handled by target list
		this.targets.transmit(message);
		return this;
	};
}(Branch.prototype));

exports.Branch = Branch;


//--------------------------------------------------------
//	BTBranch :: extends Branch
//
//		Receipt of trace messages causes the btBranch to remember them.
//		Effectively, the data message becomes the value of the btBranch
//		and any new connections automatically receive it.
//		Subsequent non-trace messages cause the trace to be cleared.
//
//		Receipt of block messages causes the btBranch to become blocked.
//		Subsequent messages are ignored.

function BTBranch() {
	BTBranch.SUPERCLASS.call(this);
	
	//	the message blocking this btBranch
	//	or a message trace
	this.trace   = null;
	
	this.blocked = false;
	
	cmsg(this, ":constructed");
};
btk.inherits(BTBranch, Branch);


(function(p){
	p.className = "BTBranch";
	
	p.output = function(target) {
		var id;

		if (this.blocked) {
			// target does not need to be remembered
			cmsg(this, " --> " + target.toString());
			id = null;
		} else {
			id = BTBranch.SUPER.output.call(this, target);
		}
		
		if (this.trace) {
			// automatically send the trace message
			send(target, this.trace);
		}
		
		return id;
	};

	p.receive = function(message) {
		cmsg(this, ".receive: " + message);
		if (this.blocked) {
			// ignore message
			cmsg(this, ".receive: message ignored");
			return this;
		}
		
		// clear the trace
		this.trace = null;
		
		if (message[BLOCK]) {
			cmsg(this, ".receive: blocking");
			// ignore subsequent messages
			this.blocked = true;
		}

		if (message[TRACE]) {
			cmsg(this, ".receive: tracing");
			// remember the message
			this.trace = message;
		}
		
		this.transmit(message);
		
		if (this.blocked) {
			// must have received a blocking message
			// do not need to remember current outputs
			cmsg(this, ".receive: disconnecting outputs");
			this.removeAllOutputs();
		}
		
		return this;
	};
}(BTBranch.prototype));

exports.BTBranch = BTBranch;

//--------------------------------------------------------
// exports some stuff

exports.OK          = OK;
exports.ERROR       = ERROR;
exports.INFO        = INFO;
exports.DEFAULT     = DEFAULT;

exports.CHANNEL     = CHANNEL;
exports.DATA        = DATA;
exports.BLOCK       = BLOCK;
exports.TRACE       = TRACE;

return exports;

//------------------------------------------------------------
}});