'use strict';

//-----------------------------------------------------------------
// widgets to manage display and coordination
//-----------------------------------------------------------------
btk.define({
name: 'widgets@bookmarks',
load: true,
libs: {
	de : 'element@wtk',
	Timer: 'timer@btk',
	menu: 'menu@wtk',
	DSManager: 'dsManager@util'
},
css : [ 'base@wtk', 'scroll-plain@wtk' ],
when: [ 'state::page.loaded' ],
init: function(libs, exports) {

	var DSManager  = libs.DSManager;
	
	var de = libs.de;
	
	var Timer = libs.Timer;
	
	var doc = btk.document;
	
	
	//-------------------------------------------------------------
	
	var action = {};
	
	action.addtagtofilter = function() {
		error('addtagtofilter not implemented yet');
	};
	
	action.doedit = function(id) {
		error('doedit not implemented yet');
	};
	
	action.dorestore = function(id) {
		error('dorestore not implemented yet');
	};
	
	action.dodelete = function(id) {
		error('dodelete not implemented yet');
	};
	
	
	//-------------------------------------------------------------
	// generic error handler
	
	var error = function(msg) {
		if (error.timer) {
			error.timer.stop();
		}
		
		var node = de('div').create();
		node.innerHTML = msg;
		
		error.output.appendChild(node);
		error.output.classList.remove('hidden');
		
		error.timer = new Timer(
			function(){
				error.output.innerHTML = '';
				error.output.classList.add('hidden');
				
				delete error.timer;
			},
			error.timeout
		);
		
		error.timer.start();
	}
	exports.error = error;
	
	error.output = de('span').id('error').klass('hidden').create();
	
	error.timeout = 5*Timer.SECOND;

	doc.body.appendChild(error.output);
	
	
	//-------------------------------------------------------------
	// widget to view a data space element timestamp
	
	function Timestamp(dselement) {
		Timestamp.SUPERCLASS.call(this, 'span');
		
		this._dse = dselement;
		
		this.klass('timestamp')
			.title(this.detail())
			.child(this.timestamp(this._dse.getElement().updated))
		;
	}
	btk.inherits(Timestamp, de.dElement);
	
	(function(p){
	
		p.className = 'Timestamp';

		function pad(t) {
			if (t < 10) { return '0' + t; }
			return t.toString();
		}
		
		p.timestamp = function(time) {
			var date = new Date(time);
			return [
				date.getFullYear(),
				'.',
				pad(date.getMonth()+1),
				'.',
				pad(date.getDate()),
				' at ',
				pad(date.getHours()),
				':',
				pad(date.getMinutes())
			].join('');
		}
		
		p.detail = function() {
			return [
				'Updated: ' + this.timestamp(this._dse.getElement().updated),
				'Created: ' + this.timestamp(this._dse.getElement().created)
			].join('\n');
		};
		
	}(Timestamp.prototype));
	
	
	//-------------------------------------------------------------
	// widget to view a data space element action button
	
	function ActionButton(dselement) {
		ActionButton.SUPERCLASS.call(this);
		
		this.klass('below').klass('left')
			.button()
				.title('actions')
			.end()
			.menu()
				.child(
					dselement.hasTagName('@dead')
					? de('wmitem')
						.label('restore')
						.action(function(e) {
							action.dorestore(dselement.id);
						})
					: de('wmitem')
						.label('edit')
						.action(function(e) {
							action.doedit(dselement.id);
						})
				)
				.item(
					'delete',
					function(e){
						action.dodelete(dselement.id);
					}
				)
			.end()
		;
	}
	btk.inherits(ActionButton, de.widgets.wmbox);
	
	(function(p){
	
		p.className = 'ActionButton';

	}(ActionButton.prototype));
	
	
	//-------------------------------------------------------------
	// widget to view a data space element
	
	function DSEView(dselement) {
		DSEView.SUPERCLASS.call(this, 'div');
		
		this._dse = dselement;
		
		this.build();
	}
	btk.inherits(DSEView, de.widgets.wvpage);
	
	(function(p){
	
		p.className = 'DSEView';

		p.buildLink = function(link) {
			return de('a')
				.klass('item')
				.att('href', link)
				.att('target', '_new')
				.child(link)
			;
		};
		
		p.buildLinks = function() {
			var links = this._dse.getLink();
			var links = btk.ifArray(links, links?[links]:[]);
			
			var element = de('div').klass('link');

			var first = true;
			links.forEach(function(link){
				if (first) {
					first = false;
				} else {
					element.child(de('br'));
				}
				element.child(this.buildLink(link));
			}, this);
			
			return element;
		};
		
		p.buildHeadBody = function() {
			this.head().body()
				.start('div')
					.klass('title')
					.child(this._dse.getTitle() || '*** no title ***')
				.end()
				.child(this.buildLinks())
			.end().end();
		};
		
		p.buildHeadRight = function() {
			this.head().right()
				.child(new Timestamp(this._dse))
				.child(new ActionButton(this._dse))
			.end().end();
		};
		
		p.buildHead = function() {
			this.head('whpage').end();
			
			this.buildHeadBody();
			this.buildHeadRight();
		};
		
		p.buildBodyJSON = function() {
			this.body()
				.klass('data')
				.klass('mono')
				.klass('scroll-plain')
				.child(JSON.stringify(this._dse.getData(), null, 4))
			.end();
		};
		
		p.buildBodyText = function() {
			var data = this._dse.getData();
			if (btk.isArray(data)) {
				data = data.join('\n');
			}
			
			this.body()
				.klass('data')
				.klass('scroll-plain')
				.child(data)
			.end();
		};
		
		p.buildBody = function() {
			if (this._dse.hasTagName('@json')) {
				return this.buildBodyJSON();
			} else {
				return this.buildBodyText();
			}
			
			// will probably require some other formats
		};
		
		p.buildFoot = function() {
			var dsm = this._dse.dsm;
			var tags = this._dse.getTags();
			
			var tagnames = tags.map(function(id, i, a){
				return dsm.tagIdToName(id);
			});
			
			this.foot()
				.klass('tags')
				.klass('mono')
				.child(tagnames.join(' '))
			.end();
		};
		
		p.build = function() {
			this.klass('dataelement');
			
			var toid = this._dse.dsm.tagmapName;
			
			if (this._dse.hasTagName('@dead')) {
				this.klass('dead');
			}
			
			this.buildHead();
			this.buildBody();
			this.buildFoot();
		};
		
	}(DSEView.prototype));
	
	
	de.widgets.wdseview = DSEView;

	exports.DSEView = DSEView;

	
	//-------------------------------------------------------------
	function DSView(dsmanager) {
	}

	exports.DSView = DSView;
	
	
	//-------------------------------------------------------------
	function TagItem(tagName) {
		TagItem.SUPERCLASS.call(this, 'div');
		
		this.klass('tagitem')
			.child(tagName)
			.on('click', action.addtagtofilter)
		;
	}
	btk.inherits(TagItem, de.dElement);

	(function(p){
	
		p.className = 'DSEView';
	}(TagItem.prototype));
	
	
	de.widgets.wtagitem = TagItem;
	
	exports.TagItem = TagItem;
	
	
	//-------------------------------------------------------------
	
}	//end init
})	// end define