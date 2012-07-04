'use strict';

//-----------------------------------------------------------------
// widgets to manage display and coordination
//-----------------------------------------------------------------
btk.define({
name: 'widgets@bookmarks',
load: true,
libs: {
	de : 'element@wtk',
	dom : 'dom@btk',
	Timer: 'timer@btk',
	menu: 'menu@wtk',
	DSManager: 'dsManager@util'
},
css : [ 'base@wtk', 'box@wtk', 'scroll-plain@wtk' ],
init: function(libs, exports) {

	var DSManager  = libs.DSManager;
	
	var de = libs.de;
	
	var dom = libs.dom;
	var stopEvent = dom.stopEvent;
	
	var Timer = libs.Timer;
	
	var namespace = btk.namespace;
	
	var doc = btk.document;
	
	var g = btk.global;
	
	g.page = btk.ifDefined(g.page, {});
	
	
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
	page.error = error;
	
	error.output = de('span').id('error').klass('hidden').create();
	
	error.timeout = 5*Timer.SECOND;

	doc.body.appendChild(error.output);
	
	
	//-------------------------------------------------------------
	// actions (for button clicks etc)
	
	namespace('view', page);
	namespace('action', page);
	
	var action = page.action;
	
	action.dseEdit = function(id, e) {
		error('dseEdit('+id+') not implemented yet');
	};
	
	action.dseRestore = function(id, e) {
		page.view.datalist.removeChild(page.view.getDSElement(id));
		
		var dsm = page.model.dsm;
		
		dsm.getElement(id).chain([
		
			function(result) {
				this.dse = result.value;
				return dsm.removeElementFromTag(this.dse, '@@@dead');
			},
			
			function(result) {
				return dsm.addElementToTag(this.dse, '@@@live');
			}
			
		], {} );
		
	};
	
	action.dseDelete = function(id, e) {
		page.view.datalist.removeChild(page.view.getDSElement(id));
		
		var dsm = page.model.dsm;
		
		dsm.getElement(id).then(
			function(result) {
				var dse = result.value;
				
				if (dse.hasTagName('@@@dead')) {
					console.log('action.dseDelete: full delete: ' + dse.getId());
					return dsm.removeElement(dse);
				}
				
				return dsm.removeElementFromTag(dse, '@@@live').then(
					function() {
						console.log('action.dseDelete: move to @@@dead: ' + dse.getId());
						return dsm.addElementToTag(dse, '@@@dead');
					}
				)
			}	
		).then({
		
			'ok': function(result) {
				console.log('action.dseDelete: ok');
				console.log(result);
			},
			
			'error': function(result) {
				console.log('action.dseDelete: error');
				console.log(result);
				error(result.data);
			},
			
			'default': function(result) {
				console.log('action.dseDelete: default');
				console.log(result);
			}
			
		});
		
	};
	
	action.dseSelect = function(id, e) {
		var dse = page.view.getDSElement(id);
		if (dse) {
			dse.classList.toggle('selected');
		}
	};
	
	
	action.saveall = function(e) {
		error('saveall not implemented yet');
	};
	
	action.newdselement = function(e) {
		error('newdselement not implemented yet');
	};
	
	action.showtags = function(e) {
		page.view.button.showtags.classList.add('hidden');
		page.view.button.hidetags.classList.remove('hidden');
		page.view.datalist.classList.toggle('hidetags');
	};
	
	action.hidetags = function(e) {
		page.view.button.hidetags.classList.add('hidden');
		page.view.button.showtags.classList.remove('hidden');
		page.view.datalist.classList.toggle('hidetags');
	};
	
	action.showdead = function(e) {
		page.view.button.showdead.classList.add('hidden');
		page.control.taglist.select('@@@dead');
		
		page.view.button.showlive.classList.remove('hidden');
		page.control.taglist.deselect('@@@live');
	};
	
	action.showlive = function(e) {
		page.view.button.showlive.classList.add('hidden');
		page.control.taglist.select('@@@live');
		
		page.view.button.showdead.classList.remove('hidden');
		page.control.taglist.deselect('@@@dead');
	};
	
	action.transfer = function(e) {
		error('transfer not implemented yet');
	};
	
	
	exports.action = action;
	
	//-------------------------------------------------------------
	// data space element timestamp
	
	function Timestamp(dselement) {
		Timestamp.SUPERCLASS.call(this, 'div');
		
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
	// data space element action button
	
	function ActionButton(dselement) {
		ActionButton.SUPERCLASS.call(this);
		
		var dseid = dselement.getId();
		
		this.klass('below').klass('left')
			.menu()
				.child(
					dselement.hasTagName('@@@dead')
					? de('wmitem')
						.label('restore')
						.action(function(e) {
							stopEvent(e);
							action.dseRestore(dseid, e);
						})
					: de('wmitem')
						.label('edit')
						.action(function(e) {
							stopEvent(e);
							action.dseEdit(dseid, e);
						})
						.disable(dselement.hasTagName('@noedit'))
				)
				.item(
					'delete',
					function(e) {
						stopEvent(e);
						action.dseDelete(dseid, e);
					},
					dselement.hasTagName('@nodelete')
				)
			.end()
		;
	}
	btk.inherits(ActionButton, de.widgets.wmbox);
	
	(function(p){
	
		p.className = 'ActionButton';

	}(ActionButton.prototype));
	
	
	//-------------------------------------------------------------
	// dataspace element view
	
	function DSEView(dselement) {
		DSEView.SUPERCLASS.call(this);
		
		this._dse = dselement;
		
		this.build();
	}
	btk.inherits(DSEView, de.widgets.wvpage);
	
	(function(p){
	
		p.className = 'DSEView';

		p.buildLink = function(link) {
			return de('a')
				.klass('link')
				.att('href', link)
				.att('target', '_new')
				.child(link)
			;
		};
		
		p.buildLinks = function() {
			var links = this._dse.getLink();
			var links = btk.ifArray(links, links?[links]:[]);
			
			if (links.length === 0) {
				return null;
			}
			
			var children = [];

			links.forEach(function(link){
				children.push(this.buildLink(link));
			}, this);
			
			return children;
		};
		
		p.buildBanner = function() {
			this.head('wvpage')
				.klass('banner')
				.head('whpage')
					.klass('titlebar')
					.body()
						.klass('title')
						.child(this._dse.getTitle() || '*** no title ***')
					.end()
					.right()
						.klass('controls')
						.klass('box')
						.klass('align-center')
						.child(new Timestamp(this._dse))
						.child(new ActionButton(this._dse))
					.end()
				.end()
			.end();
			
			var links = this.buildLinks();
			if (links) {
				this.head()
					.body()
						.klass('links')
						.children(links)
					.end();
			}
		};
		
		p.buildContentJSON = function() {
			this.body()
				.klass('scroll-plain')
				.klass('data')
				.klass('json')
				.child(JSON.stringify(this._dse.getData(), null, 4))
			.end();
		};
		
		p.buildContentCode = function() {
			var data = this._dse.getData();
			if (btk.isArray(data)) {
				data = data.join('\n');
			}
			
			this.body()
				.klass('scroll-plain')
				.klass('data')
				.klass('code')
				.child(data)
			.end();
		};
		
		p.buildContentHTML = function() {
			var data = this._dse.getData();
			if (btk.isArray(data)) {
				data = data.join('');
			}
			
			var div = de('div').create();
			div.innerHTML = data;
			
			this.body()
				.klass('scroll-plain')
				.klass('data')
				.klass('html')
				.child(div)
			.end();
		};
		
		p.buildContentText = function() {
			var data = this._dse.getData();
			if (btk.isArray(data)) {
				var content = [];
				for (var i=0; i < data.length; i++) {
					content.push(data[i]);
					content.push(de('br'));
				}
				content.pop();
			} else {
				var content = [data];
			}
			
			this.body()
				.klass('scroll-plain')
				.klass('data')
				.klass('text')
				.children(content)
			.end();
		};
		
		p.buildContent = function() {
			if (this._dse.hasTagName('@@tag')) {
				this.buildContentJSON();
				
			} else if (this._dse.hasTagName('@json')) {
				this.buildContentJSON();
				
			} else if (this._dse.hasTagName('@code')) {
				this.buildContentJSON();
				
			} else if (this._dse.hasTagName('@html')) {
				this.buildContentHTML();
				
			} else {
				this.buildContentText();
			}
			
			// will probably require some other formats
			
			var dseid = this._dse.getId();
			
			this.body()
				.on('dblclick', function(e){
					console.log('dblclick dse: ' + dseid.toString());
					stopEvent(e);
					action.dseEdit(dseid, e);
					console.log(e);
				})
			;
		};
		
		p.buildTagList = function() {
			var dsm = this._dse.dsm;
			var tags = this._dse.getTags();
			
			var tagnames = tags.map(function(id, i, a){
				return dsm.tagIdToName(id);
			}).sort();
			
			this.foot()
				.klass('taglist')
			//	.klass('mono')
				.child(tagnames.join(' '))
			.end();
		};
		
		p.build = function() {
			var dseid = this._dse.getId();
			
			this.klass('wdseview')
				.att('data-dseid', dseid.toString())
				.on('click', function(e){
				//	if (e.target === this) {
						// NOTE: this does not work
						//srcElement
						//toElement
						//fromElement
					if (e.target.tagName !== 'A') {
						console.log('click dse: ' + dseid.toString());
						stopEvent(e);
						action.dseSelect(dseid, e);
						console.log(e);
					}
				})
			;
			
			if (this._dse.hasTagName('@@system')) {
				this.klass('system');
			} else {
				this.klass('user');
			}
			
			if (this._dse.hasTagName('@@@live')) {
				this.klass('live');
			}
			
			if (this._dse.hasTagName('@@@dead')) {
				this.klass('dead');
			}
			
			if (this._dse.hasTagName('@@tag')) {
				this.klass('tag');
			}
			
			this.buildBanner();
			this.buildContent();
			this.buildTagList();
		};
		
	}(DSEView.prototype));
	
	
	de.widgets.wdseview = DSEView;

	exports.DSEView = DSEView;

	
	//-------------------------------------------------------------
	// dataspace tag view
	function DSTView(tagName, id) {
		DSTView.SUPERCLASS.call(this, 'div');
		
		this.klass('wdstview')
			.att('data-dseid', id.toString())
			.child(tagName)
			.on('click', function(e){
				stopEvent(e);
				page.control.taglist.toggle(id);
			})
		;
	}
	btk.inherits(DSTView, de.dElement);

	(function(p){
	
		p.className = 'DSTView';
		
	}(DSTView.prototype));
	
	
	de.widgets.wdstview = DSTView;
	
	exports.DSTView = DSTView;
	
	
	//-------------------------------------------------------------
	// dataspace taglist view
	function DSTLView() {
		DSTLView.SUPERCLASS.call(this, 'div');
		
		this.setList(de('div').klass('view'));
		
		this.klass('wdstlview')
			.start('div')
				.klass('viewport')
				.klass('scroll-plain')
				.child(this.getList())
			.end()
		;
	}
	btk.inherits(DSTLView, de.dElement);

	(function(p){
	
		p.className = 'DSTLView';

		p.getList = function() {
			return this.getElement('list');
		};
		
		p.setList = function(list) {
			return this.setElement('list', list);
		};
		
		p.list = function() {
			return this.selectElement('list');
		};
		
	}(DSTLView.prototype));

	
	de.widgets.wdstlview = DSTLView;
	
	exports.DSTLView = DSTLView;
	
	
	//-------------------------------------------------------------
	// dataspace view
	function DSView() {
		DSView.SUPERCLASS.call(this, 'div');

		this.setList(de('div').klass('view'));
		
		this.klass('wdsview')
			.start('div')
				.klass('viewport')
				.klass('scroll-plain')
				.child(this.getList())
			.end()
		;
	}
	btk.inherits(DSView, de.dElement);

	(function(p){
	
		p.className = 'DSView';
		
		p.getList = function() {
			return this.getElement('list');
		};
		
		p.setList = function(list) {
			return this.setElement('list', list);
		};
		
		p.list = function() {
			return this.selectElement('list');
		};
		
	}(DSView.prototype));

	
	de.widgets.wdsview = DSView;
	
	exports.DSView = DSView;
	
	
	//-------------------------------------------------------------
	// dataspace control view
	function DSCVButton(id, title, label) {
		return de('button')
			.att('data-widgetid', id)
			.title(title)
			.on('click', action[id])
			.child(label)
		;
	}
	
	function DSCVButtons() {
		return [
			DSCVButton('saveall', 'Save any changes', 'save').klass('hidden'),
			DSCVButton('newdselement', 'Add a new bookmark', 'new'),
			DSCVButton('showtags', 'show the bookmark tags', 'tags on'),
			DSCVButton('hidetags', 'hide the bookmark tags', 'tags off').klass('hidden'),
			DSCVButton('showdead', 'Show the bookmarks that have been deleted', 'trash'),
			DSCVButton('showlive', 'Show the active bookmarks', 'live').klass('hidden'),
			DSCVButton('transfer', 'Upload or download the bookmarks', 'transfer')
		];
	}
		
	function DSCView() {
		DSCView.SUPERCLASS.call(this);

		this.klass('wdscview')
			.klass('controlbar')
			.att('data-widgetid', 'controlbar')
			.body('whpage')
				.klass('filter')
				.att('data-widgetid', 'filter')
				.left()
					.att('data-widgetid', 'filter-label')
					.klass('label')
					.child('Filter')
				.end()
				.body()
					.klass('input')
					.start('input')
						.att('data-widgetid', 'filter-input')
						.type('text')
						.on('change', function(e) {
							stopEvent(e);
							page.control.filter.refresh();
						})
					.end()
				.end()
			.end()
			.right()
				.children(DSCVButtons())
			.end()
		;
	}
	btk.inherits(DSCView, de.widgets.whpage);

	(function(p){
	
		p.className = 'DSCView';
		
	}(DSCView.prototype));

	
	de.widgets.wdscview = DSCView;
	
	exports.DSCView = DSCView;
	
	
	//-------------------------------------------------------------
	// dataspace manager view
	function DSMView() {
		DSMView.SUPERCLASS.call(this);
		
		this.klass('wdsmview')
			.klass('root')
			.att('data-widgetid','root')
			.head('wdscview').end()
			.body('whpage')
				.left('wdstlview').end()
				.body('wdsview').end()
			.end()
		;
		
		this.setControl(this.getHead());
		
		this.setTagList(this.getBody().getLeft().getList());
		this.setDataList(this.getBody().getBody().getList());
		
		this.getDataList().klass('hidetags').end();
	}
	btk.inherits(DSMView, de.widgets.wvpage);

	(function(p){
	
		p.className = 'DSMView';
		
		p.getControl = function() {
			return this.getElement('control');
		};
		
		p.setControl = function(control) {
			return this.setElement('control', control);
		};
		
		p.control = function() {
			return this.selectElement('control');
		};
		
		p.getTagList = function() {
			return this.getElement('taglist');
		};
		
		p.setTagList = function(taglist) {
			return this.setElement('taglist', taglist);
		};
		
		p.taglist = function() {
			return this.selectElement('taglist');
		};
		
		p.getDataList = function() {
			return this.getElement('datalist');
		};
		
		p.setDataList = function(datalist) {
			return this.setElement('datalist', datalist);
		};
		
		p.datalist = function() {
			return this.selectElement('datalist');
		};
		
	}(DSMView.prototype));

	
	de.widgets.wdsmview = DSMView;
	
	exports.DSMView = DSMView;
	
	
	//-------------------------------------------------------------
	
}	//end init
})	// end define