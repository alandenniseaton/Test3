'use strict';

var onload = function() {
    console.log('oauth2/response.js//onload');
    
    var optionStringToObject = function(options) {
        var regex = /([^&=]+)=([^&]*)/g;
        var object = {};
        var m;

        m = regex.exec(options);
        while (m) {
            object[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
            m = regex.exec(options);
        }

        return object;
    };


    var search = window.location.search.substring(1);
    
    var params = optionStringToObject(search);
    params.timestamp = Number(params.timestamp || Date.now());
    console.log('params');
    console.log(params);


    console.log('oauth2/response.js//onload: parsing response');

    var hash = window.location.hash.substring(1);
    
    var response = optionStringToObject(hash);
    console.log('response');
    console.log(response);

    var token = {};

    token.error = response.error;
    token.access = response.access_token || '';
    token.type = response.token_type || '';
    token.duration = response.expires_in || 0;
    token.state = response.state || '';

    token.start = params.timestamp;
    token.end = token.start + token.duration*1000;

    console.log('token');
    console.log(token);
    
    
    console.log('oauth2/response.js//onload: broadcasting token')
    
    var id = chrome.runtime.id;
        
    var msg = {
        'type': 'OAuth2.Authorisation.Token',
        'id': id,
        'origin': window.location.origin,
        'path': window.location.pathname,
        'token': token
    };

    console.log(msg);
    chrome.extension.sendMessage(id, msg);


    var state = document.getElementById('state');
    if (token.error) {
        state.innerText = 'Failure: ' + token.error;
    }
    else {
        state.innerText = 'Success'
    }
};


window.addEventListener('DOMContentLoaded', onload);
