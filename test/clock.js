//============================================================
//	Clock(test) :: Module
//============================================================


//============================================================
btk.define({
name: "clock@test",
load: true,
libs: {
	btk  : "btk@btk",
	Timer: "timer@btk",
	dom  : "dom@btk",
	de   : "element@wtk"
},
when: ["state::document.ready"],
init: function(libs, exp) {

//------------------------------------------------------------
// imports
var btk   = libs.btk;
var Timer = libs.Timer;
var dom   = libs.dom;
var de    = libs.de;


//------------------------------------------------------------
btk.message("-");
btk.message("!!test/clock");
btk.message("-");


//------------------------------------------------------------
// create a clock
// top right corner

var days = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
];

var location = document.getElementById("pageRight") || document.body;

var eTime = de('div')
	.att("style","font-size: 200%;")
	.create();
	
var eDay = de('div')
	.klass("frame")
	.style([
		"font-size: 125%",
		"padding:2px",
		"background:transparent",
		"background-image: -webkit-linear-gradient(-90deg, rgba(0,0,0,0), rgba(0,0,0,0.25))",
		"background-image: -moz-linear-gradient(-90deg, rgba(0,0,0,0), rgba(0,0,0,0.25))"
	].join(";"))
	.create();
	
var eDate = de('div')
	.style("font-size: 100%;")
	.create();
	
var eClock = de('div')
	.klass("frame")
	.style([
		"text-align:center",
		"margin-bottom:2px",
		"padding:4px",
		"background:transparent",
		"background-image: -webkit-linear-gradient(-45deg, rgba(0,0,0,0), rgba(0,0,0,0.5))",
		"background-image: -moz-linear-gradient(-45deg, rgba(0,0,0,0), rgba(0,0,0,0.5))"
	].join(";"))
	.child(eDay)
	.child(eTime)
	.child(eDate)
	.create();
	
location.appendChild(eClock);

function pad(x) {
	if (x < 10) {
		return "0" + x;
	} else {
		return String(x);
	}
};

function setDay(now) {
	eDay.innerHTML = days[now.getDay()];
}

function setDate(now) {
	eDate.innerHTML = [
		now.getFullYear(),
		pad(now.getMonth()+1),
		pad(now.getDate())
	].join(".");
}

function setTime(now) {
	eTime.innerHTML = [
		pad(now.getHours()),
		pad(now.getMinutes()),
		pad(now.getSeconds())
	].join(":");
}
	

// initialise the clock fields
var now = new Date();
setDay(now);
setDate(now);
setTime(now);


// update once a day
var dayTimer = new Timer(
	function(timer) {
		var now = new Date();
		
		setDay(now);
		setDate(now);
	},
	24*60*60*1000
)
.repeat(true)
.start(new Date(2011, 1-1, 1));


// update once a second
var secondTimer = new Timer(
	function(timer) {
		setTime(new Date());
	},
	1000
)
.repeat(true)
.start(new Date(2011, 1-1, 1));

btk.clock = {view:eClock, dayTimer:dayTimer, secondTimer:secondTimer};

//------------------------------------------------------------
}});
