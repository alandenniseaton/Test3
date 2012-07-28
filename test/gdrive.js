//============================================================
//	gdrive :: Module
//============================================================

// see http://www.html5rocks.com/en/tutorials/file/xhr2/
// see http://en.wikipedia.org/wiki/XMLHttpRequest

// search 'OAuthForDevices' in 'Checker Plus for GMail/background.html/common.js'

btk.define({
    name: 'gdrive@test',
    libs: {
        btk: 'btk@btk',
        ls: 'lstorage@btk'
    },
    when: [ 'state::page.loaded' ],
    init: function(libs, exports) {

        var btk = libs.btk;
        var ls = libs.ls;

        btk.appDetails = chrome.app.getDetails();


        //------------------------------------------------------------
        btk.xopenWindow = function(params) {
            if (typeof(params) === 'string') {
                params = {'url':params};
            }
            params = params || {};
	
            params.url = params.url || null;
            params.name = params.name || '';
            params.atts = params.atts || 'toolbar=0,scrollbars=0,menubar=0,resizable=0,width=700,height=500';
            //	params.atts = params.atts || 'toolbar=0,scrollbars=0,menubar=0,resizable=0,width=700,height=500,status=no';
	
            return window.open(params.url, params.name, params.atts);
        };

        btk.openWindow = function(params) {
            if (typeof(params) === 'string') {
                params = {'url':params};
            }
            params = params || {};
	
            btk.object.safeMixin(params, btk.openWindow.defaultParams);
            
            chrome.windows.create({
                'url': params.url,
                'width':params.width,
                'height':params.height,
                'type':'popup'
            });
        };
        btk.openWindow.defaultParams = {
            'url':'blank://',
            'width':700,
            'height':500,
            'type':'popup'
        };


        btk.reminders = [
        "",
        "consider what happens when the authorisation",
        "window is contained in an I-Frame",
        ""
        ];

        btk.showReminders = function(newState) {
	
            if (newState !== 'active') return null;
	
            var w = btk.xopenWindow({
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
        //btk.showReminders('active');


        //------------------------------------------------------------
        //------------------------------------------------------------
        btk.xhr = function(params) {
            params = params || {};

            var defaults = btk.xhr.defaultParams;
    
            for (var key in defaults) {
                params[key] = params[key] || defaults[key];
            }
    
            params.info.fname = params.info.fname || defaults.info.fname;
            params.info.desc = params.info.desc || defaults.info.desc;
    
            if (params.parseType) {
                if (params.parseType !== 'json') {
                    params.responseType = params.parseType;
                }
            }
            
            btk.xhr.execute(params);
        };
        btk.xhr.defaultParams = {
            'method':'GET',
            'url':'http://example.com',
            'options':{},
            'head':{},
            'body':'',
            'responseType':'',
            'parseType':'',
            'async': true,
            'on':{},
            'info':{
                'fname':'xhr',
                'desc': "the xhr response"
            }
        };


        btk.xhr.objectToOptionString = function(object) {
            object = object || {};
    
            if (typeof(object) === 'string') return object;
    
            var sobject = [];

            for(var k in object) {
                sobject.push(k + '=' + encodeURIComponent(object[k]));
            }

            return sobject.join('&');
        };


        btk.xhr.optionStringToObject = function(options) {
            var regex = /([^&=]+)=([^&]*)/g;
            var params = {};
            var m;
    
            m = regex.exec(options);
            while (m) {
                params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
                m = regex.exec(options);
            }
            
            return params;
        };


        btk.xhr.objectToForm = function(object) {
            object = object || {};
    
            if (typeof(object) === 'string') return object;
    
            if (object instanceof XMLDocument) return object;
    
            var fobject = new FormData();

            for(var k in object) {
                fobject.append(k,object[k]);
            }
    
            return fobject;
        }


        btk.xhr.parseResponse = function(xhr, request) {
            var response = {};
    
            if (request.parseType == 'json') {
                try {
                    response.body = JSON.parse(xhr.response);
                } catch(e) {
                }
            }
    
            else if (request.parseType == 'text') {
                response.body = xhr.responseText;
            }
    
            else if (request.parseType == 'xml') {
                if (xhr.responseXML) {
                    response.body = xhr.responseXML;
                }
            }
    
            if (!response.body) {
                response.body = xhr.response;
            }
            
            response.head = {};
            
            var head = xhr.getAllResponseHeaders().split('\n');
            var j,k,v;
            var len = head.length;
            for (var i=0; i<len; i++) {
                j = head[i].indexOf(':');
                k = head[i].substr(0, j);
                v = xhr.getResponseHeader(k);
                if (btk.isDefined(v)) {
                    response.head[k] = v;
                }
            }
            
            response.status = xhr.status;
            
            return response;
        }


        // NOTE this function assumes its parameters are correct
        btk.xhr.execute = function(request) {
            var xhr = new XMLHttpRequest();

            var info = btk.object.mixin({}, request.info);
    
            info.request = request;
            info.response = {};
            info.xhr = xhr;
    
            xhr.onreadystatechange = function(){
                console.log(info.fname + ': onreadystatechange:' + this.readyState);
		
                if (this.readyState == 4 ) {
                    info.response = btk.xhr.parseResponse(this, request);
                    info.output = info.response.body;
                    console.log(info);
            
                    if (this.status == 200 ) {
                        console.log('success getting ' + info.desc);
                        if (request.callback) {
                            request.callback(info)
                        }
                    } else {
                        console.log('received error (' + this.status + ') getting ' + info.desc);
                        if (request.on[this.status]) {
                            request.on[this.status](info);
                        }
                    }
                }
            };

            var options = btk.xhr.objectToOptionString(request.options);
    
            var url = request.url;
    
            if (options) {
                url = url + '?' + options;
            }
            info.url = url;
    
            xhr.open(request.method, url, request.async);
    
            for(var key in request.head) {
                xhr.setRequestHeader(key, request.head[key]);
            }
    
            xhr.responseType = request.responseType;
            
            xhr.send(request.body);
        };


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
        oa.auth.scopes = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
    
        //'https://docs.google.com/feeds/',
        //'https://docs.googleusercontent.com/',
        //'https://spreadsheets.google.com/feeds/',
    
        //'https://www.googleapis.com/auth/drive.file'    // per file access
        'https://www.googleapis.com/auth/drive'       // gives FULL access
        ];
        oa.auth.scope = oa.auth.scopes.join(' ');

        //oa.auth.scope = 'https://www.google.com/m8/feeds';

        oa.auth.validateURI = 'https://www.googleapis.com/oauth2/v1/tokeninfo';
        oa.auth.userinfoURI = 'https://www.googleapis.com/oauth2/v1/userinfo';


        //------------------------------------------------------------
        oa.testfile = 'notes.txt';
        oa.async = true;
        oa.parseType = '';
        //oa.parseType = 'text';
        //oa.parseType = 'arraybuffer';
        //oa.parseType = 'blob';
        //oa.parseType = 'document';


        oa.test = true;


        //------------------------------------------------------------
        //------------------------------------------------------------
        oa.userinfo = function(token) {
            token = token || oaw.token;
            token.type = token.type || 'Bearer';
	
            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function(e){
                console.log('gdrive.oa.userinfo@test: onreadystatechange:', xhr.readyState);
		
                if (xhr.readyState == 4 ) {
                    if (xhr.status == 200 ) {
                        console.log('success processing the token');
                        console.log(JSON.parse(xhr.response));
                
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
        window.addEventListener(
            'message',
            function(event) {
                console.log('oa.onmessage');
                console.log(event);
            },
            false
            );


        chrome.extension.onConnect.addListener(function(port){
            console.log('oa.onconnect');
            console.log(port);
            port.onMessage.addListener(function(msg){
                console.log('oa.onmessage: line: ' + port.name);
                console.log('message');
            });
        });


        chrome.extension.onConnectExternal.addListener(function(port){
            console.log('oa.onconnectExternal');
            console.log(port);
            port.onMessage.addListener(function(msg){
                console.log('oa.onmessageExternal: line: ' + port.name);
                console.log('message');
            });
        });



        chrome.extension.onRequest.addListener(
            function(request, sender, sendResponse){
                console.log('oa.onRequest');
                console.log(request);
                console.log(sender);

                sendResponse({
                    done:true
                });
            }
            );


        chrome.extension.onRequestExternal.addListener(
            function(request, sender, sendResponse){
                console.log('oa.onRequestExternal');
                console.log(request);
                console.log(sender);

                sendResponse({
                    done:true
                });
            }
            );


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

        oai.auth.parseType = 'code';
        oai.auth.apikey = 'AIzaSyBWDSteALEpuET94Wd_Eb57bcDXrHTWA7s';
        oai.auth.clientid = '569863883099.apps.googleusercontent.com';
        oai.auth.secret = 'jaQXfOko5-JFINsDnN96sJIZ';
        oai.auth.redirect = 'urn:ietf:wg:oauth:2.0:oob';


        oai.lsm = new ls.Manager('oauth.i');

        oai.token = oai.lsm.getset('token',oai.token);


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

            return oai.openWindow({
                url:url, 
                name:'NoteSpaceOAuthExchange'
            });
        };


        oai.authorise = function() {
            // see https://developers.google.com/accounts/docs/OAuth2Login
	
            // received this access_token on first successful authorisation
            //		4/VhBWtl8ff4r6jsQ2ug6ehd-NrfEQ.cgiJvZ67N4gUgrKXntQAax3MYGuIcAI
            // needed the right parseType and scope parameters
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

            var options = {
                'response_type':oai.auth.parseType,
                'client_id':oai.auth.clientid,
                'redirect_uri':oai.auth.redirect,
                'scope':oa.auth.scope,
                'state':'NoteSpaceOAuthI'
            };
            var url = oa.auth.requestURI + '?' + btk.xhr.objectToOptionString(options);
	
            oai.permissionURL = url;
	
            return btk.openWindow({
                url:url, 
                name:'NoteSpaceOAuthI'
            });
        };


        btk.global.oa = oa;
        btk.global.oai = oai;


        //------------------------------------------------------------
        //------------------------------------------------------------
        // Gapi Project: API Web App Project
        // client-side
        //----------------------------------

        btk.namespace('w.token', oa);
        btk.namespace('w.auth', oa);

        var oaw = oa.w;

        oaw.robots = 'http://www.google.com/robots.txt'

        // these should be set programatically
        oaw.token.access = 'ya29.AHES6ZRJbde7siJHBNhk_WUHYNIv5zbm9st1es_k-5d17_g';
        oaw.token.type = 'Bearer';
        oaw.token.start = 1341448460862.478;
        oaw.token.duration = '3600';  // seconds
        oaw.token.end = 1341452060862.478;

        oaw.auth.api_key = 'AIzaSyB8NJH163gJC2kRYnX6xCMZqIMpOIMO-NQ';
        oaw.auth.client_id = '774996004010.apps.googleusercontent.com';

        oaw.auth.response_type = 'token';
        oaw.auth.redirect_uri = 'http://example.com/oauth/blank.html';
        //oaw.auth.redirect_uri = 'http://oauth.example.com/blank.html';
        //oaw.auth.redirect_uri = oaw.robots;
        oaw.auth.secret = '8wXIs1DdNTr4FRmsvgAQm_MH';
        oaw.auth.email = '774996004010@developer.gserviceaccount.com';
        oaw.auth.js_origin = document.location.origin;


        oaw.lsm = new ls.Manager('oauth');

        oaw.token = oaw.lsm.getset('token',oaw.token);


        oaw.parse_response = function(url) {
            console.log('gdrive@test: oaw.parse_response: ' + url);
        
            var hash = url.substring(url.indexOf('#')+1);
            var params = btk.xhr.optionStringToObject(hash);
            
            oaw.token.error = params.error;
            
            oaw.token.access = params.access_token || oaw.token.access;
            oaw.token.type = params.token_type || oaw.token.type;
            oaw.token.duration = params.expires_in || oaw.token.duration;
            oaw.token.state = params.state || oaw.token.state;

            console.log(params);
            console.log(oaw.token);
        };


        // see http://code.google.com/chrome/extensions/webRequest.html
        chrome.webRequest.onBeforeRequest.addListener(
            function(details) {
                console.log('gdrive@test: onBeforeRequest');
                console.log(details);
        
                var redirect = 'oauth2/Success.html';
                
                // details.url has the goodies
                oaw.parse_response(details.url);
                
                if (oaw.token.error) {
                    redirect = 'oauth2/Failure.html';
                    
                } else {
                    oaw.token.start = details.timeStamp;
                    oaw.token.end = oaw.token.start + oaw.token.duration*1000;
                    
                    oaw.lsm.set('token', oaw.token);
                }
                
                return {
                    //	'cancel':true,
                    'redirectUrl':chrome.extension.getURL(redirect)
                };
            },
            {
                urls:[ "http://example.com/oauth/blank.html*" ]
                },
            ["blocking"]
            );


        oaw.authorise = function(force) {
            var optionString = btk.xhr.objectToOptionString({
                'response_type':oaw.auth.response_type,
                'client_id':oaw.auth.client_id,
                'redirect_uri': oaw.auth.redirect_uri,
                //'redirect_uri':'postmessage',
                // don't know where it is to be posted to!
                // perhaps to itself!
                // that would make sense.
                // will need a content script to detect it
                'origin':document.location.origin,
                // the authorization page asked for origin
                'scope':oa.auth.scope,
                'approval_prompt':force?'force':'auto',
                //'approval_prompt':'auto', //default: the user does not get prompted unless scope has changed
                'state':'NoteSpaceOAuthW'
            });
            
            oaw.authorise.ilaunch(optionString);
        };
        
        oaw.authorise.wlaunch = function(options) {
            var url = oa.auth.requestURI + '?' + options;
            
            oaw.permissionURL = url;
	
            btk.openWindow({'url':url});
        };
        
        oaw.authorise.ilaunch = function(options) {
            var url = 'oauth2/Initiate.html' + '?' + options;
            
            var id = 'oauth2Initiator';
            var iframe = btk.document.getElementById(id);
            
            if (!iframe) {
                iframe = btk.document.createElement('iframe');
                iframe.id = id;
                //iframe.style.display = 'none';
                btk.document.body.appendChild(iframe);
            }
            
            iframe.src = url;
        };
        

        oaw.validate = function(token) {
            token = token || oaw.token;
            token.type = token.type || 'Bearer';
	
            var url = [
            oa.auth.validateURI,
            '?access_token=', encodeURIComponent(oaw.token.access)
            ].join('');
	
            oaw.validateURL = url;
	
            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function(e){
                console.log('gdrive.oaw.validate@test: onreadystatechange:', xhr.readyState);
		
                if (xhr.readyState == 4 ) {
                    if (xhr.status == 200 ) {
                        console.log('success validating the token');
                        oaw.auth.validationResponse = JSON.parse(xhr.response || '{}');
                        // should check .audience = my client id
                        oaw.lsm.set('validation',oaw.auth.validationResponse);
				
                    } else if (xhr.status == 400) {
                        console.log('received error (400) validating the token');
                        oaw.auth.validationResponse = JSON.parse(xhr.response || '{}');
				
                    } else {
                        console.log('received error (' + xhr.status + ') validating the token');
                        oaw.auth.validationResponse = JSON.parse(xhr.response || '{}');
                    }
                }
            };
	
            xhr.open('GET',oaw.validateURL,oa.async);
    
            xhr.send();
	
            oaw.xhr = xhr;
	
            return xhr;
        };


        btk.global.oaw = oaw;


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
        gd.uploadURI = 'https://www.googleapis.com/upload/drive/v2/files';
        gd.updateURI = gd.uploadURI;
        //the documentation has the following URI for update
        //the documentation is WRONG
        //gd.updateURI = 'https://www.googleapis.com/upload/drive/files/v2';

        gd.scopes = oa.auth.scopes;
        gd.token = oaw.token;

        gd.authorise = oaw.authorise;
        gd.validate = oaw.validate;

        gd.expired = function() {
            return gd.token.end < Date.now();
        };

        gd.remaining = function() {
            return (gd.token.end - Date.now())/1000;
        };
        
        
        //------------------------------------------------------------
        gd.apicall = function(params) {
            var defaults = gd.apicall.defaultParams;
    
            for(var key in defaults) {
                params[key] = params[key] || defaults[key];
            }
            params.info.fname = 'gdrive.' + (params.info.fname || defaults.info.fname) + '@test';
            params.info.desc = params.info.desc || defaults.info.desc;
    
            params.head['Authorization'] = params.token.type + ' ' + params.token.access;
    
            if (params.jbody) {
                try {
                    params.body = JSON.stringify(params.jbody);
                    params.head['content-type'] = 'application/json';
                } catch (e) {}
            }
    
            if (!params.url) {
                if (params.upload) {
                    params.url = gd.uploadURI;
                    if (params.method !== 'POST') {
                        // making sure it is correct
                        params.method = 'PUT';
                    }
                } else {
                    params.url = gd.baseURI + '/' + params.apimode;
                }

                if (params.qualifier) {
                    params.url = params.url + '/' + params.qualifier;
                }
            }
    
            btk.xhr(params)
        }
        gd.apicall.defaultParams = {
            'method':'GET',
            'apimode':'files',
            'qualifier':'',
            'upload':false,
            'options':{},
            'head':{},
            'body':'',
            'parseType':'json',
            'async': true,
            'token':gd.token,
            'info':{
                'fname':'apicall',
                'desc':'the apicall info'
            },
            'callback':function(info) {
                gd.apicall.info = info;
            }
        };

        gd.apiget = function(params) {
            params.method = 'GET';
            gd.apicall(params);
        }

        gd.apipost = function(params) {
            params.method = 'POST';
            gd.apicall(params);
        }

        gd.apiput = function(params) {
            params.method = 'PUT';
            gd.apicall(params);
        }

        gd.apidelete = function(params) {
            params.method = 'DELETE';
            gd.apicall(params);
        }



        //------------------------------------------------------------
        // umongst other things, returns the root folder id
        gd.about = function(callback, on) {
            gd.apiget({
                'apimode':'about',
                'callback':callback,
                'on':on,
                'info':{
                    'fname':'about',
                    'desc':'the about information'
                }
            });
        }


        // run this AFTER gd.about
        gd.setRoot = function(callback) {
            gd.root = {};
            gd.about(function(info) {
                gd.root.about = info.output;
                gd.root.id = info.output.rootFolderId;
                gd.children.list(gd.root.id, function(info) {
                    gd.root.children = info.output.items;
                    if (callback) {
                        callback(gd.root);
                    }
                });
            });
        };


        //------------------------------------------------------------
        gd.files = {};

        gd.files.list = function(params, callback, on){
            params = params || {};

            /*
            params.maxResults = params.maxResults || 50;

            if (params.next) {
                delete params.next;
                if (gd.files.list.output) {
                    params.pageToken = gd.files.list.output.nextPageToken;
                }
            }

            if (params.projection !== 'FULL') {
                params.projection = 'BASIC';
            }
            */
            gd.apiget({
                'options':params,
                'callback':callback,
                'on':on,
                'info':{
                    'fname':'files.list',
                    'desc':'the file list'
                }
            });
        };


        // get the metadata for a particular file
        gd.files.get = function(params, callback, on) {
            if (typeof(params) === 'string') {
                params = {
                    'fileId':params
                };
            }
            params = params || {};
    
            if (!params.fileId) {
                console.log('gdrive.files.get@test: expected fileId');
                return;
            }
    
            var fileId = params.fileId;
            delete params.fileId;
            /*
            if (params.projection !== 'FULL') {
                params.projection = 'BASIC';
            }
            */
            gd.apiget({
                'qualifier':fileId,
                'options':params,
                'callback':callback,
                'on':on,
                'info':{
                    'fname':'files.get',
                    'desc':'the file metadata'
                }
            });
        };


        gd.util = {};

        gd.util.moveField = function(field, from, to) {
            if (from[field]) {
                to[field] = from[field];
                delete from[field];
            }
        };


        gd.files.insert = function(params, callback, on) {
            if (typeof(params) === 'string') {
                params = {
                    'title':params,
                    'mimeType':'text/plain'
                };
            }
            params = params || {};
    
            var jbody = {
                'kind':'drive#file'
            };

            gd.util.moveField('title', params, jbody);
            gd.util.moveField('description', params, jbody);
            gd.util.moveField('mimeType', params, jbody);
    

            //need to do more work to set these up
            //gd.util.moveField('parents', params, jbody)
    
            gd.apipost({
                'options':params,
                'jbody':jbody,
                'callback':callback,
                'on':on,
                'info':{
                    'fname':'files.insert',
                    'desc':'the insert response'
                }
            });
        };


        gd.files.insertFolder = function(params, callback, on) {
            if (typeof(params) === 'string') {
                params = {
                    'title':params
                };
            }
            params = params || {};
    
            params.mimeType = 'application/vnd.google-apps.folder';
    
            gd.files.insert(params, callback, on);
        };


        //------------------------------------------------------------
        gd.children = {};

        gd.children.list = function(params, callback, on) {
            if (typeof(params) === 'string') {
                params = {
                    'folderId':params
                };
            }
            params = params || {};
    
            if (!params.folderId) {
                console.log('gdrive.children.list@test: expected folderId');
                return;
            }
    
            var folderId = params.folderId;
    
            delete params.folderId;
    
            if (params.next) {
                delete params.next;
                if (gd.children.list.output) {
                    params.pageToken = gd.children.list.output.nextPageToken;
                }
            }

            gd.apiget({
                'qualifier':folderId + '/children',
                'options':params,
                'callback':callback,
                'on':on,
                'info':{
                    'fname':'children.list',
                    'desc':'the children'
                }
            });
        };


        // only gets the drive#childReference
        // that is just one of the entries returned by gd.children
        // .childLink is the link to the corresponding entry in gd.list
        gd.children.get = function(folderId, childId, callback, on) {
            if (!folderId) {
                console.log('gdrive.children.get@test: expected folderId');
                return;
            }
    
            if (!childId) {
                console.log('gdrive.children.get@test: expected childId');
                return;
            }
    
            gd.apiget({
                'qualifier':folderId + '/children/' + childId,
                'callback':callback,
                'on':on,
                'info':{
                    'fname':'children.get',
                    'desc':'the child'
                }
            });
        };


        //------------------------------------------------------------
        btk.global.gd = gd;


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
	
            xhr.parseType = oa.parseType;
	
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
        oa.onabort = function(e) {
            console.error('gdrive@test: onabort');
            console.log(e);
        };
        oa.onerror = function(e) {
            console.error('gdrive@test: onerror');
            console.log(e);
        };
        oa.onloadstart = function(e) {
            console.info('gdrive@test: onloadstart');
        };
        oa.onprogress = function(){
            console.info('gdrive@test: onprogress');
        };
        oa.onload = function(e) {
            console.info('gdrive@test: onload');
        };
        oa.onloadend = function(e) {
            console.info('gdrive@test: onloadend: status = ' + this.status);
            oa.response = oa.xhr.response;
            //oa.xmldoc = oa.xhr.responseXML;
        };


    //------------------------------------------------------------
    }
});