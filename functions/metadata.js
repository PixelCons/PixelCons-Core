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
const genesisCount = settings.genesisCount;
const defaultGrayBackground = settings.defaultGrayBackground;
const invadersContract = formatAddress(settings.invadersContract);

// Gets the metadata JSON for the given pixelcon id
async function getMetadata(pixelconId, params) {
	let id = formatId(pixelconId);
	if(!id) throw "Invalid ID";
	if(!params.name || !params.index || !params.collection || !params.creator || !params.created) throw "Missing Parameters";
	
	//calculate data
	let creator = formatAddress(params.creator);
	let name = getName(params.name, params.index, creator);
	let description = getDescription(params.name, params.index, params.collection, null, params.creator, params.created, null);
	let created = parseInt(params.created, 16);
	let index = parseInt(params.index, 16);
	let collection = parseInt(params.collection, 16);
	
	//construct metadata
	let metadata = {
		"name": name,
		"description": description, 
		"image": appWebDomain + "meta/image/" + id + getColorModifier('0x' + id),
		"image_url": appWebDomain + "meta/image/" + id + getColorModifier('0x' + id),
		"external_url": appWebDomain + "details/" + id,
		"home_url": appWebDomain + "details/" + id,
		"background_color": getColor('0x' + id),
		"color": getColor('0x' + id),
		"attributes": [{
			"trait_type": "Creator", 
			"value": creator
		}]
	}
		
	//add attributes
	if(index < 100) {
		metadata["attributes"].push({
			"trait_type": "Attributes", 
			"value": "First 100"
		});
	}
	if(index < genesisCount) {
		metadata["attributes"].push({
			"trait_type": "Attributes", 
			"value": "2018 Genesis"
		});
		metadata["attributes"].push({
			"trait_type": "Collection",
			"value": "#✨ - Genesis"
		});
	}
	if(creator == invadersContract) {
		metadata["attributes"].push({
			"trait_type": "Collection",
			"value": "#👾 - Invaders"
		});
	}
				
	//add additional details
	if(detailedMetadataEnabled) {
		let match = await matchdata.getCloseMatch('0x' + id);
		let collectionName = null;
		
		//collection data
		if(collection) {
			let collectionData = await ethdata.getCollection(collection);
			if(collectionData) {
				collectionName = collectionData.name;
				metadata["attributes"].push({
					"trait_type": "Collection",
					"value": (collection + '').padStart(3, '0') + (collectionName ? (" - " + collectionName) : "")
				});
			}
		}
		
		//better description with collection and match data
		metadata["description"] = getDescription(params.name, params.index, params.collection, collectionName, params.creator, params.created, match);
		
		//similarity properties
		if(!match) {
			metadata["attributes"].push({
				"trait_type": "Attributes", 
				"value": "Unique"
			});
		}
	}
				
	return metadata;
}

// Utils
function formatId(id) {
	const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
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
	const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
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
	try {
		let utf8 = decodeURIComponent(hex.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'));
		if(utf8.indexOf('\x00') > -1) utf8 = utf8.substring(0, utf8.indexOf('\x00'));
		return utf8;
	} catch(err) {}
	return '';
}
function toInt(hex) {
	return "" + parseInt(hex,16);
}
function getName(name, index, creator) {
	index = toInt(index);
	
	let result = "";
	if(name) result = toUtf8(name);
	if(result != "") result += ' ';
	result += '#' + index;
	result += (index < genesisCount ? '✨' : '');
	result += (creator == invadersContract ? '👾' : '');
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
	if(creator == invadersContract) result += " - 👾Invaders";
	if(!match && collection > 0) {
		result += " - Collection " + collection;
		if(collectionName) result += " [" + collectionName + "]";
	}
	if(created) result += " - " + created;
	if(match) {
		if(!match.verified) result += " - ⚠️Very similar to older [PixelCon #" + match.index + "](" + appWebDomain + "details/" + match.id.substr(2,64) + ")";
		if(collection > 0) {
			result += " - Collection " + collection;
			if(collectionName) result += " [" + collectionName + "]";
		}
	}
	if(creator) result += " - Creator 0x" + creator.substr(0,4) + "…" + creator.substr(36,4);
	return result;
}
function getColorModifier(id) {
	if(defaultGrayBackground && defaultGrayBackground.indexOf && defaultGrayBackground.indexOf(id) > -1) return '?color=5F574F';
	return '';
}
function getColor(id) {
	if(defaultGrayBackground && defaultGrayBackground.indexOf && defaultGrayBackground.indexOf(id) > -1) return '5F574F';
	return '000000';
}

// Export
module.exports = {
    getMetadata: getMetadata
}
