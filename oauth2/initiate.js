'use strict';

var authorise = (function(){
    var accountsURI = 'https://accounts.google.com/';
    var serviceURI = accountsURI + 'ServiceLogin';
    var requestURI = accountsURI + 'o/oauth2/auth';

    var search = document.location.search;
    var targetURL = requestURI + search;

    var currentTabId;

    var onerroroccurred = function(details) {
        console.log('oauth2/Initiate.html/onerroroccurred');
        console.log(details);

        if (details.tabId == currentTabId) {
            console.log('oauth2/Initiate.html/onerroroccurred: tab ids agree');
            console.log('oauth2/Initiate.html/onerroroccurred: navigating away');
            /*
            //redirects the tab to the target URL
            chrome.tabs.update(currentTabId,{
                'url': targetURL
            });
            */
            // creates a completely new window
            chrome.windows.create({
                'url': details.url,
                'width':700,
                'height':500,
                'type':'popup'
            });
            // close the original window
            window.close();
        }
    };

    chrome.webRequest.onErrorOccurred.addListener(
        onerroroccurred,
        { 'urls':[accountsURI + '*'] }
    );

    var startAuthorisation = function(tabDetails) {
        console.log('oauth2/Initiate.html: startAuthorisation');

        currentTabId = tabDetails.id;

        var iframe = document.getElementById('oauth2');

        iframe.src = targetURL;
    };

    var authorise = function() {
        console.log('oauth2/Initiate.html: authorise');

        chrome.tabs.getCurrent(startAuthorisation);
    };
    
    return authorise;
})();

window.addEventListener('DOMContentLoaded', authorise);
