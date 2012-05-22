'use strict';

//-----------------------------------------------------------------
//
// FOR TESTING
//
//-----------------------------------------------------------------
btk.define({
name: 'test@bookmarks',
load: true,
libs: {
	Set: 'set@util',
	promise: 'promise@btk',
	de : 'element@wtk',
	DSManager: 'dsManager@util',
	main: 'main@page',
	importOld: 'importOld@bookmarks'
},
init: function(libs, exports) {

	console.log('test@bookmarks');

	var g         = btk.global;
	var doc       = btk.document;
	var namespace = btk.namespace;
	
	if (page.test) {
		console.log('test@bookmarks: doing tests');
	
		g.x = (function(){
			var x = {};
			x.de  = libs.de;
			x.kpr = libs.promise;
			x.P   = x.kpr.Promise;
			x.R   = x.kpr.Result;
			x.DSM = libs.DSManager;
			x.Set = libs.Set;
			
			x.dssm = page.model.dssm;
			x.dsm  = page.model.dsm;

			x.f = function() {
				function g() {
					var a = {
						'this': this,
						'args': arguments
					};
					console.log(a);
				}
				
				g.apply({'g':'this object'}, arguments);
			};
			
			x.dl = page.control.datalist;
			
			x.build = function() {
				var context =  {
					'dsm': page.model.dsm,
					'output': page.view.datalist,
					'lock': new x.dl.Lock()
				};
				
				context.lock.old.chain([
				
					function(result) {
						return this.dsm.open();
					},
				
					function(result) {
						return this.dsm.addTag('my.tag');
					},
					
					function(result) {
						return this.dsm.addTag('my.other.tag');
					},
					
					function(result) {
						return this.dsm.addTag('@@@zombie');
					},
					
					function(result) {
						var dse = this.dsm.newElement();
						
						dse.setTitle('a dead test');
						dse.setField('f1', 'v1');
						dse.setField('f2', 'v2');
						dse.setField('f3', 'v3');
						dse.setField('f4', 'v4');
						
						dse.setLink([
							'the/first/link.html',
							'the/second/link.html'
						]);
						
						dse.setData([
							'Hello there <u>world</u>. ',
							'How <big><b>are</b></big> you today? ',
							'I am <span style="color:green">fine</span> thankyou. ',
							'Thats good then. ',
							'<br>',
							'This should be on another line. '
						]);
						
						this.dse = dse;
						
						return this.dsm.addElementToTag(this.dse, 'my.tag');
					},
						
					function(result) {
						return this.dsm.addElementToTag(this.dse, 'my.other.tag');
					},
					
					function(result) {
						return this.dsm.addElementToTag(this.dse, '@html');
					},
					
					function(result) {
						return this.dsm.addElementToTag(this.dse, '@@@dead');
					},
					
					function(result) {
						return this.dsm.putElement(this.dse);
					},
					
					function(result) {
						var dse = this.dsm.newElement();
						
						dse.setTitle('a test');
						
						dse.setLink([
							'http://141.213.232.243/bitstream/2027.42/43180/1/10992_2004_Article_BF00542649.pdf',
							'file:///C:/users/Alan Dennis/',
							'notes.txt'
						]);
						
						dse.setData([
							'Hello there world.',
							'How are you today?',
							'I am fine thankyou.',
							'Thats good then.'
						]);
						
						this.dse = dse;
						
						return this.dsm.addElementToTag(this.dse, 'my.tag');
					},
						
					function(result) {
						return this.dsm.addElementToTag(this.dse, '@@@live');
					},
					
					function(result) {
						return this.dsm.putElement(this.dse);
					},
					
					function(result) {
						return libs.importOld(this.dsm);
					},
					
					page.control.taglist.refresh,
					
					function(result) {
						page.control.datalist.refresh(new x.Set());
					},
					
					function(result) {
						this.lock.open();
					}
					
				], context );
			};
			
			x.build();
			
			function onok(result) {
				console.info('OK');
				console.log(result);
			};
			
			function oninfo(result) {
				console.info('INFO');
				console.log(result);
			};
			
			function onelement(result) {
				console.info('ELEMENT');
				console.log(result);
			};
			
			function onerror(result) {
				console.error('ERROR');
				console.log(result);
			};
			
			function oncancel(result) {
				console.warn('CANCEL');
				console.log(result);
			};
			
			function ondefault(result, message) {
				console.info('DEFAULT: ' + message.type);
				console.log(result);
			};
			
			x.actions = {
				'ok'     : onok,
				'info'   : oninfo,
				'element': onelement,
				'cancel' : oncancel,
				'error'  : onerror,
				'default': ondefault
			};
			
			return x;
		}());
		
	} else {
		console.log('test@bookmarks: NOT doing tests');
	}
	
	
	//-------------------------------------------------------------

	exports.done = true;
	
}	//end init
})	// end define
