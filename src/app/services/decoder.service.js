(function () {
	angular.module('App')
		.service('decoder', decoder);

	decoder.$inject = ['$q', '$timeout'];
	function decoder($q, $timeout) {
		this.decodePNG = decodePNG;
		this.encodePNG = encodePNG;
		this.backgroundPNG = backgroundPNG;
		this.updateBackground = updateBackground;
		
		//Configuration
		const frameColorDist = 0.05;
		const maxColorDist = 0.1;
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
		}
		const defaultBackgroundIds = ['0x0128218101298221122898101828982112899921289aa98229aaaa9212888821','0x0000000008878780088677800888888008777780087777800266662000000000','0x11112121212112921191112129a9211111911212112129212111121111121112','0x0000000000aaa900aa99949aa0aaa90a90aaa909099aa49000094000009aa400','0x6000000dd70000dd06700dd00067dd0000067000011d6cc010100c0c111006cc','0x00001000000001000000110000066600d6722270d0d777601ddd6660001d6610','0x7600000067600000067600400067d090000d7d900000d930004993b30000003b','0x7600000067600000067600400067d090000d7d900000d9200049928200000028','0x0000000000770000066700000776d990000d6999000444990002444400002442',
			'0x0008800000878800000880000071160007100160070000600070060000066000','0x00000000000000000866a66d01d76d10047dd642046dc6420446644200000000','0x00b3b300000b300000ee28000e8e88800ee88280028288200028820000022000','0x000008880008899900899aaa089aabbb089abccc89abccdd89abcd0089abcd00','0x00ee00000efa9000eea7dd00299ccdd014dcccdf11ddccf7011ddfff00114442','0x000cc00000c7cc00000cc0000071160007100160070000600070060000066000','0x00000000077777a00a100a900a400a900a747a900aa40a900aa77a9000000000','0x001282100128a811128a988228aaaaa88aaaaa822889a821118a821001282100','0x00110000019a100019a100001aa100101aa911a119aaaa91019aa91000111100','0x00f6aa000fec9970feec977777e0077777700e777779ceef0799cef000aa6f00',
			'0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000','0x0000000000e777e00ee777ee088eee88008eee800008e8000000e00000000000','0x00000000070000700cd66dc006d77d600d622dd001688d1000d6d10000000000','0x0d777d00677777607767767d767007076d6007070677707d000d776000006770','0x00028000028880000027770004970700004977700002877000028777000d7777','0x0000000000822200082002800800008002800820002aa200000aa00000000000','0x000000000cc7c7c00cc677c00cccccc00c7777c00c7777c00d6666d000000000','0x0000000000c777c00cc777cc066ccc66006ccc600006c6000000c00000000000','0x0000000000ddd6000d100d700d100d60b1110b7bb1010bb33111033300000000','0x0000000000ddd6000d100d700d100d60811108e8810108822111022200000000',
			'0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0','0x00ee00000efa9000eea7ee0089988ee0142888ef112288f701122fff00114442','0x00000000000000000a0aa0900cabba80099999400aaaaa900000000000000000','0x0000000000c111000c1001c00c0000c001c00c10001aa100000aa00000000000','0x9444444094444440a9999990412121206161616070707070767676706dddddd0','0x00b3b300000b300000ee28000e8e88800ee88280028288200028820000022000','0x7600000067600000067600400067d090000d7d900000d9d000499dcd000000dc','0x0dccccd0dc7ccccdcdccccdcc70cc70ccd0cc0dc0cccccc000cddc00000cc000','0x0188881018e77e818e7887e887877878878778788e7887e818e77e8101888810','0x00d000d0000d0d00dddddd99d7600844d6000c44d0006d44d0067d44dddddd44',
			'0x00ee00000efa4000eea79900244aa990149aaa9f1199aaf701199fff00114442','0x0000000000b777b00bb777bb033bbb33003bbb300003b3000000b00000000000','0x000000000e807600e7e767608e87776008877600008760000006000000000000','0x7600000067600000067600400067d090000d7d900000d940004994a40000004a','0x000001dd0992010d42a90d000079000000a49a790074444000a94a90004aa940','0x00ee00000efa9000eea73300299bb330143bbb3f1133bbf701133fff00114442','0x00000000004994000097a900009aa9000099990009a7aa900009400000000000','0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1','0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400','0x11111110111fffe000010010fdf00e00ffffff200effeee00e2fffe00ee22000'];
		
		//Fetches PNG file and decodes data into pixelcon ids
		function decodePNG(file) {
			return $q(function (resolve, reject) {
				const fr = new FileReader();
				fr.readAsArrayBuffer(file);
				fr.onerror = function() {
					reject("Failed to load file");
				}
				fr.onloadend = function() {
					try {
						if(fr.result) {
							let img = UPNG.decode(fr.result);
							let rgba = new Uint8Array(UPNG.toRGBA8(img)[0]);
							
							//check if the image seems to have a frame
							let frameDetails = getFrameDetails(img.width, img.height, rgba);
							if(frameDetails) {
								
								//loop through the rows and columns and fill id data
								let ids = [];
								for(let r=0; r<frameDetails.rows.length; r++) {
									let rStart = frameDetails.rows[r][0];
									let rLength = frameDetails.rows[r][1] - frameDetails.rows[r][0];
									for(let c=0; c<frameDetails.cols.length; c++) {
										let cStart = frameDetails.cols[c][0];
										let cLength = frameDetails.cols[c][1] - frameDetails.cols[c][0];
										let id = getPixelconIdFromBuffer(cStart, rStart, cLength, rLength, img.width, img.height, rgba);
										if(id) ids.push(id);
									}
								}
								if(ids.length > 0) resolve(ids);
								else reject("Failed to decode file");
							} else {
								
								//simple image
								let id = getPixelconIdFromBuffer(0, 0, img.width, img.height, img.width, img.height, rgba);
								if(id) resolve([id]);
								else reject("Failed to decode file");
							}
						} else reject("Failed to load file");
					} catch(err) {
						if(err == 'The input is not a PNG file!') reject("The given file is not a PNG file");
						else reject("Failed to decode file");
					}
				}
			});
		}
		
		//Creates a PNG image from the given pixelcon id
		function encodePNG(id) {
			const scale = 3;
			let canvas = document.createElement('canvas');
			canvas.width = (8 * scale);
			canvas.height = (8 * scale);
			let ctx = canvas.getContext("2d");
			ctx.fillStyle = "#000000";
			ctx.fillRect(0, 0, 8 * scale, 8 * scale);

			id = formatId(id);
			if (id) {
				for (let y = 0; y < 8; y++) {
					for (let x = 0; x < 8; x++) {
						let index = y * 8 + x;
						ctx.fillStyle = getPaletteColorInHex(id[index]);
						ctx.fillRect(x * scale, y * scale, scale, scale);
					}
				}
			}

			return canvas.toDataURL('image/png');
		}
		
		//Creates a PNG image from the given pixelcon ids
		function backgroundPNG(ids, mixedMode) {
			ids = scrambleList(ids);
			if(mixedMode) {
				let mixOrder = [];
				let mixedIds = defaultBackgroundIds.concat([]);
				for(let i=0; i<mixedIds.length; i++) mixOrder.push(i);
				mixOrder = scrambleList(mixOrder);
				for(let i=0; i<ids.length && i<mixedIds.length; i++) mixedIds[mixOrder[i]] = ids[i];
				ids = mixedIds;
			}
			const n = Math.min(Math.max(Math.ceil(Math.sqrt(ids.length)),3),7);
			const rows = n;
			const columns = n;
			const scale = Math.round(56 / n);
			let canvas = document.createElement('canvas');
			canvas.width = (columns * 10 * scale);
			canvas.height = (rows * 10 * scale);
			let ctx = canvas.getContext("2d");
			ctx.fillStyle = "#B1B1B1";
			ctx.fillRect(0, 0, columns * 10 * scale, rows * 10 * scale);
			

			for (let i = 0; i < rows*columns; i++) {
				let y = Math.floor(i / columns);
				let x = i - (y * columns);
				y = (y * 10);
				x = (x * 10);
				let id = formatId(ids[i % ids.length]);
				if (id) {
					for (let py = 0; py < 8; py++) {
						for (let px = 0; px < 8; px++) {
							let index = py * 8 + px;
							ctx.fillStyle = getPaletteColorInHex(id[index], true);
							ctx.fillRect((px + x + 1) * scale, (py + y + 1) * scale, scale, scale);
						}
					}
				}
			}

			if(n < 7) canvas = shiftCanvas(canvas, Math.round(scale*2), Math.round(scale*2));
			return canvas.toDataURL('image/png');
		}
		
		//Updates the background image
		var backgroundUpdateTimeout = null;
		function updateBackground(backgroundImage, delay) {
			if(backgroundUpdateTimeout) $timeout.cancel(backgroundUpdateTimeout);
			backgroundUpdateTimeout = null;
			if(delay) {
				backgroundUpdateTimeout = $timeout(function() {
					backgroundUpdateTimeout = null;
					updateBackgroundImage(backgroundImage);
				}, delay);
			} else {
				updateBackgroundImage(backgroundImage);
			}
		}
		
		///////////
		// Utils //
		///////////
		
		//Determines details of an image frame
		function getFrameDetails(w, h, buf) {
			let frameColor = getFrameColor(w, h, buf);
			if(frameColor) {
				let start;
				let end;
				let frameDetails = {
					color: frameColor,
					cols: [],
					rows: []
				};
				
				//fill columns
				start = 0;
				end = 0;
				for(let x=0; x<w; x++) {
					if(start <= end) { //on border
						if(!verifyVerticalColor(x, frameColor, w, h, buf)) { //start of image
							start = x;
						}
					} else { //on image
						if(verifyVerticalColor(x, frameColor, w, h, buf)) {//end of image
							end = x;
							frameDetails.cols.push([start, end])
						}
					}
				}
				
				//fill rows
				start = 0;
				end = 0;
				for(let y=0; y<h; y++) {
					if(start <= end) { //on border
						if(!verifyHorizontalColor(y, frameColor, w, h, buf)) { //start of image
							start = y;
						}
					} else { //on image
						if(verifyHorizontalColor(y, frameColor, w, h, buf)) {//end of image
							end = y;
							frameDetails.rows.push([start, end])
						}
					}
				}
				
				return frameDetails;
			}
			return null;
		}
		
		//Shifts the pixels of a given canvas
		function shiftCanvas(canvas, x, y) {
			let canvas2 = document.createElement('canvas');
			canvas2.width = canvas.width;
			canvas2.height = canvas.height;
			
			let ctx = canvas2.getContext("2d");
			ctx.drawImage(canvas, 0, 0, canvas.width - x, canvas.height - y, x, y, canvas.width - x, canvas.height - y);
			ctx.drawImage(canvas, canvas.width - x, 0, x, canvas.height - y, 0, y, x, canvas.height - y);
			ctx.drawImage(canvas, 0, canvas.height - y, canvas.width - x, y, x, 0, canvas.width - x, y);
			ctx.drawImage(canvas, canvas.width - x, canvas.height - y, x, y, 0, 0, x, y);
			
			return canvas2;
		}
		
		//Updates the background image
		function updateBackgroundImage(backgroundImage) {
			if(backgroundImage) {
				//find the style rule
				let styleRule = null;
				for(let i = 0; i < document.styleSheets.length; i++) {
					if(document.styleSheets[i].href && document.styleSheets[i].href.indexOf('/style.css') > -1) {
						for(let j = 0; j < document.styleSheets[i].cssRules.length; j++) {
							if(document.styleSheets[i].cssRules[j].selectorText.indexOf('div.pageContentBackground.groupOverride') > -1) {
								styleRule = document.styleSheets[i].cssRules[j];
								break;
							}
						}
						if(styleRule) break;
					}
				}
				if(styleRule) {
					//update and add background class list
					styleRule.style['background-image'] = 'url(' + backgroundImage + ')';
					let background = document.getElementById('contentBackground');
					if(background) background.classList.add('groupOverride');
					
				} else {
					//remove background class list
					let background = document.getElementById('contentBackground');
					if(background) background.classList.remove('groupOverride');
				}
			} else {
				//remove background class list
				let background = document.getElementById('contentBackground');
				if(background) background.classList.remove('groupOverride');
			}
		}
		
		//Verifies if the given color goes all the way along the vertical
		function verifyVerticalColor(x, color, w, h, buf) {
			for(let y=0; y<h; y++) {
				if(getColorDistance(color, getColorAtPosition(x, y, w, h, buf)) > 0) return false;
			}
			return true;
		}
		
		//Verifies if the given color goes all the way along the horizontal
		function verifyHorizontalColor(y, color, w, h, buf) {
			for(let x=0; x<w; x++) {
				if(getColorDistance(color, getColorAtPosition(x, y, w, h, buf)) > 0) return false;
			}
			return true;
		}
		
		//Searches for a common frame color from given image
		function getFrameColor(w, h, buf) {
			let frameColor = getColorAtPosition(0, 0, w, h, buf);
			if(getPaletteColor(frameColor, frameColorDist) !== null) return null;
			
			//verify the border is all the same color
			for(let x=0; x<w; x++) {
				if(getColorDistance(frameColor, getColorAtPosition(x, 0, w, h, buf)) > 0
					|| getColorDistance(frameColor, getColorAtPosition(x, h-1, w, h, buf)) > 0) {
					return null;
				}
			}
			for(let y=0; y<h; y++) {
				if(getColorDistance(frameColor, getColorAtPosition(0, y, w, h, buf)) > 0
					|| getColorDistance(frameColor, getColorAtPosition(w-1, y, w, h, buf)) > 0) {
					return null;
				}
			}
			
			return frameColor;
		}
		
		//Samples the buffer from the given position and size
		function getPixelconIdFromBuffer(sx, sy, sw, sh, w, h, buf) {
			if(w >= 8 && h >= 8) {
				let dx = sw/8;
				let dy = sh/8;
				
				let id = '0x';
				for(let y=0; y<8; y++) {
					for(let x=0; x<8; x++) {
						let color = getColorAtPosition(sx + Math.floor(dx*x + dx/2), sy + Math.floor(dy*y + dy/2), w, h, buf);
						color = getPaletteColor(color, maxColorDist);
						if(!color) return null;
						id += color;
					}
				}
				if(id == '0x0000000000000000000000000000000000000000000000000000000000000000') return null;
				return id;
			}
			
			return null;
		}
		
		//Gets the closest palette color from the given color
		function getColorAtPosition(x, y, w, h, buf) {
			let index = (y*w + x)*4;
			return [buf[index+0], buf[index+1], buf[index+2]];
		}
		
		//Gets the closest palette color from the given color
		function getPaletteColor(color, maxDist) {
			let bestColor = null;
			let bestColorDistance = 1.0;
			for(let h in colorPalette) {
				let cpColor = colorPalette[h];
				let distance = getColorDistance(color, cpColor);
				if(distance < bestColorDistance && distance < maxDist) {
					bestColorDistance = distance;
					bestColor = h;
				}
			}
			return bestColor;
		}

		//Gets the distance between two colors (0.0 - 1.0)
		function getColorDistance(c1, c2) {
			let d = [c1[0]-c2[0], c1[1]-c2[1], c1[2]-c2[2]];
			let dist = Math.sqrt(d[0]*d[0] + d[1]*d[1] + d[2]*d[2]);
			let max = Math.sqrt(255*255 + 255*255 + 255*255);
			
			return dist/max;
		}
		
		//Gets the palette color represented as a hex string
		function getPaletteColorInHex(color, useFaded) {
			let rgb = colorPalette[color];
			if(useFaded) rgb = colorPaletteFaded[color];
			let r = (rgb[0]).toString(16).padStart(2,'0').toUpperCase();
			let g = (rgb[1]).toString(16).padStart(2,'0').toUpperCase();
			let b = (rgb[2]).toString(16).padStart(2,'0').toUpperCase();
			return '#' + r + g + b;
		}
		
		//Checks if the given id is valid for the color palette
		function formatId(id) {
			if (id && (typeof id === 'string' || id instanceof String)) {
				id = id.toLowerCase();
				if (id.indexOf('0x') == 0) id = id.substr(2, id.length);
				if (id.length == 64) {
					for (let i = 0; i < 64; i++) {
						let v = id.charCodeAt(i);
						if (!(v >= 48 && v <= 57) && !(v >= 97 && v <= 102)) {
							return null;
						}
					}
					return id;
				}
			}
			return null;
		}
		
		//Scrambles the given list in a repeatable way
		function scrambleList(list) {
			list = JSON.parse(JSON.stringify(list));
			let seed = 123456789;
			list.sort(function(a,b) {
				seed = (1103515245 * seed + 12345) % 2147483648;
				let v1 = seed;
				seed = (1103515245 * seed + 12345) % 2147483648;
				let v2 = seed;
				return v1-v2;
			});
			return list;
		}

	}
}());
