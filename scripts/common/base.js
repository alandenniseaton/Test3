'use strict';

//============================================================
//	base@common :: Module
//
//	common stuff for the various pages
//
//============================================================


btk.define({
    name: 'link@common',
    load: true,
    init: function(libs, link) {

        var global = btk.global;
        var page = global.page;
	
        if (page && page.nolink) {
            btk.trigger.state('linked.yes');
            return;
        }
	
        var chrome = global.chrome;
	
        if (chrome && chrome.app && chrome.app.getDetails()) {
            // we are in the app
            link.bgp    = chrome.extension.getBackgroundPage();
            link.btk    = link.bgp.btk;
            link.bg     = link.btk.require('background@page');
            link.alarms = link.btk.require('alarms@page');
		
            btk.trigger.state('linked.yes');
        }
        else {
            btk.trigger.state('linked.no');
        }
    }
});


//============================================================
btk.define({
    name: 'unlinked@common',
    load: true,
    when: [
    'state::window.loaded',
    'state::linked.no'
    ],
    init: function(libs, exports) {
        // display unlink warning
	
        var doc = btk.document;
	
        var div = doc.createElement('div');
	
        div.setAttribute('style', [
            'position: absolute',
            'top: 0',
            'left: 0',
            'right: 0',
            'z-index: 1000',
            'text-align: center',
            'font-weight: bold',
            'background-color: #dd1100',
            'color: white',
            'padding: 1em 0em'
            ].join(';'));
	
        div.innerHTML = "<h1>Could not link to background page</h1>"
	
        doc.body.appendChild(div);
    }
});


//============================================================
btk.define({
    name: 'unload@common',
    init: function(libs, exports) {
        // manage unload operations
    }
});


//============================================================
btk.define({
    name: 'base@common',
    load: true,
    libs: {
        link: 'link@common',
        unload: 'unload@common'
    },
    when: [
    'state::window.loaded',
    'state::linked.yes'
    ],
    init: function(libs, exports) {

        //--------------------------------------------------------
        // imports

        //--------------------------------------------------------
        // other stuff

        var global = btk.global;

        global.page = btk.ifDefined(global.page, {});

        var page = global.page;

        page.bg = libs.link.bg;
        page.unload = libs.unload;
        page.link = libs.link;

        btk.trigger.state('document.loaded');

        btk.trigger.state('page.loaded');


        return page;

    //--------------------------------------------------------
    }
});