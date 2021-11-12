(function () {
	angular.module('App')
		.service('similarities', similarities);

	similarities.$inject = ['$q', '$timeout'];
	function similarities($q, $timeout) {
		const _enabled = true;
		
		// Setup functions
		this.isEnabled = isEnabled;
		this.getMatch = getMatch;
		this.searchSimilar = searchSimilar;
		
		// Data
		var data_allPixelconIds = null;
		var data_allPixelconCreators = null;
		var data_creatorsList = null;
		
		
		///////////////
		// Functions //
		///////////////
		
		
		// Gets if the similarity checks are enabled
		function isEnabled() {
			return _enabled;
		}
		
		// Searches for a close match to the given pixelconId
		function getMatch(pixelconId, allPixelcons) {
			if(!_enabled) return null;
			updateAllPixelconData(allPixelcons);
			
			//generate array for id
			let pixelconIdArray = new Uint8Array(64);
			for(let i=0; i<64; i++) pixelconIdArray[i] = convertHexCode(pixelconId.charCodeAt(i+2));
			
			//get search parameters
			let pixelconIndex = allPixelcons.length;
			let pixelconCreator = -1;
			let pixelcon = findPixelcon(pixelconId, allPixelcons);
			if(pixelcon) {
				pixelconIndex = pixelcon.index;
				pixelconCreator = data_creatorsList.indexOf(pixelcon.creator);
			}
			
			//search
			let match = findCloseMatch(pixelconIdArray, pixelconIndex, pixelconCreator, data_allPixelconIds, data_allPixelconCreators);
			if(match > -1) {
				let matchLevel = rankMatchLevel(pixelconIdArray, subId(data_allPixelconIds, match*64));
				return {
					id: allPixelcons[match].id,
					index: match,
					creator: allPixelcons[match].creator,
					verified: (!!pixelcon && pixelcon.creator == allPixelcons[match].creator),
					level: matchLevel
				}
			}
			return null;
		}
		
		// Searches for similar pixelcons
		function searchSimilar(pixelconId, allPixelcons) {
			if(!_enabled) return null;
			updateAllPixelconData(allPixelcons);
			
			//search
			let pixelcon = findPixelcon(pixelconId, allPixelcons);
			if(pixelcon) {
				let closeMatch = getMatch(pixelconId, allPixelcons);
				
				//search similar
				const maxResults = 50;
				let resultsArray = new Int32Array(maxResults);
				let pixelconIdArray = new Uint8Array(64);
				for(let i=0; i<64; i++) pixelconIdArray[i] = convertHexCode(pixelconId.charCodeAt(i+2));
				findSimilar(pixelconIdArray, data_allPixelconIds, allPixelcons.length, resultsArray, maxResults);
				
				//parse results
				let similarCreator = [];
				let similarOther = [];
				for(let i=0; i<maxResults; i++) {
					if(resultsArray[i] > -1) {
						let similar = {
							id: allPixelcons[resultsArray[i]].id,
							index: resultsArray[i],
							creator: allPixelcons[resultsArray[i]].creator
						}
						if(similar.id != pixelconId) {
							if(pixelcon.creator == similar.creator) similarCreator.push(similar);
							else similarOther.push(similar);
						}
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
		
		//Returns subarray based on length
		function subId(array, index) {
			return array.subarray(index, index+64);
		}
		
		//Updates stored data based on given pixelcon data
		function updateAllPixelconData(allPixelcons) {
			if(!data_allPixelconIds || !data_allPixelconCreators || (allPixelcons.length*64) > data_allPixelconIds.byteLength) {
				data_allPixelconIds = new Uint8Array(allPixelcons.length*64);
				for(let i=0; i<allPixelcons.length; i++) {
					for(let j=0; j<64; j++) {
						data_allPixelconIds[i*64 + j] = convertHexCode(allPixelcons[i].id.charCodeAt(j+2));
					}
				}
				
				data_creatorsList = [];
				data_allPixelconCreators = new Uint16Array(allPixelcons.length);
				for(let i=0; i<allPixelcons.length; i++) {
					let index = data_creatorsList.indexOf(allPixelcons[i].creator);
					if(index < 0) {
						index = data_creatorsList.length;
						data_creatorsList.push(allPixelcons[i].creator);
					}
					data_allPixelconCreators[i] = index;
				}
			}
		}
		
		//Converts the hex code to a simple number
		function convertHexCode(code) {
			if(code >= 48 && code < 58) return code - 48;
			if(code >= 97 && code < 103) return code - 87;
			return 0;
		}
		
		
		////////////////
		// Algorithms //
		////////////////
		
		
		//Returns a value representing how closely the two pixelcons match
		function rankMatchLevel(pixelconId1, pixelconId2) {
			let ids = new Uint8Array(15*64);
			rotateMirrorTranslate(ids, pixelconId1);
			
			if(checkVeryCloseMatch(ids, pixelconId2)) return 3;
			if(checkCloseMatch(ids, pixelconId2)) return 2;
			if(checkSimilar(ids, pixelconId2)) return 1;
			return 0;
		}
		
		//Returns all pixelcons that are similar to the given pixelcon
		function findSimilar(pixelconId, allPixelconIds, pixelconMax, out, outMax) {
			for(let i=0; i<outMax; i++) out[i] = -1;
			let ids = new Uint8Array(15*64);
			rotateMirrorTranslate(ids, pixelconId);
			
			let outIndex = 0;
			for(let i=0; i<pixelconMax && outIndex<outMax; i++) {
				if(checkSimilar(ids, subId(allPixelconIds,i*64))) {
					out[outIndex] = i;
					outIndex++;
				}
			}
		}
		
		//Returns the earliest close match to the given pixelcon
		function findCloseMatch(pixelconId, pixelconIndex, pixelconCreator, allPixelconIds, allPixelconCreators) {
			let ids = new Uint8Array(15*64);
			rotateMirrorTranslate(ids, pixelconId);
			
			for(let i=0; i<pixelconIndex; i++) {
				let otherId = subId(allPixelconIds,i*64);
				if(pixelconCreator == allPixelconCreators[i]) {
					if(checkVeryCloseMatch(ids, otherId)) return i;
				} else {
					if(checkCloseMatch(ids, otherId)) return i;
				}
			}
			return -1;
		}
		
		//Checks if the given ids are similar
		function checkSimilar(ids, otherId) {
			for(let i=0; i<15; i++) {
				let tolerance = 8;
				if(i != 0) tolerance = tolerance/2;
				
				let delta = 0;
				for(let j=0; j<64; j++) {
					delta += getColorDistance(ids[i*64 + j], otherId[j]);
				}
				if(delta <= tolerance) return true;
			}
			return false;
		}
		
		//Checks if the given ids are a close match
		function checkCloseMatch(ids, otherId) {
			for(let i=0; i<15; i++) {
				let colorsCount = Math.max(countColors(subId(ids,i*64)), countColors(otherId));
				
				let tolerance = colorsCount*0.6;
				if(i != 0) tolerance = tolerance/2;
				if(colorsCount < 4) tolerance = tolerance/2;
				if(colorsCount < 3) tolerance = tolerance/3;
				
				let delta = 0;
				for(let j=0; j<64; j++) {
					delta += getColorDistance(ids[i*64 + j], otherId[j]);
				}
				if(delta <= tolerance) return true;
			}
			return false;
		}
		
		//Checks if the given ids are a very close match
		function checkVeryCloseMatch(ids, otherId) {
			let delta = 0;
			for(let j=0; j<64; j++) {
				if(ids[j] != otherId[j]) delta++;
			}
			if(delta <= 1) return true;
				
			for(let i=1; i<15; i++) {
				let delta2 = 0;
				for(let j=0; j<64; j++) {
					if(ids[i*64 + j] != otherId[j]) delta2++;
				}
				if(delta2 == 0) return true;
			}
			return false;
		}
		
		
		///////////
		// Utils //
		///////////
		
		
		//Returns a list of similar ids that were 
		function rotateMirrorTranslate(out, id) {
			for(let i=0; i<64; i++) out[i] = id[i];
			
			//rotate
			rotate(subId(out,64*1), subId(out,64*0));
			rotate(subId(out,64*2), subId(out,64*1));
			rotate(subId(out,64*3), subId(out,64*2));
			rotate(subId(out,64*4), subId(out,64*3));
			
			//mirror
			mirror(subId(out,64*5), id, true);
			mirror(subId(out,64*6), id, false);
			
			//translate
			translate(subId(out,64*7), id, -1, -1);
			translate(subId(out,64*8), id, -1, 0);
			translate(subId(out,64*9), id, -1, 1);
			translate(subId(out,64*10), id, 0, -1);
			translate(subId(out,64*11), id, 0, 1);
			translate(subId(out,64*12), id, 1, -1);
			translate(subId(out,64*13), id, 1, 0);
			translate(subId(out,64*14), id, 1, 1);
		}
		
		//Rotates the id clockwise
		function rotate(out, id) {
			for(let x=0; x<8; x++) {
				for(let y=0; y<8; y++) {
					out[x*8 + (7-y)] = id[y*8 + x];
				}
			}
		}
		
		//Mirrors the id on the given axis
		function mirror(out, id, xAxis) {
			for(let x=0; x<8; x++) {
				for(let y=0; y<8; y++) {
					if(xAxis) out[x*8 + y] = id[(7-x)*8 + y];
					else out[x*8 + y] = id[x*8 + (7-y)];
				}
			}
		}
		
		//Translates the id by the given vaues
		function translate(out, id, tx, ty) {
			for(let x=0; x<8; x++) {
				for(let y=0; y<8; y++) {
					let nx = (x + 8 + tx) % 8;
					let ny = (y + 8 + ty) % 8;
					out[nx*8 + ny] = id[x*8 + y];
				}
			}
		}
		
		//Returns the number of colors
		function countColors(id) {
			let count = 0;
			let found = [];
			for(let i=0; i<id.length; i++) {
				if(id[i] != 0 && !found[id[i]]) {
					found[id[i]] = true;
					count++;
				}
			}
			return count;
		}
		
		//Gets the distance [0-1.0] between two color hex values
		const colorPalette = [
			[0,0,0],		//#000000
			[29,43,83],		//#1D2B53
			[126,37,83],	//#7E2553
			[0,135,81],		//#008751
			[171,82,54],	//#AB5236
			[95,87,79],		//#5F574F
			[194,195,195],	//#C2C3C7
			[255,241,232],	//#FFF1E8
			[255,0,77],		//#FF004D
			[255,163,0],	//#FFA300
			[255,255,39],	//#FFFF27
			[0,231,86],		//#00E756
			[41,173,255],	//#29ADFF
			[131,118,156],	//#83769C
			[255,119,168],	//#FF77A8
			[255,204,170],	//#FFCCAA
		];
		function getColorDistance(c1, c2) {
			let distance = Math.abs(colorPalette[c1][0] - colorPalette[c2][0]) + Math.abs(colorPalette[c1][1] - colorPalette[c2][1]) + Math.abs(colorPalette[c1][2] - colorPalette[c2][2]);
			return distance/(255*3);
		}
	}
}());
