//============================================================
//	gdrive :: Module
//============================================================

// see http://www.html5rocks.com/en/tutorials/file/xhr2/
// see http://en.wikipedia.org/wiki/XMLHttpRequest

// search 'OAuthForDevices' in 'Checker Plus for GMail/background.html/common.js'

btk.define({
name: 'gdrive@test',
libs: {
	btk: 'btk@btk'
},
when: [ 'state::page.loaded' ],
init: function(libs, exports) {


//------------------------------------------------------------
var btk = libs.btk;
var inherits = btk.inherits;

btk.appDetails = chrome.app.getDetails();


//------------------------------------------------------------
//------------------------------------------------------------
var oa = btk.namespace('oa');

btk.namespace('auth', oa);

oa.auth.requestURI = 'https://accounts.google.com/o/oauth2/auth';
oa.auth.successURI = 'https://accounts.google.com/o/oauth2/approval';
oa.auth.errorURI = 'https://accounts.google.com/o/oauth2approval';	// same as success
oa.auth.tokenURI = 'https://accounts.google.com/o/oauth2/token';
//oa.auth.scope = 'https://www.googleapis.com/auth/userinfo.email';
//oa.auth.scope = 'https://www.googleapis.com/auth/userinfo.profile';
oa.auth.scope = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

//oa.auth.scope = 'https://www.google.com/m8/feeds';

oa.auth.validateURI = 'https://www.googleapis.com/oauth2/v1/tokeninfo';
oa.auth.userinfoURI = 'https://www.googleapis.com/oauth2/v1/userinfo';


//------------------------------------------------------------
oa.testfile = 'notes.txt';
oa.async = true;
oa.responsetype = '';
//oa.responseType = 'text';
//oa.responseType = 'arraybuffer';
//oa.responseType = 'blob';
//oa.responseType = 'document';


oa.test = true;


//------------------------------------------------------------
oa.openWindow = function(params) {
	params = params || {};
	
	params.url = params.url || null;
	params.name = params.name || '';
	params.atts = params.atts || 'toolbar=0,scrollbars=0,menubar=0,resizable=0,width=700,height=500';
//	params.atts = params.atts || 'toolbar=0,scrollbars=0,menubar=0,resizable=0,width=700,height=500,status=no';
	
	return window.open(params.url, params.name, params.atts);
};


btk.reminders = [
	"",
	"consider what happens when the authorisation",
	"window is contained in an I-Frame",
	""
];

btk.showReminders = function(newState) {
	
	if (newState !== 'active') return null;
	
	var w = oa.openWindow({
		url:null,
		atts:"toolbar=0,scrollbars=0,menubar=0,resizable=0,width=350,height=250"
	});
	
	var doc = w.document;
	var mem = btk.reminders;
	var len = mem.length;
	
	for (var i=0; i<len; i++) {
		doc.body.appendChild(doc.createTextNode(mem[i]));
		doc.body.appendChild(doc.createElement('br'));
	}
	
	return w;
};


// see http://code.google.com/chrome/extensions/idle.html
chrome.idle.onStateChanged.addListener(
	btk.showReminders
);
btk.showReminders('active');


//------------------------------------------------------------
oa.userinfo = function(token) {
	token = token || oaw.token;
	token.type = token.type || 'Bearer';
	
	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function(e){
		console.log('gdrive.userinfo@test: onreadystatechange:', xhr.readyState);
		
		if (xhr.readyState == 4 ) {
			if (xhr.status == 200 ) {
				console.log('success processing the token');
				oa.auth.validationResponse = xhr.response;
				
			} else if (xhr.status == 400) {
				console.log('received error (400) processing the token');
				
			} else {
				console.log('received error (' + xhr.status + ') processing the token');
				
			}
		}
	};
	
	xhr.open('GET',oa.auth.userinfoURI,oa.async);
	xhr.setRequestHeader(
		'Authorization',
		token.type + ' ' + token.access
	);
	xhr.send();
	
	oa.xhr = xhr;
	
	return xhr;
};


//------------------------------------------------------------
//------------------------------------------------------------
// Gapi Project: Note Space
//-------------------------
// (installed application)

btk.namespace('i.token', oa);
btk.namespace('i.auth', oa);

var oai = oa.i;


// this should be set programatically
// like this just for testing
oai.token.code = '4/ZkdqkmSXFJHY58hZBAzfBoTgyyS7.EldCdo-BFr8WgrKXntQAax3OQhiKcAI';
oai.token.type = 'Bearer';	// this is constant for this flow
oai.token.access = '';
oai.token.refresh = '';

oai.auth.responsetype = 'code';
oai.auth.apikey = 'AIzaSyBWDSteALEpuET94Wd_Eb57bcDXrHTWA7s';
oai.auth.clientid = '569863883099.apps.googleusercontent.com';
oai.auth.secret = 'jaQXfOko5-JFINsDnN96sJIZ';
oai.auth.redirect = 'urn:ietf:wg:oauth:2.0:oob';


oai.exchange = function() {
	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function(e){
		console.log('gdrive.exchange@test: onreadystatechange:', xhr.readyState);
		
		if (xhr.readyState == 4 ) {
			if (xhr.status == 200 ) {
				oai.auth.exchangeResponse = xhr.response;
	
			} else if (xhr.status == 400) {
				console.log('there was an error processing the token');	
				
			} else {
				console.log('something else other than 200 or 400 was returned');	
			}
			
			console.log(xhr);
		}
	};
	
//	oai.auth.tokenURI = document.location.href;
//	oai.auth.tokenURI = document.location.origin;
//	oai.auth.tokenURI = 'notes.txt';
	xhr.open('POST',oai.auth.tokenURI,oai.async);
	
	xhr.setRequestHeader('code', oai.token.code);
	xhr.setRequestHeader('client_id', oai.auth.clientid);
	xhr.setRequestHeader('client_secret', oai.auth.secret);
	xhr.setRequestHeader('redirect_uri', oai.auth.redirect);
//	xhr.setRequestHeader('redirect_uri', chrome.extension.getURL('Scratch.html'));
//	xhr.setRequestHeader('redirect_uri', document.location.href);
	xhr.setRequestHeader('grant_type', 'authorization_code');
	
/*	
	var url = [
		'https://accounts.google.com/o/oauth2/token',
		'?code=', encodeURIComponent(oai.token.code),
		'&client_id=', encodeURIComponent(oai.auth.clientid),
		'&client_secret=', encodeURIComponent(oai.auth.secret),
		'&redirect_uri=', encodeURIComponent(oai.auth.redirect),
		'&grant_type=authorization_code'
	].join('');
*/
//	xhr.open('POST',url,oai.async);
//	xhr.setRequestHeader('Host', 'accounts.google.com');
//	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	
	var data = null;
	
/*	xhr.open('POST','https://accounts.google.com/o/oauth2/token',oai.async);

	var data = [
		'code=', encodeURIComponent(oai.token.code),
		'&client_id=', encodeURIComponent(oai.auth.clientid),
		'&client_secret=', encodeURIComponent(oai.auth.secret),
		'&redirect_uri=', encodeURIComponent(oai.auth.redirect),
		'&grant_type=', encodeURIComponent('authorization_code'),
		'&timestamp=', Date.now()
	].join('');
	//	'&redirect_uri=', encodeURIComponent('http://localhost'),
*/
/*	
	var data = [
		'code=', oai.token.code,
		'&client_id=', oai.auth.clientid,
		'&client_secret=', oai.auth.secret,
		'&redirect_uri=', oai.auth.redirect,
	//	'&redirect_uri=', 'http://localhost',
		'&grant_type=authorization_code'
	].join('');
*/	
	xhr.send(data);
	
	oai.auth.exchangeXHR = xhr;
	
	return xhr;
};


oai.x_exchange = function() {
	var url = [
		'https://accounts.google.com/o/oauth2/token',
		'?code=', encodeURIComponent(oai.token.code),
		'&client_id=', encodeURIComponent(oai.auth.clientid),
		'&client_secret=', encodeURIComponent(oai.auth.secret),
		'&redirect_uri=', encodeURIComponent(oai.auth.redirect),
		'&grant_type=authorization_code'
	].join('');

	return oai.openWindow({url:url, name:'NoteSpaceOAuthExchange'});
};


oai.authorise = function() {
	// see https://developers.google.com/accounts/docs/OAuth2Login
	
	// received this access_token on first successful authorisation
	//		4/VhBWtl8ff4r6jsQ2ug6ehd-NrfEQ.cgiJvZ67N4gUgrKXntQAax3MYGuIcAI
	// needed the right responseType and scope parameters
	// result is on a page as an input field and in the document title
	// note: i have changed the state parameter
	//		url:	https://accounts.google.com/o/oauth2/approval?as=79b086f3080e6baa&hl=en&xsrfsign=APsBz4gAAAAAT_C4DRaA62axsvGTVhW2K0rf21UMa3G5
	//		head:	<title>Success state=NoteSpaceAuthorisationCode&code=4/VhBWtl8ff4r6jsQ2ug6ehd-NrfEQ</title>
	//		node:	<input
	//					id="code"
	//					type="text"
	//					readonly="readonly"
	//					value="4/VhBWtl8ff4r6jsQ2ug6ehd-NrfEQ.cgiJvZ67N4gUgrKXntQAax3MYGuIcAI"
	//					...
	//				>
	//
	// error has its own page too
	//		url:	https://accounts.google.com/o/oauth2/approval?as=6fa311be8ea18534&hl=en&xsrfsign=APsBz4gAAAAAT_DCZ-XN0DSrNSEz8Sh5tT4oQGqKiYAL
	//		head:	<title>Denied error=access_denied&amp;state=NoteSpaceAuthorisationCode</title>
	//		node:	<p id="access_denied">You denied access to the application.</p>

	var url = [
		oa.auth.requestURI,
		'?response_type=',oai.auth.responsetype,
		'&client_id=', oai.auth.clientid,
		'&redirect_uri=', oai.auth.redirect,
		'&scope=', encodeURIComponent(oai.auth.scope),
		'&state=NoteSpaceOAuthI'
	].join('');
	
	oai.permissionURL = url;
	
	return oa.openWindow({url:url, name:'NoteSpaceOAuthI'});
};


//------------------------------------------------------------
//------------------------------------------------------------
// Gapi Project: API Web App Project
//----------------------------------

btk.namespace('w.token', oa);
btk.namespace('w.auth', oa);

var oaw = oa.w;

oaw.robots = 'http://www.google.com/robots.txt'

// see http://code.google.com/chrome/extensions/webRequest.html
chrome.webRequest.onBeforeRequest.addListener(
	function(details) {
		console.log('gdrive@test: onBeforeRequest');
		console.log(details);
		// details.url has the goodies
		// ??? which to use
		//		chrome.tabs.remove(details.tabId);
		//		cancel:true
		//			requires "webRequestBlocking" permission in manifest
		//			required for redirect anyway!!!
		return {
		//	'cancel':true,
			'redirectUrl':chrome.extension.getURL('Blank.html')
		};
	},
	{	urls:[
			"http://example.com/oauth/blank.html*",
			"http://oauth.example.com/blank.html*",
			"http://www.google.com/robots.txt*"
		]
	},
	["blocking"]
);


// these should be set programatically
oaw.token.access = 'ya29.AHES6ZTX7ejMF661FG4O5haiBv3_BAQA3i0jCbsiE3BltHc';
oaw.token.type = 'Bearer';
oaw.token.expiration = '3600';

oaw.auth.api_key = 'AIzaSyB8NJH163gJC2kRYnX6xCMZqIMpOIMO-NQ';
oaw.auth.client_id = '774996004010.apps.googleusercontent.com';

oaw.auth.response_type = 'token';
oaw.auth.redirect_uri = 'http://example.com/oauth/blank.html';
//oaw.auth.redirect_uri = 'http://oauth.example.com/blank.html';
//oaw.auth.redirect_uri = oaw.robots;
oaw.auth.secret = '8wXIs1DdNTr4FRmsvgAQm_MH';
oaw.auth.email = '774996004010@developer.gserviceaccount.com';
oaw.auth.js_origin = 'https://localhost';

//	<input type="hidden" id="response-form-encoded" value="state=NoteSpaceOAuthW&amp;access_token=ya29.AHES6ZQ4dYmWcXBNx3A6JvdDvwHzfHwts6JrJlH5C3ODScU&amp;token_type=Bearer&amp;expires_in=3600">
// got the following
//
//	<input
//		type="hidden"
//		id="response-form-encoded"
//		value="
//			state=NoteSpaceOAuthW &amp;
//			access_token=ya29.AHES6ZSxBMTKDrAbPk1DlJC2FJl8WllTBoMz-eNqo14eeg &amp;
//			token_type=Bearer &amp;
//			expires_in=3600
//		"
//	>
//	<input
//		type="hidden"
//		id="relay-endpoint"
//		value="https://accounts.google.com/o/oauth2/postmessageRelay"
//	>
//
// but the page froze.

oaw.authorise = function() {
	var url = [
		oa.auth.requestURI,
		'?response_type=',oaw.auth.response_type,
		'&client_id=', oaw.auth.client_id,
		'&redirect_uri=', oaw.auth.redirect_uri,
	//	'&redirect_uri=postmessage',
			// don't know where it is to be posted to!
			// perhaps to itself!
			// that would make sense.
			// will need a content script to detect it
		'&origin=', document.location.origin,
			// the authorization page asked for origin
		'&scope=', encodeURIComponent(oa.auth.scope),
		'&state=NoteSpaceOAuthW'
	].join('');
	
	oaw.permissionURL = url;
	
	return oa.openWindow({url:url, name:'NoteSpaceOAuthW'});
};


//------------------------------------------------------------
//------------------------------------------------------------
window.addEventListener(
	'message',
	function(event) {
		console.log('oaw.onmessage');
		console.log(event);
	},
	false
);


chrome.extension.onConnect.addListener(function(port){
	console.log('oaw.onconnect');
	console.log(port);
	port.onMessage.addListener(function(msg){
		console.log('oaw.onmessage: line: ' + port.name);
		console.log('message');
	});
});


chrome.extension.onConnectExternal.addListener(function(port){
	console.log('oaw.onconnectExternal');
	console.log(port);
	port.onMessage.addListener(function(msg){
		console.log('oaw.onmessageExternal: line: ' + port.name);
		console.log('message');
	});
});



chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse){
		console.log('oaw.onRequest');
		console.log(request);
		console.log(sender);

		sendResponse({done:true});
	}
);


chrome.extension.onRequestExternal.addListener(
	function(request, sender, sendResponse){
		console.log('oaw.onRequestExternal');
		console.log(request);
		console.log(sender);

		sendResponse({done:true});
	}
);


//------------------------------------------------------------
//------------------------------------------------------------
// google-api javascript client
//
// does not work
//-----------------------------
/*
btk.namespace('gapi', btk);

var ga = btk.gapi;


gapi.auth.init(function() {
	gapi.client.setApiKey(oaw.auth.api_key);
});


// auth window hangs trying to connect to somewhere

ga.authorise = function () {
	gapi.auth.authorize({
		client_id: oaw.auth.client_id,
		scope: oa.auth.scope,
		immediate: false
	}, function(authResult){
		if (authResult && ~authResult.erro) {
			console.log('gdrive.gapi.authorise@test: all OK');
		} else {
			console.log('gdrive.gapi.authorise@test: something went wrong');
		}
	});
	console.log('gdrive.gapi.authorise@test: request sent');
};
*/

//------------------------------------------------------------
//------------------------------------------------------------

console.log('gdrive test module started');

var gd = btk.namespace('gdrive');

gd.baseURI = 'https://www.googleapis.com/drive/v2';


//------------------------------------------------------------
//------------------------------------------------------------
oa.go = function(command) {
	console.log('gdrive@test: start');
	
	delete oa.command;
	delete oa.url;
	delete oa.xhr;
	
	command = command || 'files';
	
	oa.command = command;
	
	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = oa.onreadystatechange;
	xhr.onabort = oa.onabort;
	xhr.onerror = oa.onerror;
	xhr.onloadstart = oa.onloadstart;
	xhr.onprogress = oa.onprogress;
	xhr.onload = oa.onload;
	xhr.onloadend = oa.onloadend;
	
	if (oa.test) {
		xhr.open('GET', oa.testfile, oa.async);
	} else {
		oa.url = oa.baseURI + '/' + command + '?key='+oa.auth.apikey;

		// auth parameters insufficient
		// xhr.open('GET', url, oa.async, 'alan.dennis.eaton@gmail.com', '31415926');
		
		xhr.open('GET', oa.url, oa.async);
		// don't know about this yet
		xhr.setRequestHeader("secret", oa.auth.secret);
	}
	
	xhr.responseType = oa.responsetype;
	
	// iff POST
	// xhr.setRequestHeader("Content-Type", "mime/type");
	// xhr.setRequestHeader("name", "value");
	
	oa.xhr = xhr;
	
	xhr.send(/* data iff POST */);
	
	console.log('gdrive@test: end');
};

oa.onreadystatechange = function(e) {
	console.info('gdrive@test: onreadystatechange: ' + this.readyState);
};
oa.onabort = function(e) { console.error('gdrive@test: onabort'); console.log(e);};
oa.onerror = function(e) { console.error('gdrive@test: onerror');  console.log(e);};
oa.onloadstart = function(e) { console.info('gdrive@test: onloadstart'); };
oa.onprogress = function(){ console.info('gdrive@test: onprogress'); };
oa.onload = function(e) {
	console.info('gdrive@test: onload');
};
oa.onloadend = function(e) {
	console.info('gdrive@test: onloadend: status = ' + this.status);
	oa.response = oa.xhr.response;
	//oa.xmldoc = oa.xhr.responseXML;

};


//------------------------------------------------------------
}});