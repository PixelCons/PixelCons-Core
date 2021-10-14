(function () {
	angular.module('App')
		.service('similarities', similarities);

	similarities.$inject = ['$q', '$timeout'];
	function similarities($q, $timeout) {
		const _enabled = true;
		
		// Setup functions
		this.getMatch = getMatch;
		this.appendMatch = appendMatch;
		this.searchSimilar = searchSimilar;
		
		
		///////////////
		// Functions //
		///////////////
		
		
		// Searches for a close match to the given pixelconId
		function getMatch(pixelconId, allPixelcons) {
			if(!_enabled) return null;
			
			//search
			let pixelconIndex = null;
			let pixelconCreator = null;
			let pixelcon = findPixelcon(pixelconId, allPixelcons);
			if(pixelcon) {
				pixelconIndex = pixelcon.index;
				pixelconCreator = pixelcon.creator;
			}
			return findEarliesetCloseMatch(pixelconId, pixelconIndex, pixelconCreator, allPixelcons);
		}
		
		// Appends match data to the given pixelcons
		function appendMatch(pixelcons, allPixelcons) {
			if(!_enabled) return;
			
			//search
			for(let i=0; i<pixelcons.length; i++) {
				pixelcons[i].match = getMatch(pixelcons[i].id, allPixelcons);
			}
		}
		
		// Searches for similar pixelcons
		function searchSimilar(pixelconId, allPixelcons) {
			if(!_enabled) return null;
			
			//search
			let pixelcon = findPixelcon(pixelconId, allPixelcons);
			if(pixelcon) {
				let closeMatch = findEarliesetCloseMatch(pixelcon.id, pixelcon.index, pixelcon.creator, allPixelcons);
				let similar = findSimilar(pixelcon.id, allPixelcons);
				
				let similarCreator = [];
				let similarOther = [];
				for(let i=0; i<similar.length; i++) {
					if(similar[i].id != pixelconId) {
						if(pixelcon.creator == similar[i].creator) similarCreator.push(similar[i]);
						else similarOther.push(similar[i]);
					}
				}
				
				return {
					pixelcon: pixelcon,
					closeMatch: closeMatch,
					similarCreator: similarCreator,
					similarOther: similarOther
				}
			}
			return null;
		}
		
		
		////////////////
		// Algorithms //
		////////////////
		
		
		//Returns all pixelcons that are similar to the given pixelcon
		function findSimilar(pixelconId, allPixelcons) {
			let similar = [];
			for(let i=0; i<allPixelcons.length; i++) {
				if(checkSimilar(pixelconId, allPixelcons[i].id)) {
					similar.push({
						id: allPixelcons[i].id,
						index: i,
						creator: allPixelcons[i].creator
					});
				}
			}
			return similar;
		}
		
		//Returns the earliest close match to the given pixelcon
		function findEarliesetCloseMatch(pixelconId, pixelconIndex, pixelconCreator, allPixelcons) {
			if(pixelconIndex === null) pixelconIndex = allPixelcons.length;
			
			let ids = rotateMirrorTranslate(pixelconId);
			for(let i=0; i<pixelconIndex; i++) {
				if(checkCloseMatch(ids, allPixelcons[i].id) && (!pixelconCreator || pixelconCreator != allPixelcons[i].creator)) {
					return {
						id: allPixelcons[i].id,
						index: i,
						creator: allPixelcons[i].creator
					}
				}
			}
			return null;
		}
		
		//Checks if the given ids are similar
		function checkSimilar(id1, id2) {
			let ids = rotateMirrorTranslate(id1);
			for(let i=0; i<ids.length; i++) {
				let tolerance = 8;
				if(i != 0) tolerance = tolerance/2;
				
				let delta = 0;
				for(let j=2; j<ids[i].length; j++) {
					delta += getColorDistance(ids[i][j], id2[j]);
				}
				if(delta <= tolerance) return true;
			}
			return false;
		}
		
		//Checks if the given ids are a close match
		function checkCloseMatch(ids, otherId) {
			for(let i=0; i<ids.length; i++) {
				let colorsCount = Math.max(countColors(ids[i]), countColors(otherId));
				
				let tolerance = colorsCount*0.6;
				if(i != 0) tolerance = tolerance/2;
				if(colorsCount < 4) tolerance = tolerance/2;
				if(colorsCount < 3) tolerance = tolerance/3;
				
				let delta = 0;
				for(let j=2; j<ids[i].length; j++) {
					delta += getColorDistance(ids[i][j], otherId[j]);
				}
				if(delta <= tolerance) return true;
			}
			return false;
		}
		
		
		///////////
		// Utils //
		///////////
		
		
		//Returns matching pixelcon
		function findPixelcon(pixelconId, allPixelcons) {
			for(let i=0; i<allPixelcons.length; i++) {
				if(allPixelcons[i].id == pixelconId) {
					return {
						id: allPixelcons[i].id,
						index: i,
						creator: allPixelcons[i].creator
					}
				}
			}
			return null;
		}
		
		//Returns a list of similar ids that were 
		function rotateMirrorTranslate(pixelconId) {
			let id = pixelconId.substr(2,64);
			let ids = ['0x' + id];
			
			//rotate
			let rotatedId = id;
			for(let i=0; i<4; i++) {
				rotatedId = rotate(rotatedId);
				if(ids.indexOf('0x' + rotatedId) < 0) ids.push('0x' + rotatedId);
			}
			
			//mirror
			let mirrorId = id;
			mirrorId = mirror(id, true);
			if(ids.indexOf('0x' + mirrorId) < 0) ids.push('0x' + mirrorId);
			mirrorId = mirror(id, false);
			if(ids.indexOf('0x' + mirrorId) < 0) ids.push('0x' + mirrorId);
			
			//translate
			let translateId = id;
			translateId = translate(id, 0, 1);
			if(ids.indexOf('0x' + translateId) < 0) ids.push('0x' + translateId);
			translateId = translate(id, 1, 1);
			if(ids.indexOf('0x' + translateId) < 0) ids.push('0x' + translateId);
			translateId = translate(id, 1, 0);
			if(ids.indexOf('0x' + translateId) < 0) ids.push('0x' + translateId);
			translateId = translate(id, 0, -1);
			if(ids.indexOf('0x' + translateId) < 0) ids.push('0x' + translateId);
			translateId = translate(id, -1, -1);
			if(ids.indexOf('0x' + translateId) < 0) ids.push('0x' + translateId);
			translateId = translate(id, -1, 0);
			if(ids.indexOf('0x' + translateId) < 0) ids.push('0x' + translateId);
			
			return ids;
		}
		
		//Rotates the id clockwise
		function rotate(id) {
			id = id.split('');
			let rId = '0000000000000000000000000000000000000000000000000000000000000000'.split('');
			for(let x=0; x<8; x++) {
				for(let y=0; y<8; y++) {
					rId[x*8 + (7-y)] = id[y*8 + x];
				}
			}
			return rId.join('');
		}
		
		//Mirrors the id on the given axis
		function mirror(id, xAxis) {
			id = id.split('');
			let rId = '0000000000000000000000000000000000000000000000000000000000000000'.split('');
			for(let x=0; x<8; x++) {
				for(let y=0; y<8; y++) {
					if(xAxis) rId[x*8 + y] = id[(7-x)*8 + y];
					else rId[x*8 + y] = id[x*8 + (7-y)];
				}
			}
			return rId.join('');
		}
		
		//Translates the id by the given vaues
		function translate(id, tx, ty) {
			id = id.split('');
			let rId = '0000000000000000000000000000000000000000000000000000000000000000'.split('');
			for(let x=0; x<8; x++) {
				for(let y=0; y<8; y++) {
					let nx = (x + 8 + tx) % 8;
					let ny = (y + 8 + ty) % 8;
					rId[nx*8 + ny] = id[x*8 + y];
				}
			}
			return rId.join('');
		}
		
		//Returns the number of colors
		function countColors(id) {
			let count = 0;
			let found = [];
			for(let i=0; i<id.length; i++) {
				if(id[i] != '0' && id[i] != 'x' && found.indexOf(id[i]) < 0) {
					found.push(id[i]);
					count++;
				}
			}
			return count;
		}
		
		//Gets the distance [0-1.0] between two color hex values
		const colorPalette = {
			'0': [0,0,0],		//#000000
			'1': [29,43,83],	//#1D2B53
			'2': [126,37,83],	//#7E2553
			'3': [0,135,81],	//#008751
			'4': [171,82,54],	//#AB5236
			'5': [95,87,79],	//#5F574F
			'6': [194,195,195],	//#C2C3C7
			'7': [255,241,232],	//#FFF1E8
			'8': [255,0,77],	//#FF004D
			'9': [255,163,0],	//#FFA300
			'a': [255,255,39],	//#FFFF27
			'b': [0,231,86],	//#00E756
			'c': [41,173,255],	//#29ADFF
			'd': [131,118,156],	//#83769C
			'e': [255,119,168],	//#FF77A8
			'f': [255,204,170],	//#FFCCAA
		}
		function getColorDistance(c1, c2) {
			let distance = Math.abs(colorPalette[c1][0] - colorPalette[c2][0]) + Math.abs(colorPalette[c1][1] - colorPalette[c2][1]) + Math.abs(colorPalette[c1][2] - colorPalette[c2][2]);
			return distance/(255*3);
		}

	}
}());
