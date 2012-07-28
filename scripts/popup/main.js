
btk.define({
    name: 'main@page',
    load: true,
    libs: {
        btk: 'btk@btk'
    },
    when: [ 'state::document.loaded' ],
    
    init: function(libs) {
        
        var btk = libs.btk;
        
        var launch = page.bg.launch;
        var popup = page.bg.popup;
        var messages = page.link.alarms.showMessages;

        var entries = {
            'Test': {
                fn:launch
            },
            'Bookmarks-old-p': {
                fn:popup, 
                param:{
                    url:'Bookmarks-old.html',
                    width:850, 
                    height:800
                }
            },
            'Bookmarks-p': {
                fn:popup, 
                param:{
                    url:'Bookmarks.html',
                    width:850, 
                    height:800
                }
            },
            'Bookmarks': {
                fn:launch
            },
            'Messages': {
                fn:messages, 
                param:null
            },
            'Log': {
                fn:launch
            },
            'Topics': {
                fn:launch
            },
            'doc/btkdoc': {
                fn:launch
            },
            'Terminal': {
                fn:launch
            },
            'Scratch': {
                fn:launch
            },
            'Blank': {
                fn:launch
            },
            'XMLNote': {
                fn:launch
            },
            'Options': {
                fn:launch
            },
            'Options-p': {
                fn:popup.center, 
                param:{
                    url:'Options.html',
                    width:300, 
                    height:200
                }
            }
        };
    
    
        var processEntry = function(node) {
            var name = node.getAttribute('data-name');
            var entry = entries[name];
        
            console.log('processing entry: ' + name);
            
            entry.param = entry.param || name + '.html';
        
            node.addEventListener('click',function(){
                console.log('click: ', name);
                entry.fn(entry.param);
            },false);
        };
    
    
        var processEntries = function() {
            var nodes = btk.document.body.getElementsByClassName('link');
        
            console.log('processing entries');
            
            for(var i=0; i<nodes.length; i++) {
                processEntry(nodes[i]);
            }
            
            console.log(entries);
        };
    
        processEntries();
    }
});