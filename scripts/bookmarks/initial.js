'use strict';

//-----------------------------------------------------------------
//
// Establish the initial state of the data space.
//
//-----------------------------------------------------------------
btk.define({
name: 'initial@bookmarks',
init: function(libs, exports) {

	// the initial state of the data space.
	//
	var initial = {
		//system elements
		"0": {
			"title": "system",
			"created": Date.now(),
			"updated": Date.now(),
			"data": {
				// data space parameters
				"name": "Bookmarks",
				"tagmapid": 1,
				"nextid": 100,
			},
			"tags": [10,20,22,30,31,32]
		},
		
		"1": {
			"title": "Tag Map",
			"created": Date.now(),
			"updated": Date.now(),
			"data": {
				"@@@live": 10,
				"@@@dead": 11,
				
				"@@system": 20,
				"@@tag": 21,
				"@json": 22,
				"@html": 23,
				"@code": 24,
				
				"@noview": 30,
				"@noedit": 31,
				"@nodelete": 32,
			},
			"tags": [10,20,22,30,31,32]
		},
		
		// system tags
		"10": {
			"title": "@@@live",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"11": {
			"title": "@@@dead",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [],
			"tags": [10,20,21,30,31,32]
		},
		
		"20": {
			"title": "@@system",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"21": {
			"title": "@@tag",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"22": {
			"title": "@json",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"23": {
			"title": "@html",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [],
			"tags": [10,20,21,30,31,32]
		},
		
		"24": {
			"title": "@code",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [],
			"tags": [10,20,21,30,31,32]
		},
		
		"30": {
			"title": "@noview",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"31": {
			"title": "@noedit",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		},
		
		"32": {
			"title": "@nodelete",
			"created": Date.now(),
			"updated": Date.now(),
			"data": [0,1,10,11,20,21,22,23,24,30,31,32],
			"tags": [10,20,21,30,31,32]
		}
	};

	//-------------------------------------------------------------
	
	return initial;
	
}	//end init
})	// end define