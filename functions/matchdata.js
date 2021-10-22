/***********************************************************************
 * matchdata.js
 * Provides functions for checking pixelcon close matches
 ***********************************************************************/
const ethdata = require('./ethdata.js');

// Data
var allPixelconData = [];
var data_allPixelconIds = null;
var data_allPixelconCreators = null;
var data_creatorsList = null;

// Finds any close matches to the given pixelconId
async function getCloseMatch(pixelconId) {
	let pixelcon = await findPixelcon(pixelconId);
	if(pixelcon) {
		let pixelconListEntry = allPixelconData[pixelcon.index];
		if(pixelconListEntry.closeMatch === undefined) {
			pixelconListEntry.closeMatch = getMatch(pixelcon);
		}
		return pixelconListEntry.closeMatch;
	}
}
function getMatch(pixelcon) {
	let pixelconIdArray = new Uint8Array(64);
	for(let i=0; i<64; i++) pixelconIdArray[i] = convertHexCode(pixelcon.id.charCodeAt(i+2));
	let pixelconIndex = pixelcon.index;
	let pixelconCreator = data_creatorsList.indexOf(pixelcon.creator);
	
	//search
	let match = findCloseMatch(pixelconIdArray, pixelconIndex, pixelconCreator, data_allPixelconIds, data_allPixelconCreators);
	if(match > -1) {
		return {
			id: allPixelconData[match].id,
			index: match,
			creator: allPixelconData[match].creator
		}
	}
	return null;
}

// Algorithms
function findCloseMatch(pixelconId, pixelconIndex, pixelconCreator, allPixelconIds, allPixelconCreators) {
	let ids = new Uint8Array(15*64);
	rotateMirrorTranslate(ids, pixelconId);
	
	for(let i=0; i<pixelconIndex; i++) {
		let otherId = subId(allPixelconIds,i*64);
		if(pixelconCreator != allPixelconCreators[i] && checkCloseMatch(ids, otherId)) {
			return i;
		}
	}
	return -1;
}
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

// Utils
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
async function findPixelcon(pixelconId, noRefetch) {
	for(let i=0; i<allPixelconData.length; i++) {
		if(allPixelconData[i].id == pixelconId) {
			return {
				id: allPixelconData[i].id,
				index: i,
				creator: allPixelconData[i].creator
			}
		}
	}
	
	if(!noRefetch) {
		let allPixelcons = await ethdata.getAllPixelcons();
		
		//update all pixelcon data
		for(let i=allPixelconData.length; i<allPixelcons.length; i++) {
			allPixelconData[i] = allPixelcons[i];
		}
		
		//update pixelconId buffer
		data_allPixelconIds = new Uint8Array(allPixelcons.length*64);
		for(let i=0; i<allPixelcons.length; i++) {
			for(let j=0; j<64; j++) {
				data_allPixelconIds[i*64 + j] = convertHexCode(allPixelcons[i].id.charCodeAt(j+2));
			}
		}
				
		//update pixelconCreator buffer
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
		
		return await findPixelcon(pixelconId, true);
	}
	
	return null;
}
function subId(array, index) {
	return array.subarray(index, index+64);
}
function convertHexCode(code) {
	if(code >= 48 && code < 58) return code - 48;
	if(code >= 97 && code < 103) return code - 87;
	return 0;
}
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
function rotate(out, id) {
	for(let x=0; x<8; x++) {
		for(let y=0; y<8; y++) {
			out[x*8 + (7-y)] = id[y*8 + x];
		}
	}
}
function mirror(out, id, xAxis) {
	for(let x=0; x<8; x++) {
		for(let y=0; y<8; y++) {
			if(xAxis) out[x*8 + y] = id[(7-x)*8 + y];
			else out[x*8 + y] = id[x*8 + (7-y)];
		}
	}
}
function translate(out, id, tx, ty) {
	for(let x=0; x<8; x++) {
		for(let y=0; y<8; y++) {
			let nx = (x + 8 + tx) % 8;
			let ny = (y + 8 + ty) % 8;
			out[nx*8 + ny] = id[x*8 + y];
		}
	}
}
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
function getColorDistance(c1, c2) {
	let distance = Math.abs(colorPalette[c1][0] - colorPalette[c2][0]) + Math.abs(colorPalette[c1][1] - colorPalette[c2][1]) + Math.abs(colorPalette[c1][2] - colorPalette[c2][2]);
	return distance/(255*3);
}

// Export
module.exports = {
    getCloseMatch: getCloseMatch
}
