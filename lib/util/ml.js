'use strict';

btk.define({
name: 'ml@util',
init: function(libs, exports) {

	function MessageLog(output) {
		this.output = output || btk.document.body;
	}

	(function(p){
		var doc = btk.document;
		var createElement = doc.createElement.bind(doc);
		
		p.msg = function(text, colour) {
			colour = colour || this.colour || 'black';
			
			var div = createElement('div');
			
			div.setAttribute('style', 'color:' + colour);
			div.innerHTML = text;
			
			this.output.appendChild(div);
		};
		
		p.line = function() {
			var hr = createElement('hr');
			this.output.appendChild(hr);
		};
		
		p.error = function(text) {
			this.msg(text, 'red');
		};
	
		p.clear = function() {
			this.output.innerHTML = '';
		};
		
	}(MessageLog.prototype));

	return MessageLog;
}
});
