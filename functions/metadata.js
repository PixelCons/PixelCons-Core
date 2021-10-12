/***********************************************************************
 * metadata.js
 * Provides functions for reporting the metadata of PixelCons
 ***********************************************************************/
const settings = require('./settings.js');
const matchdata = require('./matchdata.js');
const ethdata = require('./ethdata.js');

// Settings
const appWebDomain = settings.appWebDomain;
const detailedMetadataEnabled = settings.detailedMetadataEnabled;
const genesisCount = 651;
const genesisArtists = ['9f2fedfff291314e5a86661e5ed5e6f12e36dd37', '3bf64000788a356d9d7c38a332adbce539fff13d', '0507873482d57637e8d975640316b0a6b2ebbfc1', 'f88e77f202db096e75596b468eef7c16282156b1', '4ff81761e0e8d3d311163b1b17607165c2d4955f'];

// Gets the metadata JSON for the given pixelcon id
async function getMetadata(pixelconId, params) {
	let id = formatId(pixelconId);
	if(!id) throw "Invalid ID";
	if(!params.name || !params.index || !params.collection || !params.creator || !params.created) throw "Missing Parameters";
	
	//calculate data
	let name = getName(params.name, params.index);
	let description = getDescription(params.name, params.index, params.collection, null, params.creator, params.created, null);
	let creator = formatAddress(params.creator);
	let created = parseInt(params.created, 16);
	let index = parseInt(params.index, 16);
	let collection = parseInt(params.collection, 16);
	
	//construct metadata
	let metadata = {
		"name": name,
		"description": description, 
		"image": appWebDomain + "meta/image/" + id,
		"image_url": appWebDomain + "meta/image/" + id,
		"external_url": appWebDomain + "details/" + id,
		"home_url": appWebDomain + "details/" + id,
		"background_color": "000000",
		"color": "000000",
		"attributes": [{
			"display_type": "date", 
			"trait_type": "Created", 
			"value": created
		},{
			"trait_type": "Creator", 
			"value": creator
		}]
	}
		
	//add attributes
	if(index < 100) {
		metadata["attributes"].push({
			"trait_type": "Genesis", 
			"value": "First 100"
		});
	}
	if(index < genesisCount) {
		metadata["attributes"].push({
			"trait_type": "Genesis", 
			"value": "2018 Genesis"
		});
	}
	if(genesisArtists.indexOf(creator) > -1) {
		metadata["attributes"].push({
			"trait_type": "Genesis", 
			"value": "Genesis Artist"
		});
	}
				
	//add additional details
	if(detailedMetadataEnabled) {
		let match = await matchdata.findCloseMatch('0x' + id);
		let collectionName = null;
		if(collection) {
			let collectionData = await ethdata.getCollection(collection);
			if(collectionData) {
				collectionName = collectionData.name;
				metadata["attributes"].push({
					"trait_type": "Collection",
					"value": "Collection " + collection + (collectionName ? " [" + collectionName + "]": "")
				});
			}
		}
		metadata["description"] = getDescription(params.name, params.index, params.collection, collectionName, params.creator, params.created, match);
	}
				
	return metadata;
}

// Utils
const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
function formatId(id) {
	if(id) {
		id = id.toLowerCase();
		if(id.indexOf('0x') == 0) id = id.substr(2,id.length);
		if(id.length != 64) return null;
		for(let i=0; i<64; i++) if(hexCharacters.indexOf(id[i]) == -1) return null;
		return id;
	}
	return null;
}
function formatAddress(address) {
	if(address) {
		address = address.toLowerCase();
		if(address.indexOf('0x') == 0) address = address.substr(2,address.length);
		if(address.length < 40) return null;
		if(address.length > 40) address = address.substring(address.length-40, address.length);
		for(let i=0; i<40; i++) if(hexCharacters.indexOf(address[i]) == -1) return null;
		return address;
	}
	return null;
}
function formatDate(dateHex) {
	if(dateHex) {
		let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		let dateMillis = parseInt(dateHex, 16) * 1000;
		let date = new Date(dateMillis);
		
		let day = (''+date.getDate()).padStart(2,'0');
		let month = months[date.getMonth()];
		let year = date.getFullYear();
		return day + ' ' + month + ' ' + year;
	}
	return null;
}
function toUtf8(hex) {
	if(hex.substr(0,2) == '0x') hex = hex.substr(2,hex.length);
	if(hex.length%2 == 1) hex = '0' + hex;
	
	let utf8 = decodeURIComponent(hex.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'));
	if(utf8.indexOf('\x00') > -1) utf8 = utf8.substring(0, utf8.indexOf('\x00'));
	return utf8;
}
function toInt(hex) {
	return "" + parseInt(hex,16);
}
function getName(name, index) {
	index = toInt(index);
	
	let result = "";
	if(name) result = toUtf8(name);
	if(result != "") result += ' ';
	result += '#' + index + (index < genesisCount ? '✨' : '');
	return result;
}
function getDescription(name, index, collection, collectionName, creator, created, match) {
	index = toInt(index);
	collection = toInt(collection);
	creator = formatAddress(creator);
	created = formatDate(created);
	let result = "";
	
	if(index) result += "PixelCon #" + index;
	if(index < genesisCount) result += " - ✨Genesis";
	if(!match && collection > 0) {
		result += " - Collection " + collection;
		if(collectionName) result += " [" + collectionName + "]";
	}
	if(created) result += " - " + created;
	if(match) {
		result += " - ⚠️Very similar to older [PixelCon #" + match.index + "](" + appWebDomain + "details/" + match.id.substr(2,64) + ")"
		if(collection > 0) {
			result += " - Collection " + collection;
			if(collectionName) result += " [" + collectionName + "]";
		}
	}
	if(creator) result += " - Creator 0x" + creator;
	return result;
}

// Export
module.exports = {
    getMetadata: getMetadata
}
