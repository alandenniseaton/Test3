'use strict';

btk.define({
name: 'log@util',
libs: { ml: 'ml@util' },
when: [ 'state::page.loaded' ],
init: function(libs, exports) {

	var MessageLog = libs.ml;

	//-------------------------------------------------------------
	var views = document.querySelectorAll('.log');
	
	exports._logs = [];
	
	for (var i=0, view; view = views[i]; i++) {
		exports[view.dataset.name] = new MessageLog(view);
		exports._logs.push(exports[view.dataset.name])
	}
	
	exports.clear = function clear() {
		for (var i=0, log; log=exports._logs[i]; i++) {
			log.clear();
		}
	};
	
	exports.indent = '<span style="padding-left:2em"></span>';
	
}
});
