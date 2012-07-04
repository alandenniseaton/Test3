
chrome.extension.sendRequest(
	{ 'oauthcatch':document.location.hash },
	function(response){
		window.close();
	}
);


oauthcatch = (function(){

	var log = [];
	
	
	var origin = document.location.origin;
	
	var broadcast = function(msg) {
		if (typeof(msg) !== 'string') {
			msg = {oauthcatch:{big:'input'}};
		}
		
		chrome.extension.sendRequest({oauthcatch:msg}, function(response){});
	};
	
	broadcast('oauthcatch: start');
	
	
	var message = function(msg) {
		broadcast(msg);
		log.push(msg);
	};
	
	
	var onmessage = function(event) {
		message('oauthcatch.onmessage');
		message(event);
	};
	
	
	window.addEventListener('message', onmessage, false);


	chrome.extension.onConnect.addListener(function(port){
		message('oauthcatch.onconnect');
		message(port);
		port.onMessage.addListener(function(msg){
			message('oauthcatch.onmessage: line: ' + port.name);
			message('message');
		});
	});


	chrome.extension.onRequest.addListener(
		function(request, sender, sendResponse){
			message('oauthcatch.onRequest');
			message(request);
			message(sender);

			sendResponse({done:true});
		}
	);


	return log;
})();



