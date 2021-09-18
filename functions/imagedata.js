/***********************************************************************
 * imagedata.js
 * Provides functions for generating PixelCon images
 ***********************************************************************/
const ethdata = require('./ethdata.js');
const png = require('fast-png');
const qrcode = require('qrcode');

// Settings
const standardImageLink = 'https://pixelcons.io/';
const standardImageLinkQRPrefix = '~';
const standardImageLinkQRPrefixL1 = '_';
const multiImageScale = 8;
const plainImageScale = 40;
const plainImageBorder = 0;

// Data
var stamp_data_cache = {};
var multi_image_background_cache = {};

// Gets the standard PNG for the given pixelcon id
async function getStandardImage(pixelconId, isL1) {
	const width = 480;//multiple of (8+2)*4
	const height = 480;//multiple of (8+2)*4
	const backgroundScale = width / ((8 + 2) * 4);
	const pixelconScale = backgroundScale * 3;
	const shadowLength = 6;
	const gradientLength = 15;
	const qrCodeMargin = 10;
	let dataArray = new Uint8Array(width*height*3);
	
	let id = formatId(pixelconId);
	if(!id) throw "Invalid ID";
	
	//get pixelcon details for render
	let pixelconData = null;
	if(isL1) pixelconData = await ethdata.getPixelconRenderDataL1(id);
	else pixelconData = await ethdata.getPixelconRenderData(id);
	if(!pixelconData) throw "Cannot find PixelCon";
	
	//draw the background
	drawSquare(dataArray, width, height, 0, 0, width, height, fadedBackgroundColor);
	let backgroundPixelcons = constructBackgroundPixelcons(pixelconData);
	for(let i=0; i<backgroundPixelcons.length; i++) {
		if(backgroundPixelcons[i]) {
			let x = ((i%4)*(8+2) + 1)*backgroundScale;
			let y = (Math.floor(i/4)*(8+2) + 1)*backgroundScale;
			drawPixelcon(dataArray, width, height, x, y, backgroundScale, backgroundPixelcons[i], colorPaletteFaded);
		}
	}
	
	//draw qr code and stamps
	let linkStr = standardImageLink + (isL1 ? standardImageLinkQRPrefixL1 : standardImageLinkQRPrefix) + ModifiedBase64.fromInt(pixelconData.index).padStart(4, '0');
	drawQrCode_b(dataArray, width, height, qrCodeMargin, qrCodeMargin, 3, linkStr);
	drawStamp_b(dataArray, width, height, 93, 10, 'logo');
	if(isL1) {
		drawStamp_b(dataArray, width, height, 93, 27, 'l1');
	} else {
		if(pixelconData.collection && pixelconData.collection.pixelcons) {
			drawStamp_b(dataArray, width, height, 93, 27, 'group');
			drawNumber_b(dataArray, width, height, 109, 28, pixelconData.collection.pixelcons.length);
		}
		if(pixelconData.isMergedL1) {
			drawStamp_b(dataArray, width, height, 92, 48, 'shine');
		}
	}
	
	//draw gradient
	if(pixelconData.isMergedL1) {
		let shinyColors = getShinyColors(id);
		let gradientSize = 8*pixelconScale + gradientLength*2;
		let gradientOffset = 8*backgroundScale - gradientLength;
		drawGradient(dataArray, width, height, gradientOffset, gradientOffset, gradientSize, gradientSize, shinyColors[0], shinyColors[1]);
	}
	
	//draw main pixelcon
	drawShadow(dataArray, width, height, 8*backgroundScale, 8*backgroundScale, 8*pixelconScale, 8*pixelconScale, shadowLength);
	drawPixelcon(dataArray, width, height, 8*backgroundScale, 8*backgroundScale, pixelconScale, id, colorPalette);
	
	return Buffer.from(png.encode({width:width, height:height, data:dataArray, channels:3}));
}

// Gets a multi pixelcon PNG for the given pixelcon ids
async function getMultiImage(pixelconIds) {
	const width = 82 * multiImageScale;
	const height = 42 * multiImageScale;;
	const shadowLength = 1*multiImageScale;
	const positionMap = [[[33,13]],  [[20,13],[46,13]],  [[8,13],[33,13],[58,13]],  [[20,3],[46,3],[20,23],[46,23]],  [[8,3],[33,3],[58,3],[20,23],[46,23]],  [[8,3],[33,3],[58,3],[8,23],[33,23],[58,23]]];
	
	let ids = formatIds(pixelconIds);
	if(!ids) throw "Invalid ID";
	
	//get the background
	let dataArray = getMultiImageBackground(Math.min(ids.length, 6), width, height, shadowLength, positionMap);
	
	//draw the pixelcons
	let positions = positionMap[Math.min(ids.length, 6) - 1];
	for(let i=0; i<positions.length; i++) {
		drawPixelcon(dataArray, width, height, positions[i][0]*multiImageScale, positions[i][1]*multiImageScale, multiImageScale*2, ids[i], colorPalette);
	}
	
	return Buffer.from(png.encode({width:width, height:height, data:dataArray, channels:3}));
}

// Gets a plain PNG for the given pixelcon id
async function getPlainImage(pixelconId) {
	const border = plainImageBorder;
	const width = plainImageScale*8;
	const height = plainImageScale*8;
	
	let id = formatId(pixelconId);
	if(!id) throw "Invalid ID";
	
	//init color data with transparent border
	let dataArray = new Uint8Array((width+border*2)*(height+border*2)*4);
	for(let x=0; x<width+border*2; x++) {
		for(let y=0; y<border; y++) {
			let topBorderIndex = (y*(width+border*2)+x)*4;
			dataArray[topBorderIndex+0] = 0;
			dataArray[topBorderIndex+1] = 0;
			dataArray[topBorderIndex+2] = 0;
			dataArray[topBorderIndex+3] = 0;
			
			let bottomBorderIndex = topBorderIndex+(width+border*2)*(height+border);
			dataArray[bottomBorderIndex+0] = 0;
			dataArray[bottomBorderIndex+1] = 0;
			dataArray[bottomBorderIndex+2] = 0;
			dataArray[bottomBorderIndex+3] = 0;
		}
	}
	for(let y=0; y<height; y++) {
		for(let x=0; x<border; x++) {
			let leftBorderIndex = ((y+border)*(width+border*2)+x)*4;
			dataArray[leftBorderIndex+0] = 0;
			dataArray[leftBorderIndex+1] = 0;
			dataArray[leftBorderIndex+2] = 0;
			dataArray[leftBorderIndex+3] = 0;
			
			let rightBorderIndex = leftBorderIndex+(width+border);
			dataArray[rightBorderIndex+0] = 0;
			dataArray[rightBorderIndex+1] = 0;
			dataArray[rightBorderIndex+2] = 0;
			dataArray[rightBorderIndex+3] = 0;
		}
	}
	
	//fill in pixelcon color data
	for(let h=0; h<height; h++) {
		for(let w=0; w<width; w++) {
			let x = Math.floor(w/(width/8));
			let y = Math.floor(h/(height/8));
			let color = colorPalette[id[y*8+x]];
			
			let index = ((h+border)*(width+border*2)+(w+border))*4;
			dataArray[index+0] = color[0];
			dataArray[index+1] = color[1];
			dataArray[index+2] = color[2];
			dataArray[index+3] = 255;
		}
	}
	
	return Buffer.from(png.encode({width:width+border*2, height:height+border*2, data:dataArray, channels:4}));
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
function getShinyColors(id) {
	//gradient definitions
	const gradients = [
		[[71, 136, 209], [55, 212, 19]],  //green(blue)
		[[187, 74, 209], [63, 174, 221]], //blue(violet)
		[[249, 228, 44], [201, 16, 148]]  //red(orange)
	];
	const defaultGradient = [[187, 187, 187], [255, 204, 47]]; //gold(silver)
	
	//gradient scoring values
	const scoreThreshold = 40;
	const gradientColors = [['b','3','d','c'],['c','1','d','2'],['8','2','e','9']];
	const mainColorPoints = 10;
	const otherColorPoints = 4;
	
	//calculate a score for each gradient (checks to see what colors are most frequent)
	let gradientScores = [];
	for(let i=0; i<gradientColors.length; i++) {
		gradientScores[i] = 0;
		for(let j=0; j<id.length; j++) {
			if(id[j] == gradientColors[i][0]) gradientScores[i] += mainColorPoints;
			for(let k=1; k<gradientColors[i].length; k++) {
				if(id[j] == gradientColors[i][k]) gradientScores[i] += otherColorPoints;
			}
		}
	}
	
	//find the highest gradient score (must also be higher than the minimum threshold)
	let shinyColor = defaultGradient;
	let highestScore = 0;
	for(let i=0; i<gradientScores.length; i++) {
		if(gradientScores[i] > scoreThreshold && gradientScores[i] > highestScore) {
			shinyColor = gradients[i];
			highestScore = gradientScores[i];
		}
	}			
	return shinyColor;
}
function colorBlend(color1, color2, r) {
	let color = [0, 0, 0];
	color[0] = color2[0]*r + color1[0]*(1-r);
	color[1] = color2[1]*r + color1[1]*(1-r);
	color[2] = color2[2]*r + color1[2]*(1-r);
	return color;
}
function generateSeed(str) {
	str = ''+str;
	let seed = 123456789;
	for(let i=0; i<str.length; i++) seed += str.charCodeAt(i);
	return seed % 2147483648;
}
function scrambleList(list, seed) {
	list = JSON.parse(JSON.stringify(list));
	seed = generateSeed(seed);
	list.sort(function(a,b) {
		seed = (1103515245 * seed + 12345) % 2147483648;
		let v1 = seed;
		seed = (1103515245 * seed + 12345) % 2147483648;
		let v2 = seed;
		return v1-v2;
	});
	return list;
}
function constructBackgroundPixelcons(pixelconData) {
	if(pixelconData && pixelconData.collection && pixelconData.collection.pixelcons) {
		let pixelcons = scrambleList(pixelconData.collection.pixelcons, pixelconData.id);
		let backgroundPixelcons = [];
		let pickedPixelconCount = 0;
		for(let i=0; i<16; i++) {
			if(i != 5 && i != 6 && i != 9 && i != 10) {
				backgroundPixelcons[i] = pixelcons[pickedPixelconCount%pixelcons.length].substr(2, 64);
				pickedPixelconCount++;
			} else {
				backgroundPixelcons[i] = null;
			}
		}
		return backgroundPixelcons;
	}
	return standardImageBackgroundPixelcons;
}
function getStampData(name) {
	if(stamp_data_cache[name]) return stamp_data_cache[name];
	if(stamp_data_encoded[name]) {
		let decode = png.decode(Buffer.from(stamp_data_encoded[name], 'base64'));
		let data = new Uint8Array(decode.width * decode.height);
		for(let i=0; i<decode.data.length; i++) data[i] = decode.data[i*3];
		let stamp = {
			width: decode.width,
			height: decode.height,
			data: data
		}
		stamp_data_cache[name] = stamp;
		return stamp;
	}
	return null;
}
function getMultiImageBackground(count, width, height, shadowLength, positionMap) {
	count = Math.min(count, 6);
	if(multi_image_background_cache['count_' + count]) {
		return multi_image_background_cache['count_' + count].slice(0);
	}
	
	//create the data array
	let dataArray = new Uint8Array(width*height*3);
	
	//draw the background
	drawSquare(dataArray, width, height, 0, 0, width, height, fadedBackgroundColor);
	for(let i=0; i<multiImageBackgroundPixelcons.length; i++) {
		let x = ((i%8)*(8+2) + 2)*multiImageScale;
		let y = (Math.floor(i/8)*(8+2) + 2)*multiImageScale;
		drawPixelcon(dataArray, width, height, x, y, multiImageScale, multiImageBackgroundPixelcons[i], colorPaletteFaded);
	}
	
	//draw the shadows
	let positions = positionMap[count-1];
	for(let i=0; i<positions.length; i++) {
		drawShadow(dataArray, width, height, positions[i][0]*multiImageScale, positions[i][1]*multiImageScale, 8*multiImageScale*2, 8*multiImageScale*2, shadowLength);
	}
	
	multi_image_background_cache['count_' + count] = dataArray;
	return dataArray;
}
function drawSquare(dataArray, arrayW, arrayH, x, y, w, h, color) {
	let xStart = Math.min(x, arrayW);
	let xEnd = Math.min(x+w, arrayW);
	let yStart = Math.min(y, arrayH);
	let yEnd = Math.min(y+h, arrayH);
	for(let x2=xStart; x2<xEnd; x2++) {
		for(let y2=yStart; y2<yEnd; y2++) {
			let index = (y2*arrayW + x2)*3;
			dataArray[index+0] = color[0];
			dataArray[index+1] = color[1];
			dataArray[index+2] = color[2];
		}
	}
}
function drawGradient(dataArray, arrayW, arrayH, x, y, w, h, color1, color2) {
	const solid = 0.05; //ratio of ends to retain solid color (max 0.5)
	const slant = 0.3; //ratio to slightly slant the x axis (1.0 = 45degree angle)
	let xStart = Math.min(x, arrayW);
	let xEnd = Math.min(x+w, arrayW);
	let yStart = Math.min(y, arrayH);
	let yEnd = Math.min(y+h, arrayH);
	for(let x2=xStart; x2<xEnd; x2++) {
		for(let y2=yStart; y2<yEnd; y2++) {
			let index = (y2*arrayW + x2)*3;
			let ratio = ((h - (y2 - yStart)) + (x2 - xStart)*slant) / (h + w*slant);
			ratio = Math.max(0.0, Math.min(1.0, (1 - (solid*-2))*ratio - solid));
			
			let color = colorBlend(color1, color2, ratio);
			dataArray[index+0] = color[0];
			dataArray[index+1] = color[1];
			dataArray[index+2] = color[2];
		}
	}
}
function drawQrCode(dataArray, arrayW, arrayH, x, y, s, str) {
	let qr = qrcode.create(str, {
		errorCorrectionLevel: 'low'
	});
	let size = qr.modules.size;
	let data = qr.modules.data;
	for(let x2=0; x2<size; x2++) {
		for(let y2=0; y2<size; y2++) {
			if(data[y2*size + x2]) {
				drawSquare(dataArray, arrayW, arrayH, x + x2*s, y + y2*s, s, s, [0, 0, 0]);
			}
		}
	}
}
function drawQrCode_b(dataArray, arrayW, arrayH, x, y, s, str) {
	drawQrCode(dataArray, arrayW, arrayH, x, arrayH - (y + 25*s), s, str)
}
function drawShadow(dataArray, arrayW, arrayH, x, y, w, h, l) {
	const shadowVal = 0.7; //starting shadow multiple (lower = darker)
	const dropoff = 1.8; //ratio for shadow dropoff (higher = quicker dropoff)
	if(l > 1) {
		let xStart = Math.min(x, arrayW);
		let xEnd = Math.min(x+w, arrayW);
		let yStart = Math.min(y, arrayH);
		let yEnd = Math.min(y+h, arrayH);
		
		//edges
		for(let y2=0; y2<l; y2++) {
			let y3 = y - (y2 + 1);
			if(y3 >= 0 && y3 < arrayH) {
				for(let x2=xStart; x2<xEnd; x2++) {
					let index = (y3*arrayW + x2)*3;
					let falloff = 1-Math.pow((l-y2)/l, dropoff);
					dataArray[index+0] = dataArray[index+0] * (shadowVal + (1-shadowVal)*falloff);
					dataArray[index+1] = dataArray[index+1] * (shadowVal + (1-shadowVal)*falloff);
					dataArray[index+2] = dataArray[index+2] * (shadowVal + (1-shadowVal)*falloff);
				}
			}
			let y4 = (y + h) + y2;
			if(y4 >= 0 && y4 < arrayH) {
				for(let x2=xStart; x2<xEnd; x2++) {
					let index = (y4*arrayW + x2)*3;
					let falloff = 1-Math.pow((l-y2)/l, dropoff);
					dataArray[index+0] = dataArray[index+0] * (shadowVal + (1-shadowVal)*falloff);
					dataArray[index+1] = dataArray[index+1] * (shadowVal + (1-shadowVal)*falloff);
					dataArray[index+2] = dataArray[index+2] * (shadowVal + (1-shadowVal)*falloff);
				}
			}
		}
		for(let x2=0; x2<l; x2++) {
			let x3 = x - (x2 + 1);
			if(x3 >= 0 && x3 < arrayW) {
				for(let y2=yStart; y2<yEnd; y2++) {
					let index = (y2*arrayW + x3)*3;
					let falloff = 1-Math.pow((l-x2)/l, dropoff);
					dataArray[index+0] = dataArray[index+0] * (shadowVal + (1-shadowVal)*falloff);
					dataArray[index+1] = dataArray[index+1] * (shadowVal + (1-shadowVal)*falloff);
					dataArray[index+2] = dataArray[index+2] * (shadowVal + (1-shadowVal)*falloff);
				}
			}
			let x4 = (x + w) + x2;
			if(x4 >= 0 && x4 < arrayW) {
				for(let y2=yStart; y2<yEnd; y2++) {
					let index = (y2*arrayW + x4)*3;
					let falloff = 1-Math.pow((l-x2)/l, dropoff);
					dataArray[index+0] = dataArray[index+0] * (shadowVal + (1-shadowVal)*falloff);
					dataArray[index+1] = dataArray[index+1] * (shadowVal + (1-shadowVal)*falloff);
					dataArray[index+2] = dataArray[index+2] * (shadowVal + (1-shadowVal)*falloff);
				}
			}
		}
		
		//corners
		for(let x2=0; x2<l; x2++) {
			let x3 = x - (x2 + 1);
			if(x3 >= 0 && x3 < arrayW) {
				for(let y2=0; y2<l; y2++) {
					let y3 = y - (y2 + 1);
					if(y3 >= 0 && y3 < arrayH) {
						let index = (y3*arrayW + x3)*3;
						let falloff = 1-(Math.pow((l-y2)/l, dropoff)*Math.pow((l-x2)/l, dropoff));
						dataArray[index+0] = dataArray[index+0] * (shadowVal + (1-shadowVal)*falloff);
						dataArray[index+1] = dataArray[index+1] * (shadowVal + (1-shadowVal)*falloff);
						dataArray[index+2] = dataArray[index+2] * (shadowVal + (1-shadowVal)*falloff);
					}
				}
			}
		}
		for(let x2=0; x2<l; x2++) {
			let x3 = (x + w) + x2;
			if(x3 >= 0 && x3 < arrayW) {
				for(let y2=0; y2<l; y2++) {
					let y3 = y - (y2 + 1);
					if(y3 >= 0 && y3 < arrayH) {
						let index = (y3*arrayW + x3)*3;
						let falloff = 1-(Math.pow((l-y2)/l, dropoff)*Math.pow((l-x2)/l, dropoff));
						dataArray[index+0] = dataArray[index+0] * (shadowVal + (1-shadowVal)*falloff);
						dataArray[index+1] = dataArray[index+1] * (shadowVal + (1-shadowVal)*falloff);
						dataArray[index+2] = dataArray[index+2] * (shadowVal + (1-shadowVal)*falloff);
					}
				}
			}
		}
		for(let x2=0; x2<l; x2++) {
			let x3 = (x + w) + x2;
			if(x3 >= 0 && x3 < arrayW) {
				for(let y2=0; y2<l; y2++) {
					let y3 = (y + h) + y2;
					if(y3 >= 0 && y3 < arrayH) {
						let index = (y3*arrayW + x3)*3;
						let falloff = 1-(Math.pow((l-y2)/l, dropoff)*Math.pow((l-x2)/l, dropoff));
						dataArray[index+0] = dataArray[index+0] * (shadowVal + (1-shadowVal)*falloff);
						dataArray[index+1] = dataArray[index+1] * (shadowVal + (1-shadowVal)*falloff);
						dataArray[index+2] = dataArray[index+2] * (shadowVal + (1-shadowVal)*falloff);
					}
				}
			}
		}
		for(let x2=0; x2<l; x2++) {
			let x3 = x - (x2 + 1);
			if(x3 >= 0 && x3 < arrayW) {
				for(let y2=0; y2<l; y2++) {
					let y3 = (y + h) + y2;
					if(y3 >= 0 && y3 < arrayH) {
						let index = (y3*arrayW + x3)*3;
						let falloff = 1-(Math.pow((l-y2)/l, dropoff)*Math.pow((l-x2)/l, dropoff));
						dataArray[index+0] = dataArray[index+0] * (shadowVal + (1-shadowVal)*falloff);
						dataArray[index+1] = dataArray[index+1] * (shadowVal + (1-shadowVal)*falloff);
						dataArray[index+2] = dataArray[index+2] * (shadowVal + (1-shadowVal)*falloff);
					}
				}
			}
		}
	}
}
function drawPixelcon(dataArray, arrayW, arrayH, x, y, s, id, palette) {
	for(let i=0; i<id.length; i++) {
		let xPos = x + (i%8)*s;
		let yPos = y + Math.floor(i/8)*s;
		drawSquare(dataArray, arrayW, arrayH, xPos, yPos, s, s, palette[id[i]]);
	}
}
function drawStamp(dataArray, arrayW, arrayH, x, y, name) {
	let stamp = getStampData(name);
	if(stamp) {
		for(let x2=0; x2<stamp.width; x2++) {
			for(let y2=0; y2<stamp.height; y2++) {
				let x3 = x + x2;
				let y3 = y + y2;
				if(x3 < arrayW && y3 < arrayH) {
					let index = (y3*arrayW + x3)*3;
					let v = stamp.data[y2*stamp.width + x2] / 255;
					dataArray[index+0] = dataArray[index+0]*v;
					dataArray[index+1] = dataArray[index+1]*v;
					dataArray[index+2] = dataArray[index+2]*v;
				}
			}
		}
	}
}
function drawStamp_b(dataArray, arrayW, arrayH, x, y, name) {
	let stamp = getStampData(name);
	if(stamp) drawStamp(dataArray, arrayW, arrayH, x, arrayH - (y + stamp.height), name);
}
function drawNumber(dataArray, arrayW, arrayH, x, y, number) {
	let stamp = getStampData('numbers');
	if(stamp) {
		let digitIndex = 0;
		let digits = (''+number).split('');
		for(let i=0; i<digits.length; i++) {
			let digit = parseInt(digits[i]);
			if(!isNaN(digit)) {
				for(let x2=0; x2<stamp_numbers_width; x2++) {
					for(let y2=0; y2<stamp.height; y2++) {
						let x3 = x + digitIndex*stamp_numbers_width + x2;
						let y3 = y + y2;
						if(x3 < arrayW && y3 < arrayH) {
							let index = (y3*arrayW + x3)*3;
							let v = stamp.data[y2*stamp.width + (digit*stamp_numbers_width + x2)] / 255;
							dataArray[index+0] = dataArray[index+0]*v;
							dataArray[index+1] = dataArray[index+1]*v;
							dataArray[index+2] = dataArray[index+2]*v;
						}
					}
				}
				digitIndex++;
			}
		}
	}
}
function drawNumber_b(dataArray, arrayW, arrayH, x, y, number) {
	let stamp = getStampData('numbers');
	if(stamp) drawNumber(dataArray, arrayW, arrayH, x, arrayH - (y + stamp.height), number);
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
const stamp_data_encoded = {
	l1: "iVBORw0KGgoAAAANSUhEUgAAACoAAAAVCAIAAAC/jet0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAMcSURBVEhLpZU7SPpRFMevrx72z5DAICEjKV2rzaGhoU2wLRpqaAmCgoKCIGqQhoQwoiFCxaGhJYIKpHTpKUHUWGRPaCiCgoKMHr//N+9Jr+nvZ9ln0HO+997fuY9zz1VJksR+w93d3dbWFgyDwdDc3MzFnDw8PKysrHDb6XSWlZVxmyF8ko+Pj4GBgfHxcfKzUV9fTyMZCwaDpCoSCARMJhONYczn81EDVk7/CQ4ODkpLS41G49nZGUkZiOHxXVJlOD4+drlc1PuLubk5apYkNWmMvb29jYyMPD4+3t/fj42Nvb+/U4M82C2ysuHxeOx2+9LSEvlfiKNS4ZeXl0OhELcXFhY2Nze5rYBC+JOTk8HBQayPfIEs4Z+enoaGhrAB3H15ecHg5+dn7sqhED65ea2trUdHR9zmfA+POXq93lgsxiXO/v4+jpYcAZVKRZZi+JqaGpz6+vr64uKizWYjNUHaKMQ+PT1FupEvUFFRcXt7+5khAg0NDdTM2MzMDKm5oAEJpqamSEXqYS6jo6NIN2oUuLm5cbvd6ER+BgqrV0BManUkEkGikZfB7OwsToGcP6BWp3JcRD08PPz6+kpeBshBdMAv+fkiGx45otPpyMugoKCgqqpKYX4/RDb85OQkNt9isZAgUFdXh2KAEqQwvx+i0WjISkc9Pz+PzN/b2+vv79fr9VxF6UU+ovLs7u6urq4WFhZyPW9kV9/d3Y26iFcI9SEcDjc1NbW0tGxsbDgcDhjRaLSzs5P6/gG58J/3Hi8NXk8sva+v7/Ly8vz8vKurq6ioqLy8HBuTuJ8pGhsbaSRj09PTpOYi9cIyhuMmlb94uL6QeDmrrq42m80wcFp+v593EskvvFjWxPBa+AiMda+treHJubi44J3a2tpybvv29nZJScm3zGhvb+fG4eFhPB7ntph6V1dXaCKHpiFJqPmVlZVcrK2tvb6+poZ0xNVnBZcF3VAqxNdBjlRGWK3WiYkJrVaLa4aynJxKfmAXMQlyFEgsiUB56ejo6O3tRVkmKYOenh5suMi/L/gHd3Z2eM/i4mKuyMLYf91V8WzDFJVsAAAAAElFTkSuQmCC",
	logo: "iVBORw0KGgoAAAANSUhEUgAAADwAAAALCAIAAACs4XkwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAPLSURBVEhLpZVZKK5rGIZ/szJEkmRWEqEkMmRFRBJSxlKSpJShRKY4kCFTImOkjOVMoZATkSFDEkKmVmYiwwEZ9vV7P//+1tq73Wq7D76e536nZ7jf91O8vb39/MKHDBsbG9PT05Lzx+jo6NDU1JScL5yeni4sLNzf30v+t6GIi4tTfMHMzIxTxUBsbKyNjY2w/xwst7a2lpyPj/n5eScnJ2l3hSIqKkoa+B7U2cvBwQHr4eEhIyMjPT19cnISsru7e25u7vOs/4n9/X0fHx93d/ednR32X1lZoasXFxfS8DegRqXX1tZ2d3eFr6+vn5+fX1paOjAwcH19nZ2d3dXVdX5+XlJSIiZUV1c/PT2Vl5djDw8PU0srK6uUlBRjY2OYzs7OioqK4+Nj7OTk5M3NzeXlZeWyf2B0dHR1dZU0nJ2d4+PjBVlfX+/t7U2GExMTRkZGaWlphoaGYmhsbAyNvby8JCQkKOUhKi1gYmLS0NCAkZqa6uLigjEzM8Oa5uZm7KamJoK7vLzEDgkJYW1SUhKjdnZ2j4+PkHJ5cGpra6uwf0NERISFhUVWVhaJsTwnJ0fwP3788PX1hcGwtbW1t7cXPMlANjY2BgYGxsTE/B303d1dVVUVY4uLi7iqoEFmZib89vY235aWFhgKT+vF6PPzM3xlZSW2Kmghg/Hx8c8pv6Cvr4+hw8ND4ZIY7snJCTaxcujBwQH27OwsPCXDjoyMDAoKUs7+hFLTe3t7ampqFKanp2dkZMTLywtSDgJCNp6engEBAegeZmlpidLW1NSgFjrDld3a2hKTBegjXw4QrhwUhYQppHCpOl90L9ywsDD6huHn56elpXV1dYWNZnjKamtryQ1XnXBRFXI5OztjJTkpl/4KIg4NDSVKDw8PwaCQ29tbisH1QrjBwcFUQgwJWFpa6unpHR0dSb4M3BCVUoGBgQFfdhOuurqyjgLa2trv7+8YhYWFg4ODXCG2bWtrU3AJCEWUXQ65PJjNytzcXL7r6+sw0dHRiYmJYlQOuaaZw9MhbDny8vIcHR0l5+ODZ0C1LfIoKioSPCBtjpacT9BVDQ0NZVq6urp8/wMFBQW0pq6uDuUUFxfD8IoPDQ0hWTGB3nHfha0C5SEgLjvdoMtTU1N0nBeDZGgpN5tXiFZwkWDc3NykZf+GsrKy19dXDOSho6OjYFN/f38pERlUleZsYhUkUmZlb28vNoLmGpiamsK4urry0kFSadzPuUqgH4oNA/hz0SvBt7e3iycShIeH39zcCP63SjMqKs1fCZu31dzcvL+//y/hm/N2Xf8dCgAAAABJRU5ErkJggg==",
	group: "iVBORw0KGgoAAAANSUhEUgAAAA0AAAAQCAIAAABCwWJuAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAACMSURBVChTY/T29maAAW5u7piYGCsrq/j4eKgQTJCBEQkICAhMmjTp8ePHUD4YQASZ/qMCiBlQDgwARZggEgQBHdQxMzNDWUiAcf369VAmAwMLC4uWlpakpOSpU6fev38PFWVgsLOzY3zx4gWUBzSciYmHh4ednf3Dhw+/f/+GijIwCAkJjYYzNsDAAACELGTh+Um1eAAAAABJRU5ErkJggg==",
	shine: "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAQJSURBVEhLnZbZK7RtGMCHsa9ZI0IikjVSigNxJuXUgfUPUA6c2UpxQE6UJXIiW5IUKUmyRmRLsu9ZsyT79v3eeW7zzjvLMzPf72Se57rv59qv+x6Ln58fhSxbW1uurq4+Pj7i3Uwsxa8B7u/va2trh4aG3t7ehMhMjBjo7OycmZmZm5sjDiEyEzkD39/f4+Pjp6enk5OT2DCaTL3IGRgeHt7Y2Hh+fj4+Pl5cXNzf3xcL5iBnoKOj4/z8nDje39+Xl5fJlVgwB/0GPj8/8X1paenp6UmS7OzsYOD6+lp6NR39BkhLS0sL6nBfkjw+Pq6urv6fICidJq+vrycnJxMTE15eXkqlUmxS4enpmZeXt7m5eXV1JXabwF8DeH1zczM1NVVQUODt7W2hQuhWwau9vX10dHR1dTVlv7u7+/j4EB8b5o8B8kCuu7u709LSXFxchD7DWFpa4gHRrK+vUy1JkSEUR0dHFRUVCQkJbm5uNjY2fCzUGIZQ2GZnZ+fr65uRkdHX10eFhD4dlGR8cHDw4OCAFH19fSESamRhG77zydnZGR1MH0dFRWFSLGugbGtr8/f3RzU5fXl5EWITII7AwEAiyM3NTU9PJ2laTSFhgWq6Ym9vb2VlZXp6en5+/vDwUCYO9FpbW0dGRqakpCQlJUVERGBGqhy1pAkdHByknRJ/j2si2N3dpdk5FWZnZxk0ljQtkXfqFBsbi964uDhyEhAQYGtrK5YVisvLy/7+fpqQZhMikLSowYXt7e2mpibdOXB3d8/KyhoZGaGbcVZ88Atl4EzE8MLCAs9Cin/i91+4BuhCR0dH9SjwEB8f39PTI3boQDeWl5c7OzsXFRXd3t4KqSEDTBAlCQoKUgeBsfz8/IuLC7FDA4LmSKdZgoODSSOBDgwMMIm0zJ+TRuzSR2ZmppOTkxQEA9za2ioWNCDvDH9ZWRnVVofr5+dXWlrKXYJDcgaYoNDQUD4jDjJGbcTCLwRaU1MTHh5OVfFdbYBnih8SEtLQ0CBngABpcz4mV42NjUL6L3T52tpacXExc4BeyYCHh0dhYSEDyDDKGYD6+nocycnJ4W4QIh2Ig6YgXAaCIHCI+5VOk3rJiAFSjHa6llNBiAxAnauqquiikpIS7AmpUQOA79JsayEdXGrwl2rHxMTQfprHuHED5FFLF5CB5uZmLcMIe3t76U7xrsK4AV1wsKurKzExkbNLiFRIZ5F4+UVZWVkpld4UyANec1q0t7fTPJxraKQj+W9JecHKykpsVSMMmcbDwwOXB75zoKKOMeR0Gh0d1Uy6FsbvL03Qy+WRmprKrHL9MYbJycl0p1jWizBkDvwRrqurCwsLGxsb062/FuZFIEEc2dnZ0i2mnl79KBT/AaPJrvJ/jqCLAAAAAElFTkSuQmCC",
	numbers: "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"
};
const stamp_numbers_width = 8;
const standardImageBackgroundPixelcons = [
	'00ee00000efa9000eea7dd00299ccdd014dcccdf11ddccf7011ddfff00114442', '11111110111fffe000010010fdf00e00ffffff200effeee00e2fffe00ee22000', '000001dd0992010d42a90d000079000000a49a790074444000a94a90004aa940', '00d000d0000d0d00dddddd99d7600844d6000c44d0006d44d0067d44dddddd44',
	'9444444094444440a9999990412121206161616070707070767676706dddddd0', null, null, '00b3b300000b300000ee28000e8e88800ee88280028288200028820000022000',
	'03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000', null, null, '00f6aa000fec9970feec977777e0077777700e777779ceef0799cef000aa6f00',
	'0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1', '00999900099999909949090499499f229909ffff0044ffff049940e0499ff400', '000008880008899900899aaa089aabbb089abccc89abccdd89abcd0089abcd00', '6000000dd70000dd06700dd00067dd0000067000022d68802020080822100288'
];
const multiImageBackgroundPixelcons = [
	'0000000000822200082002800800008002800820002aa200000aa00000000000', '0000000000aaa900aa99949aa0aaa90a90aaa909099aa49000094000009aa400', '000000000cc7c7c00cc677c00cccccc00c7777c00c7777c00d6666d000000000', '00001000000001000000110000066600d6722270d0d777601ddd6660001d6610', '0000000000ddd6000d100d700d100d60b1110b7bb1010bb33111033300000000', '00000000070000700cd66dc006d77d600d622dd001688d1000d6d10000000000', '00b3b300000b300000ee28000e8e88800ee88280028288200028820000022000', '00028000028880000027770004970700004977700002877000028777000d7777',
	'00000000000000000a0aa0900cabba80099999400aaaaa900000000000000000', '0000000000c111000c1001c00c0000c001c00c10001aa100000aa00000000000', '9444444094444440a9999990412121206161616070707070767676706dddddd0', '000000000e808e00e7e8e8e08e8888e008888e000088e000000e000000000000', '00000000000000000866a66d01d76d10047dd642046dc6420446644200000000', '0000000000ddd6000d100d700d100d60811108e8810108822111022200000000', '0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0', '00ee00000efa9000eea7ee0089988ee0142888ef112288f701122fff00114442',
	'00d000d0000d0d00dddddd99d7600844d6000c44d0006d44d0067d44dddddd44', '00ee00000efa4000eea79900244aa990149aaa9f1199aaf701199fff00114442', '0000000000b777b00bb777bb033bbb33003bbb300003b3000000b00000000000', '00088270008822000777666006eeeed0f72fe26ef7f76e6e067e26d000676d00', '0000000006707600666767607677776007777600007760000006000000000000', '00f6aa000fec9970feec977777e0077777700e777779ceef0799cef000aa6f00', '03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000', '0188881018e77e818e7887e887877878878778788e7887e818e77e8101888810',
	'6000000dd70000dd06700dd00067dd0000067000022d68802020080822100288', '0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1', '00999900099999909949090499499f229909ffff0044ffff049940e0499ff400', '11111110111fffe000010010fdf00e00ffffff200effeee00e2fffe00ee22000', '000008880008899900899aaa089aabbb089abccc89abccdd89abcd0089abcd00', '7600000067600000067600400067d090000d7d900000d9200049928200000028', '000001dd0992010d42a90d000079000000a49a790074444000a94a90004aa940', '00ee00000efa9000eea7dd00299ccdd014dcccdf11ddccf7011ddfff00114442'
];
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
const fadedBackgroundColor = [203,203,203]; //#CBCBCB
const colorPaletteFaded = {
	'0': [164,164,164],	//#A4A4A4
	'1': [172,175,185],	//#ACAFB9
	'2': [196,174,185],	//#C4AEB9
	'3': [164,199,185],	//#A4C7B9
	'4': [208,185,178],	//#D0B9B2
	'5': [188,186,184],	//#BCBAB8
	'6': [214,214,215],	//#D6D6D7
	'7': [229,226,223],	//#E5E2DF
	'8': [229,164,184],	//#E5A4B8
	'9': [229,206,164],	//#E5CEA4
	'a': [229,229,174],	//#E5E5AE
	'b': [164,223,186],	//#A4DFBA
	'c': [175,208,229],	//#AFD0E5
	'd': [198,194,204],	//#C6C2CC
	'e': [229,195,207],	//#E5C3CF
	'f': [229,216,208],	//#E5D8D0
};

// Export
module.exports = {
	getStandardImage: getStandardImage,
	getMultiImage: getMultiImage,
    getPlainImage: getPlainImage
}
