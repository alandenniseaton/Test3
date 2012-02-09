//============================================================
//	Terminal(test) :: Module
//============================================================

// changes to the way terminals work has fucked these examples up.
// tough shit.

btk.define({
name: "terminal@test",
libs: {
	btk: "btk@btk",
	dom: "dom@btk",
	de:  "element@wtk",
	Terminal: "terminal@wtk",
	css: "./terminal.css"
},
css : [ "./terminal.css" ],
init: function(libs) {


//------------------------------------------------------------
// imports

var btk      = libs.btk;
var dom      = libs.dom;
var Terminal = libs.Terminal;
var de       = libs.de;

var body = btk.document.body;




//------------------------------------------------------------
var terminalBox = de('div')
	.att("class", "terminalBox")
	.create();
	
body.appendChild(terminalBox);


//------------------------------------------------------------
function makeTerminal(prompt, theme) {
	var terminal = new Terminal(
		prompt,
		function () {
			this.log(this.commandLine.createEcho())
			this.log(this.getValue());
		},
		theme
	);
	
	terminal.setPlaceholder("enter text here");
	
	return terminal;
}


//------------------------------------------------------------
(function(){
	var terminal1 = makeTerminal("[terminal: test 1]", "myFirst");

	[	"#terminal frame dimensions are inferred from terminal title and terminal",
		"#terminal has fixed dimensions",
		"#resize is on terminal",
		"*Chrome: resize is added to child if on frame",
		"*Firefox: resize does not get activated if on frame (needs to be on terminal)",
		"*IE9: resize not implemented resize",
		"-"
	].forEach(function(item){
		terminal1.log(item);
	});

	var tframe = de('span')
		.att("class", "myFirst frame")
		.child(de('div')
			.att("class", "myFirst title")
			.child("This is Terminal 1")
		)
		.child(terminal1)
		/* stuff for drag and drop
		// see http://www.html5rocks.com/tutorials/dnd/basics/
		// and file:///D:/Everyone/Documents/HTML/Test2/Boxes.html
		.att("draggable", "true")
		.on({
			"dragstart": function(event){
				this.style.opacity = "0.5";
				event.dataTransfer.effectAllowed = 'move';
				event.dataTransfer.setData("text/plain", "hello there world");
			},
			"dragend": function(event){
				this.style.opacity = "1.0";
			},
		})
		*/
		.create();

	terminalBox.appendChild(tframe);
}());


//------------------------------------------------------------
(function(){
	var terminal2 = makeTerminal("[terminal: test 2]", "mySecond");

	[	'$<span style="font-size:150%; font-weight:bold;">This is Terminal 2</span>',
		"*this is pretty much the default terminal",
		"*just some CSS added for geometry and decoration",
		"-"
	].forEach(function(item){
		terminal2.log(item);
	});

	terminalBox.appendChild(terminal2.create());
}());


//------------------------------------------------------------
(function(){
	var terminal3 = makeTerminal("[terminal: test 3]", "myThird");

	[	"#uses flexbox box model to lay out the terminal",
		"*Chrome: it seems that resize does not work properly with flexbox",
		"*Firefox: box-flex CSS property does not work properly",
		"*IE9: flexbox not implemented",
		"-"
	].forEach(function(item){
		terminal3.log(item);
	});

	var tframe = de('div')
		.att("class", "myThird frame")
		.child(de('div')
			.att("class", "myThird title")
			.child("This is Terminal 3")
		)
		.child(terminal3)
		.create();

	terminalBox.appendChild(tframe);
}());


//------------------------------------------------------------
}});