btk.define({
name: 'background@page',
libs: {
	btk: 'btk@btk',
	Timer: 'timer@btk'
},
init: function(libs, exports) {

	//--------------------------------------------------------
	//	imports
	
	var btk   = libs.btk;
	var Timer = libs.Timer;
	

	//--------------------------------------------------------
	function lsget(key) {
		var v = localStorage[key];
		var value = null;
		
		if (typeof v === 'string') {
			try { value = JSON.parse(v); }
			catch(e) {}
		}
		
		return value;
	}
	exports.lsget = lsget;

	
	function lsset(key, value) {
		var done = false;
		
		try {
			localStorage[key] = JSON.stringify(value);
			done = true;
		}
		catch(e) {}
		
		if (done) { return value; }
	}
	exports.lsset = lsset;
	

	function lsgetset(key, defaultValue) {
		var value = lsget(key);
		
		if (!btk.isDefined(value)) {
			value = defaultValue;
			lsset(key, value);
		}
		
		return value;
	}
	exports.lsgetset = lsgetset;
	
	
	//--------------------------------------------------------
	// default options
	// they get added later 
	var options = {};
	exports.options = options;

	function addOption(key, label, value) {
		if (!btk.isString(key)) { return; }
		
		options[key] = {
			'label':btk.ifString(label, key),
			'value':btk.ifDefined(value, false)
		};
	}
	
	function resetOptions() {
		for (key in options) {
			lsset(key, options[key].value);
		}
	}
	
	
	//--------------------------------------------------------
	var FIRSTRUNDONE = "firstRunDone";
	
	function dofirstrun() {
		alert("first run!!");
		
		resetOptions();

		lsset(FIRSTRUNDONE, true);
	}

	
	function isfirstrun() {
		return !lsget(FIRSTRUNDONE);
	}
	
	
	//--------------------------------------------------------
	function play(id, volume) {
		var sound = btk.document.getElementById(id);
		if (sound) {
			sound.currentTime = 0;
			sound.volume = volume || 1;
			sound.play();
		}
	}
	exports.play = play;

	
	//--------------------------------------------------------
	function notify(options) {
		var notification;
		
		options = options || {};
		
		if (options.url && btk.isString(options.url)) {
			notification = webkitNotifications.createHTMLNotification (options.url);
		} else {
			notification = webkitNotifications.createNotification (
				options.icon || lsgetset('notify.icon', 'images/vm48.png'),
				options.title || lsgetset('notify.title', 'Hello!'),
				options.message || lsgetset('notify.message', 'no message')
			);
		}
		
		notification.onclick = options.onclick;
		notification.onclose = options.onclose;
		notification.onerror = options.onerror;
		notification.ondisplay = options.ondisplay;
		
		if (options.timeout) {
			new Timer(
				function(){ notification.cancel(); },
				options.timeout
			).start();
		}
		
		notification.show();
		
		return notification;
	}
	exports.notify = notify;

	
	//--------------------------------------------------------
	addOption('disableTimers', 'Disable The Timers', true);
	addOption('stopLoop', 'Stop Timer Loop 2', true);
	
	function stopEvent(event) {
		event.stopPropagation();
		event.preventDefault();
		
		return true;
	}
	
	function startTestTimers() {
		// timer 1
		new Timer(
			function(timer) {
				console.info('timer(1) message: ' + this.index);
				this.index++;
				
				if (this.index === 5) {
					console.info('timer(1) message: done(5)');
					notify({message:'that was fun!', timeout:4*Timer.SECOND});
					play('pips3', 0.25);
				}
				
				if (this.index === 10) {
					timer.stop();
					console.info('timer(1) message: done(10)');
					notify({
						title  : 'Hello again!',
						message: 'that was more fun!',
						onclose: function(event) {
							// this = the notification
							console.info('notification closed');
							notify ({
								title  : 'Dude!',
								message: 'seeya lata mate.',
								timeout: 5*Timer.SECOND,
								onerror: function(event) {
									console.info('10+');
									console.error(event);
									return stopEvent(event);
								}
							});
							return stopEvent(event);
						},
						onclick: function(event) {
							console.info('ouch!');
							play('pips1', 0.25);
							return stopEvent(event);
						},
						onerror: function(event) {
							console.info('10');
							console.error(event);
							return stopEvent(event);
						}
					});
					play('pips3', 0.25);
				}
			},
			Timer.SECOND,
			{ index:0 }
		).repeat().start(0);
		
		// timer 2
		new Timer(
			function(timer) {
				console.info('timer(2) message: ' + this.index);
				this.index++;
				if (this.index === 10) {
					play('pips1', 0.25);
					this.index = 0;
				}
				if (lsget('stopLoop')) {
					console.info('timer(2) message: stopping');
					timer.stop();
				}
			},
			Timer.SECOND,
			{ index:0 }
		).repeat().start(0);
	}
	exports.startTestTimers = startTestTimers;
	
	
	//--------------------------------------------------------
	exports.popup = (function() {
	
		var screen = btk.global.screen;
		
		var margin = {
			x: lsgetset('popup.margin.x', 100),
			y: lsgetset('popup.margin.y', 100)
		};
		var min = {
			width : lsgetset('popup.min.width', 300),
			height: lsgetset('popup.min.height', 125)
		};
		var max = {
			width : Math.max(margin.x, screen.availWidth-margin.x),
			height: Math.max(margin.y, screen.availHeight-margin.y)
		};
		
		function popup(data, callback) {
			data = btk.ifObject(data, {});
			data.url  = btk.ifString(data.url, lsgetset('popup.url', 'Blank.html'));
			data.type = btk.ifString(data.type, lsgetset('popup.type', 'popup'));
			data.width = btk.ifNumber(data.width, min.width);
			data.height = btk.ifNumber(data.height, min.height);
			
			chrome.windows.create(data, callback);
		}
		
		popup.center = function(data, callback) {
			popup(
				data,
				function(w) {
					var width  = Math.max(Math.min(w.width , max.width), min.width);
					var height = Math.max(Math.min(w.height, max.height), min.height);
					var data = {
						top   : Math.floor((screen.availHeight - height)/2),
						left  : Math.floor((screen.availWidth  - width )/2),
						width : width,
						height: height
					};
					
					chrome.windows.update(w.id, data, callback);
				}
			);
		};
	
		return popup;
	}());
	
	/*
	chrome.windows.onRemoved.addListener(function(wid){
		console.log('background: onRemoved: ' + wid);
		
		chrome.windows.get(wid, null, function(w){
			console.log('background: onRemoved: ' + wid + ' : get');
			console.log(w);
		});
	});
	*/
	
	//--------------------------------------------------------
	function launch(pageUrl) {
		chrome.tabs.create({url:pageUrl});
	}
	exports.launch = launch;
	
	
	//--------------------------------------------------------
	// initialisation stuff
	
	if ( isfirstrun() ) { dofirstrun(); }
	
	if (lsget('disableTimers')) {
		console.info('test timers disabled');
	} else {
		startTestTimers();
	}

	addOption('test', 'Test Mode', false);

	if (lsget('test')) {
		console.info('test mode');
		btk.global.btk = btk;
		btk.global.bg  = exports;
	}

	
	//--------------------------------------------------------
}});


//============================================================
btk.define({
name: 'alarms@page',
libs: {
	bg: 'background@page',
	btk: 'btk@btk',
	timer: 'timer@btk'
},
init: function(libs, exports) {

	//--------------------------------------------------------
	//	imports
	
	var bg    = libs.bg;
	var btk   = libs.btk;
	var Timer = libs.timer;
	
	
	//--------------------------------------------------------
	var port = {
		opened: false,
		windowId: chrome.windows.WINDOW_ID_NONE
	};
	exports.port = port;
	
	port.open = function(receiver) {
		port.receive = receiver;
		port.opened = true;
	};
	
	port.close = function() {
		port.opened = false;
		port.receive = btk.nothing;
		port.windowId = chrome.windows.WINDOW_ID_NONE;
	};
	
	port.send = function(msg) {
		port.receive(msg);
	};
	
	port.receive = btk.nothing;
	
	
	//--------------------------------------------------------
	//	message handling
	
	var messagesShown = false;
	
	function showMessages() {
		if (messagesShown) { return; }
		
		bg.popup.center(
			{	url:'Messages.html',
				width: bg.lsgetset('messages.width', 200),
				height: bg.lsgetset('messages.height', 300)
			},
			function(window) {
				port.windowId = window.id;
				//console.log('showMessages: created Alarm Message window: ' + window.id);
				
				if (window.id === chrome.windows.WINDOW_ID_NONE) {
					// must have been an error
					messageShown = false;
					//console.error('showMessages: could not create Alarm Message window');
					return;
				}
				
				chrome.windows.onRemoved.addListener(
					function(windowId) {
						//console.log('showMessages.onRemoved: ' + windowId);
						if (windowId === port.windowId) {
							//console.log('showMessages.onRemoved: caught removal');
							if (port.opened) {
								//console.log('showMessages.onRemoved: closing port');
								port.close();
								messagesShown = false;
							}
						}
					}
				);
			}
		);
		
		// do this immediately to avoid multiple opens
		messagesShown = true;
	}
	exports.showMessages = showMessages;
	
	var message = (function(){
		var buffer = [];
		
		function message(msg) {
			buffer.push(msg);
		
			if (port.opened) {
				port.send(msg);
			} else {
				showMessages();
			}
		}
		
		message.apply = function(f) {
			buffer.forEach(f);
		};

		message.clear = function() {
			buffer = [];
		};
		
		return message;
	}());
	exports.message = message;
	

	//--------------------------------------------------------
	var timers = {};
	
	var actions = {
		error: function(action) {
			message([
				'$<span style="color: red;"><b><i>',
				this.title,
				'</i></b></span>',
				].join(''));
			
			message([
				'$<span style="color: red;"><b><i>',
				'Timer Id: ' + this.timer.id,
				'</i></b></span>',
				].join(''));
				
			message(btk.ifString(action.text, '*No Error Message'));
			
			message('-');
		},
		
		message: function(action) {
			message([
				'$<span style="color: blue;"><b><i>',
				this.title,
				'</i></b></span>',
				].join(''));
			
			message(btk.ifString(action.text, 'No Message'));
			
			message('-');
		},

		popup: function(action) {
			bg.notify(action.data);
		},
		
		speak: function(action) {
			var text = btk.ifString(action.text, 'No text');
			var options = btk.ifObject(action.options, {});
			
			options.enqueue = true;
			chrome.tts.speak(text, options);
		},
		
		play: function(action) {
			bg.play(action.sound, action.volume);
		}
	};
	
	function processAction(action) {
		function error(that, text) {
			processAction.call(
				that,
				{	name: 'error',
					text: text
				}
			);
		}
		
		if (btk.isString(action)) {
			processAction.call(this, {name:action, data:this.data});
			
		} else if (btk.isArray(action)) {
			for(var i in action) {
				processAction.call(this, action[i])
			}
			
		} else if (btk.isFunction(action)) {
			action.call(this);
			
		} else if (btk.isObject(action)) {
			if (btk.isString(action.name)) {
				var act = actions[action.name];
				if (act) {
					act.call(this, action);
				} else {
					error(this, 'invalid action: ' + action.name);
				}
			} else {
				error(this, 'invalid action: expected .name:String');
			}
		
		} else {
			error(this, 'invalid action: unrecognised type');
		}
	}
	
	function createTimer(data) {
		data = btk.ifObject(data, {});
		
		data.title = btk.ifString(data.title, '*** No Title ***');
		//data.from = btk.ifDefined(data.from, new Date());
		data.period = btk.ifNumber(data.period, Timer.DAY);
		data.repeat = !!data.repeat;
		
		var timer = new Timer(
			function() {
				processAction.call(this, this.action)
			},
			data.period,
			data
		);
			
		data.timer = timer;
		timers[timer.id] = timer;
		
		timer.repeat(data.repeat).start(data.from);

		btk.message('#alarms@page.createTimer: launched: ' + data.title);
		
		return timer;
	}
	exports.createTimer = createTimer;
	
	exports.timers = timers;
	
	exports.stop = function(id) {
		var timer = timers[id];
		if (timer) {
			timer.stop();
		}
	};
	
	exports.start = function(id) {
		var timer = timers[id];
		if (timer) {
			timer.start();
		}
	};
	
	exports.remove = function(id) {
		var timer = timers[id];
		if (timer) {
			timer.stop();
			delete timers[id];
		}
	};
	
	//--------------------------------------------------------
	if (bg.lsget('test')) {
		btk.global.Timer = Timer;
		btk.global.alarms = exports;
	}
	
	//--------------------------------------------------------
}});


//============================================================
// should move this into its own file
// perhaps in its own directory
// have user library
// path scripts/user
//
btk.define({
name: 'alarms.user@page',
libs: {
	bg: 'background@page',
	btk: 'btk@btk',
	Timer: 'timer@btk',
	alarms: 'alarms@page'
},
init: function(libs, exports) {

	//--------------------------------------------------------
	//	imports
	
	var bg     = libs.bg;
	var btk    = libs.btk;
	var Timer  = libs.Timer;
	var alarms = libs.alarms;

	var createTimer = alarms.createTimer;
	
	
	//--------------------------------------------------------
	// hourly alarm
	createTimer({
		title: 'Hourly Alarm',
		repeat: true,
		from: 0,
		period: Timer.HOUR,
		action: function() {
			var hours = this.timer.getDate().getHours();
			var text = hours + ' hundred hours.';
			
			chrome.tts.speak(text, {rate:0.5});
		},
	});

	// half hourly alarm
	createTimer({
		title: 'Half Hourly Alarm',
		repeat: true,
		from: 30*Timer.MINUTE,
		period: Timer.HOUR,
		action: function() {
			var hours = this.timer.getDate().getHours();
			var text = hours + ' 30 hours.';
			
			chrome.tts.speak(text, {rate:0.5});
		},
	});
	
	createTimer({
		title: 'Eye Reminder',
	//	from: Date.now(),
		from: 0,
		repeat: true,
		period: 59*Timer.MINUTE,
		action: [
			{	name: 'popup',
				data: {
					title: 'Reminder',
					message: 'Rest your eyes',
					timeout: 2*Timer.MINUTE
				}
			},
			{	name: 'play',
				sound: 'pips3',
				volume: '0.5'
			}
		]
	});
	
	//
	// tests
	//
	/*
	createTimer({
		title: 'Test 1',
		repeat: false,
		period: 5*Timer.SECOND,
		action: {
			name: 'play',
			sound: 'pips1',
			volume: '0.5'
		}
	});
	
	createTimer({
		title: 'Test 2',
		repeat: false,
		period: 5*Timer.SECOND,
		action: {
			name: 'speak',
			text: 'hello',
			options: { rate:0.75 }
		}
	});
	
	createTimer({
		title: 'Test 3',
		repeat: false,
		period: 3*Timer.SECOND,
		action: {
			name: 'message',
			text: 'howdy doody!'
		}
	});
	
	createTimer({
		title: 'Test 4',
		repeat: true,
		period: 2*Timer.SECOND,
		action: function() {
			if (this.count == 0) {
				this.timer.stop();
			} else {
				console.log(this.title + ': ' + this.count);
				this.count --;
			}
		},
		count: 10
	});
	
	createTimer({
		title: 'Test 5',
		repeat: true,
		period: 4*Timer.SECOND,
		action: {
			name: 'popup',
			data: {
				title: 'A Test Notification',
				message: 'Hi Ho!',
				timeout: 2*Timer.SECOND
			}
		},
	});
	*/
	
	
	//--------------------------------------------------------
}});


//============================================================
// this module ties the others together
//
btk.define({
name: 'background.link@page',
load: true,
libs: {
	bg: 'background@page',
	alarms: 'alarms@page',
	aluser: 'alarms.user@page',
},
when: [ 'state::document.loaded' ],
init: function(libs, exports) {
	//--------------------------------------------------------
	// don't really need to do anything here
	//--------------------------------------------------------
}});
