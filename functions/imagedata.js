/***********************************************************************
 * imagedata.js
 * Provides functions for generating PixelCon images
 ***********************************************************************/
const settings = require('./settings.js');
const png = require('fast-png');
const qrcode = require('qrcode');

// Settings
const qrCodeImageLink = settings.appWebDomain + '_';
const standardImageScaleMultiplier = 2;
const multiImageScaleMultiplier = 8;

// Gets the standard PNG for the given pixelcon id
async function getStandardImage(pixelconId, index, color) {
	const width = 265 * standardImageScaleMultiplier;
	const height = 175 * standardImageScaleMultiplier;
	const pixelconScale = 15 * standardImageScaleMultiplier;
	const qrCodeMargin = 5 * standardImageScaleMultiplier;
	let dataArray = new Uint8Array(width*height*3);
	
	let id = formatId(pixelconId);
	if(!id) throw "Invalid ID";
	
	//draw the background
	let backgroundColor = formatColor(color);
	drawSquare(dataArray, width, height, 0, 0, width, height, backgroundColor);
	
	//draw the qr code
	index = Number.isInteger(parseInt(index)) ? parseInt(index) : null;
	if(index !== null && index !== undefined) {
		let linkStr = qrCodeImageLink + ModifiedBase64.fromInt(index).padStart(4, '0');
		drawQrCode_b(dataArray, width, height, qrCodeMargin, qrCodeMargin, standardImageScaleMultiplier, linkStr, [250,250,250]);
	}
	
	//draw the pixelcon
	const offsetX = Math.round((width-(pixelconScale*8))/2);
	const offsetY = Math.round((height-(pixelconScale*8))/2);
	drawPixelcon(dataArray, width, height, offsetX, offsetY, pixelconScale, id);
	
	return Buffer.from(png.encode({width:width, height:height, data:dataArray, channels:3}));
}

// Gets a multi pixelcon PNG for the given pixelcon ids
async function getMultiImage(pixelconIds, color) {
	const width = 82 * multiImageScaleMultiplier;
	const height = 42 * multiImageScaleMultiplier;
	const pixelconScale = 2 * multiImageScaleMultiplier;
	const positionMap = [[[33,13]],  [[20,13],[46,13]],  [[8,13],[33,13],[58,13]],  [[20,3],[46,3],[20,23],[46,23]],  [[8,3],[33,3],[58,3],[20,23],[46,23]],  [[8,3],[33,3],[58,3],[8,23],[33,23],[58,23]]];
	let dataArray = new Uint8Array(width*height*3);
	
	let ids = formatIds(pixelconIds);
	if(!ids) throw "Invalid ID";
	
	//draw the background
	let backgroundColor = formatColor(color);
	drawSquare(dataArray, width, height, 0, 0, width, height, backgroundColor);
	
	//draw the pixelcons
	let positions = positionMap[Math.min(ids.length, 6) - 1];
	for(let i=0; i<positions.length; i++) {
		drawPixelcon(dataArray, width, height, positions[i][0]*multiImageScaleMultiplier, positions[i][1]*multiImageScaleMultiplier, pixelconScale, ids[i]);
	}
	
	return Buffer.from(png.encode({width:width, height:height, data:dataArray, channels:3}));
}

// Utils
function formatId(id) {
	id = id.toLowerCase();
	if(id.indexOf('0x') == 0) id = id.substr(2,id.length);
	if(id.length != 64) return null;
	for(let i=0; i<64; i++) if(hexCharacters.indexOf(id[i]) == -1) return null;
	return id;
}
function formatIds(ids) {
	if(!Array.isArray(ids)) ids = [ids];
	let allIds = [];
	for(let i=0; i<ids.length; i++) {
		let id = ids[i].toLowerCase();
		id = id.split('0x').join('');
		if(id.length%64 != 0) return null;
		for(let j=0; j<id.length; j++) if(hexCharacters.indexOf(id[j]) == -1) return null;
		for(let j=0; j<id.length; j+=64) allIds.push(id.substr(j,64));
	}
	return allIds;
}
function formatColor(colorHex) {
	const defaultBackground = [0,0,0];
	if(!colorHex || !colorHex.length) return defaultBackground;
	colorHex = colorHex.toLowerCase();
	if(colorHex.indexOf('#') == 0) colorHex = colorHex.substr(1,colorHex.length);
	if(colorHex.length != 6) return defaultBackground;
	for(let i=0; i<6; i++) if(hexCharacters.indexOf(colorHex[i]) == -1) return defaultBackground;
	return [parseInt(colorHex.substr(0,2), 16), parseInt(colorHex.substr(2,2), 16), parseInt(colorHex.substr(4,2), 16)];
}
function drawSquare(dataArray, arrayW, arrayH, x, y, w, h, color) {
	let xStart = Math.max(Math.min(x, arrayW),0);
	let xEnd = Math.max(Math.min(x+w, arrayW),0);
	let yStart = Math.max(Math.min(y, arrayH),0);
	let yEnd = Math.max(Math.min(y+h, arrayH),0);
	for(let x2=xStart; x2<xEnd; x2++) {
		for(let y2=yStart; y2<yEnd; y2++) {
			let index = (y2*arrayW + x2)*3;
			dataArray[index+0] = color[0];
			dataArray[index+1] = color[1];
			dataArray[index+2] = color[2];
		}
	}
}
function drawQrCode(dataArray, arrayW, arrayH, x, y, s, str, color) {
	if(!color) color = [0, 0, 0];
	let qr = qrcode.create(str, {
		errorCorrectionLevel: 'low'
	});
	let size = qr.modules.size;
	let data = qr.modules.data;
	for(let x2=0; x2<size; x2++) {
		for(let y2=0; y2<size; y2++) {
			if(data[y2*size + x2]) {
				drawSquare(dataArray, arrayW, arrayH, x + x2*s, y + y2*s, s, s, color);
			}
		}
	}
}
function drawQrCode_b(dataArray, arrayW, arrayH, x, y, s, str, color) {
	drawQrCode(dataArray, arrayW, arrayH, x, arrayH - (y + 25*s), s, str, color);
}
function drawPixelcon(dataArray, arrayW, arrayH, x, y, s, id) {
	for(let i=0; i<id.length; i++) {
		let xPos = x + (i%8)*s;
		let yPos = y + Math.floor(i/8)*s;
		drawSquare(dataArray, arrayW, arrayH, xPos, yPos, s, s, colorPalette[id[i]]);
	}
}

// Util classes
const ModifiedBase64 = (function () {
    var digitsStr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
    var digits = digitsStr.split('');
    var digitsMap = {};
    for (let i = 0; i < digits.length; i++) digitsMap[digits[i]] = i;
    return {
        fromInt: function(int32) {
			if(!Number.isInteger(int32)) return null;
            let result = '';
            while (true) {
                result = digits[int32 & 0x3f] + result;
                int32 >>>= 6;
                if (int32 === 0) break;
            }
            return result;
        },
        toInt: function(digitsStr) {
            let result = 0;
            let digitsArr = digitsStr.split('');
            for (let i = 0; i < digitsArr.length; i++) {
				let digitVal = digitsMap[digitsArr[i]];
				if(digitVal === undefined) return null;
                result = (result << 6) + digitVal;
            }
            return result;
        }
    };
})();

// Data Constants
const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
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
};

// Export
module.exports = {
	getStandardImage: getStandardImage,
	getMultiImage: getMultiImage
}
