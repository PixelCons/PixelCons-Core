/***********************************************************************
 * metadata.js
 * Provides functions for reporting the metadata of PixelCons
 ***********************************************************************/
const ethdata = require('./ethdata.js');

// Gets the metadata JSON for the given pixelcon id
async function getMetadata(pixelconId) {
	let id = formatId(pixelconId);
	if(!id) throw "Invalid ID";
	
	let details = await ethdata.getPixelconData(id);
	if(!details) throw "Cannot find PixelCon";
	
	return {
		"name": getName(details.name, details.index),
		"description": getDescription(details.name, details.index, details.collection, details.creator), 
		"image": "https://pixelcons.io/meta/image/" + id,
		"image_url": "https://pixelcons.io/meta/image/" + id,
		"external_url": "https://pixelcons.io/details/" + id,
		"home_url": "https://pixelcons.io/details/" + id,
		"background_color": "CBCBCB",
		"color": "CBCBCB"
	}
}

// Utils
const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
function formatId(id) {
	id = id.toLowerCase();
	if(id.indexOf('0x') == 0) id = id.substr(2,id.length);
	if(id.length != 64) return null;
	for(let i=0; i<64; i++) if(hexCharacters.indexOf(id[i]) == -1) return null;
	return id;
}
function getName(name, index) {
	if(name) return name;
	return "#" + index;
}
function getDescription(name, index, collection, creator) {
	let result = "PixelCon #" + index;
	if(collection > 0) result += " - Collection " + collection;
	if(creator) result += " - Creator 0x" + creator;
	return result;
}

// Export
module.exports = {
    getMetadata: getMetadata
}
