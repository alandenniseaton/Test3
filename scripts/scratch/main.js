'use strict';


btk.define.library.path(
    'page',
    btk.require.library.path('scripts') + 'scratch/'
);


btk.define({
    name: 'test@page',
    load: true,
    libs: {
        gdrive: 'gdrive@test',
        server: 'server@test',
        idb: 'idb@util'
    },
    css : [ 'base@wtk', 'style@page' ],
    when: [ 'state::page.loaded' ],
    init: function(libs) {
        var x = {};
					
        x.doc = [
        "BlobBuilder = WebKitBlobBuilder",
        "URL = webkitURL",
        ];

        x.idb = libs.idb;
        
        x.appId = chrome.app.getDetails().id
        x.ei = chrome.i18n.getMessage('@@extension_id');
        // same as appId
        x.BlobBuilder = WebKitBlobBuilder;
        x.URL = webkitURL;
        x.output = document.querySelector('#output');
					
        x.html_h = [
        '<html>',
        '  <head>',
        '    <link rel="stylesheet" type="text/css" href="'
        + 'chrome-extension://'
        + x.appId
        + '/lib/wtk/scroll-plain.css">',
        '  </head>',
        '  <body class="scroll-plain">'
        ].join('\n');
						
        x.html_t = [
        '  </body>',
        '</html>'
        ].join('\n');
					
        x.create = function(n) {
					
            x.reset();
						
            n = btk.ifNumber(n, 0);
						
            if (n < 0) {
                n = 0;
            }
            if (n > 1) {
                n = 1;
            }
						
            if (n === 0) {
                x.html = [
                x.html_h,
                'hello there world',
                x.html_t
                ].join('\n');
            }
            else if (n === 1) {
                x.html = [
                x.html_h,
                '    <pre>',
                document.querySelector('#plaintext').textContent,
                '    </pre>',
                x.html_t
                ].join('\n');
            }
						
            x.bb = new x.BlobBuilder();
            x.bb.append(x.html);
						
            x.b = x.bb.getBlob('text/html');
						
            x.url = x.URL.createObjectURL(x.b);
						
            x.i = document.createElement('iframe');
            x.i.setAttribute('style', 'width: 50%;');
            x.i.src = x.url;
						
            x.created = true;
						
            return x;
        };
					
        x.append = function(n) {
            if (!!x.appended) {
                console.error('already appended');
                return x;
            }
						
            if (!x.created) {
                console.info('needed to create first');
                x.create(n);
            }
						
            if (!!x.output && !!x.i) {
                x.j = x.output.appendChild(x.i);
                x.appended = true;
            }
						
            return x;
        };
					
        x.reset = function() {
            if (!!x.appended && !!x.output && !!x.i) {
                x.output.removeChild(x.i);
							
                delete x.appended;
            }
						
            if (!!x.created) {
                delete x.j;
                delete x.i;
							
                if (!!x.url) {
                    x.URL.revokeObjectURL(x.url);
                }
                delete x.url;
							
                delete x.b;
                delete x.bb;
							
                delete x.html;
							
                delete x.created;
            }
						
            return x;
        };
					
        btk.global.x = x;
					
					
        // deferred messages
        var y = {};
					
        y.doc = "a message queue implemented using window.postMessage";
					
        // in practice and for security, should not expose q and key
        y.q = [];
					
        y.key = 'defer:' + Date.now();
					
        y.origin = btk.document.location.origin;
        y.source = btk.global;
        y.target = btk.global;
					
        y.send = function send(data) {
            this.q.push(data);
            window.postMessage(this.key, this.origin);
            return this;
        };
					
        y.receive = function receive(event) {
            if (event.data !== this.key) {
                return;
            }
						
            if (event.origin !== this.origin) {
                return;
            }
						
            if (event.source !== this.source) {
                return;
            }
						
            if (this.running) {
                if (this.q.length > 0) {
                    console.log(event);
                    console.log(this.q.shift());
                } else {
                    // short q
                    // how did that happen?
                    console.error('short q!!!');
                }
            } else {
                // just consume the message
                // so that things do not get out of sync
                this.q.shift();
            }
        };
					
        y.breceive = y.receive.bind(y);
					
        y.start = function start() {
            if (!this.running) {
                this.target.addEventListener('message', this.breceive, false);
                this.running = true;
            }
        };
					
        y.stop = function end() {
            if (this.running) {
                this.running = false;
                this.target.removeEventListener('message', this.breceive);
            }
        };
					
        y.reset = function reset() {
            this.stop();
            this.q = [];
        };
					
        x.y = y;
					
        y.start();
					

        var z = {};
					
        z.input  = document.querySelector('#fileinput1');
        z.output = document.querySelector('#fileoutput1');
					
        z.input.onchange = function(e){
            var files = this.files;
            var out = document.createElement('span');
            var detail = [];
            var fields;
						
            detail.push('<ul>');
            for (var i = 0, f; i < files.length; i++) {
                detail.push('<li>');
                f = files[i];
                ff = Object.keys(f);
                detail.push('<ul>');
                for (var j=0; j<ff.length; j++) {
                    detail.push('<li>');
                    detail.push(ff[j] + ': ');
                    detail.push('<span style="color:purple;">');
                    detail.push(f[ff[j]]);
                    detail.push('</span>');
                    detail.push('</li>');
                }
                detail.push('</ul>');
                detail.push('</li>');
            }
            detail.push('</ul>');
						
            out.innerHTML = detail.join('');
            z.output.appendChild(out);
        };
					
        x.z = z;
					
					
        return x;
    }
});

