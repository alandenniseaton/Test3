//============================================================
//	Event(test) :: Module
//============================================================

btk.define({
name: "test/event",
libs: {
	btk:'btk@btk',
	dom:'dom@btk',
	tti: 'terminal.inline@test'
},
need: [ "state::document.ready" ],
init: function(libs, exp) {


//------------------------------------------------------------
var btk = libs.btk;
var dom = libs.dom;

var disabled = !true;

//var target = document.getElementById("eventSection")
var target = document.querySelector("#TerminalB");
if (!target) {
	disabled = true;
}
console.log(target);

	
var testEvent = function(event, type, mode)
{
	var msg = type + " event(" + mode + "): ";
	
	//??? IE9 doesn't have target
	var target = event.target || event.srcElement;
	
	if (!target.id) { return; }
	
	msg += "(tid=" + (target.id || "") + ")";
	
	//??? IE9 doesn't have currentTarget
	var currentTarget = event.currentTarget || this;
	
	msg += "(ctid=" + (currentTarget.id || "") + ")";
	
	if (event.altKey) msg += "(alt)";
	if (event.ctrlKey) msg += "(ctrl)";
	if (event.metaKey) msg += "(meta)";
	if (event.shiftKey) msg += "(shift)";

	// ??? IE9 does not have this
	// ??? Chrome does not have this
	if (event.isChar) msg += "(char)";
	// ??? IE9 do not have this
	if (event.charCode) msg += "(charCode=" + event.charCode + ")";
	if (event.keyCode) msg += "(keyCode=" + event.keyCode + ")";
	// ??? IE9 does not have this
	if (event.which) msg += "(which=" + event.which + ")";
	
	if (event.clientX) msg += "@("+event.clientX+","+event.clientY+")";
	
	btk.message(msg);
};

function addHandlers() {
	var events = [
		["key","down"],
		["key","press"],
		["key","up"],
		
		["mouse","down"],
		["mouse","move"],
		["mouse","out"],
		["mouse","over"],
		["mouse","up"],
	];
	
	function addEvent(i) {
		var type = events[i][0];
		var mode = events[i][1];
		
		dom.addEventListener (
			target,
			type + mode,
			function(event) {
				testEvent.call(this, event, type, mode);
			}
		);
	}
	
	var i;
	for (i=0; i<events.length; i++) {
		addEvent(i);
	}
}

if (disabled) {
	btk.message("*(test/event) EVENT TESTING DISABLED");
	console.info("(test/event) EVENT TESTING DISABLED");
}
else {
	addHandlers();
}

	
//------------------------------------------------------------
}});
