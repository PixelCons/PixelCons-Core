/***********************************************************************
 * webFunctions.js
 * Provides various web functions and maintenance functions
 ***********************************************************************/
const metadata = require('./metadata.js');
const imagedata = require('./imagedata.js');
const tagdata = require('./tagdata.js');

// Gets the metadata JSON for the given pixelcon id
async function getMetadata(pixelconId, params) {
	try {
		return await metadata.getMetadata(pixelconId, params);
	} catch (err) {
		if (!err) err = 'Error';
		return { errorText: err.message ? err.message : err }
	}
}

// Gets the standard PNG for the given pixelcon id
async function getStandardImage(pixelconId, pixelconIndex) {
	try {
		return await imagedata.getStandardImage(pixelconId, pixelconIndex);
	} catch (err) {
		if (!err) err = 'Error';
		return { errorText: err.message ? err.message : err }
	}
}

// Gets a multi pixelcon PNG for the given pixelcon ids
async function getMultiImage(pixelconIds) {
	try {
		return await imagedata.getMultiImage(pixelconIds);
	} catch (err) {
		if (!err) err = 'Error';
		return { errorText: err.message ? err.message : err }
	}
}

// Gets the main html with the correct tag data
async function getTagDataHTML(path, plainHTMLPath) {
	try {
		return await tagdata.getTagDataHTML(path, plainHTMLPath);
	} catch (err) {
		if (!err) err = 'Error';
		return { errorText: err.message ? err.message : err }
	}
}

// Export
module.exports = {
    getMetadata: getMetadata,
	getStandardImage: getStandardImage,
	getMultiImage: getMultiImage,
	getTagDataHTML: getTagDataHTML
}
