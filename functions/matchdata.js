/***********************************************************************
 * matchdata.js
 * Provides functions for checking pixelcon close matches
 ***********************************************************************/
const ethdata = require('./ethdata.js');

// Data
var allPixelconData = [];

// Finds any cloase matches to the given pixelconId
async function findCloseMatch(pixelconId) {
	let pixelcon = await findPixelcon(pixelconId);
	if(pixelcon) {
		let pixelconListEntry = allPixelconData[pixelcon.index];
		if(pixelconListEntry.closeMatch === undefined) {
			pixelconListEntry.closeMatch = findEarliesetCloseMatch(pixelcon);
		}
		return pixelconListEntry.closeMatch;
	}
}

// Algorithms
function findEarliesetCloseMatch(pixelcon) {	
	let ids = rotateMirrorTranslate(pixelcon.id);
	for(let i=0; i<pixelcon.index; i++) {
		if(checkCloseMatch(ids, allPixelconData[i].id) && pixelcon.creator != allPixelconData[i].creator) {
			return {
				id: allPixelconData[i].id,
				index: i,
				creator: allPixelconData[i].creator
			}
		}
	}
	return null;
}
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

// Utils
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
		for(let i=allPixelconData.length; i<allPixelcons.length; i++) {
			allPixelconData[i] = allPixelcons[i];
		}
		return await findPixelcon(pixelconId, true);
	}
	
	return null;
}
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
function rotate(id) {
	let rId = '0000000000000000000000000000000000000000000000000000000000000000';
	id = id.split('');
	rId = rId.split('');
	for(let x=0; x<8; x++) {
		for(let y=0; y<8; y++) {
			rId[x*8 + (7-y)] = id[y*8 + x];
		}
	}
	return rId.join('');
}
function mirror(id, xAxis) {
	let rId = '0000000000000000000000000000000000000000000000000000000000000000';
	id = id.split('');
	rId = rId.split('');
	for(let x=0; x<8; x++) {
		for(let y=0; y<8; y++) {
			if(xAxis) rId[x*8 + y] = id[(7-x)*8 + y];
			else rId[x*8 + y] = id[x*8 + (7-y)];
		}
	}
	return rId.join('');
}
function translate(id, tx, ty) {
	let rId = '0000000000000000000000000000000000000000000000000000000000000000';
	id = id.split('');
	rId = rId.split('');
	for(let x=0; x<8; x++) {
		for(let y=0; y<8; y++) {
			let nx = (x + 8 + tx) % 8;
			let ny = (y + 8 + ty) % 8;
			rId[nx*8 + ny] = id[x*8 + y];
		}
	}
	return rId.join('');
}
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
function getColorDistance(c1, c2) {
	let distance = Math.abs(colorPalette[c1][0] - colorPalette[c2][0]) + Math.abs(colorPalette[c1][1] - colorPalette[c2][1]) + Math.abs(colorPalette[c1][2] - colorPalette[c2][2]);
	return distance/(255*3);
}

// Export
module.exports = {
    findCloseMatch: findCloseMatch
}
