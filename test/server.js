'use strict';

//============================================================
//
// an experimental page server.
//
// serves tld domain local

console.log('server@test: defined');
        
btk.define({
    name: 'server@test',
    load: true,
    libs: {
        btk: 'btk@btk'
    },
    when: [ 'state::document.loaded' ],
    
    init: function(libs, exports) {
        
        console.log('server@test: started');
        
        var URL = window.URL || window.webkitURL;
        
        var glob = '*://*.local/*';


        var getPageURL = function(requestURL) {
            console.log('server@test/getPageURL: ' + requestURL);
            
            var page = [
                //'<!DOCTYPE html>',
                '<html>',
                '<head>',
                '<title>Generated page</title>',
                '</head>',
                '<body>',
                requestURL,
                '</body>',
                '</html>',
            ];
            
            var b = new Blob(page, {type:'text/html'});
            
            //var url = URL.createObjectURL(b);
            var url = [
                chrome.extension.getURL('Redirect.html'),
                '#',
                URL.createObjectURL(b)
            ].join('');
            
            return url;
        };

        
        chrome.webRequest.onBeforeRequest.addListener(
            function(details) {
                console.log('server@test/onBeforeRequest');
                console.log(details);
        
                var redirect = getPageURL(details.url);
                
                console.log('server@test/onBeforeRequest: redirecting to: ' + redirect);
                return { 'redirectUrl':redirect };
            },
            {
                'urls':[ glob ]
            },
            ["blocking"]
        );
    }
});
