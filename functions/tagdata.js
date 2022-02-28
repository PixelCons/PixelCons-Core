/***********************************************************************
 * tagdata.js
 * Provides functions inserting tag data into the plain typical HTML
 ***********************************************************************/
const settings = require('./settings.js');
const ethdata = require('./ethdata.js');
const webdata = require('./webdata.js');

// Settings
const customizedHTMLTagsEnabled = settings.customizedHTMLTagsEnabled;
const appWebDomain = settings.appWebDomain;
const genesisCount = settings.genesisCount;
const invadersContract = formatAddress(settings.invadersContract);
const tagEntryPoint = '<!-- Tag Inserts -->';

// Data
var plain_html_obj = null;

// Gets the main html with the correct tag data
async function getTagDataHTML(path, plainHTMLPath) {
	let htmlData = await getHTMLData(plainHTMLPath);
	if(!htmlData.taglessHTML || !customizedHTMLTagsEnabled) return htmlData.plainHTML;
	
	if(path.indexOf('/details/') === 0) {
		let id = formatId(path.substring(path.lastIndexOf('/') + 1, (path.indexOf('?') > -1) ? path.indexOf('?') : path.length));
		if(id) {
			//get pixelcon details
			let pixelconData = await ethdata.getPixelcon(id);
			if(pixelconData) {
				let type = 'summary';
				let name = 'PixelCon' + (pixelconData.name ? (' [' + pixelconData.name + ']') : '');
				let description = getDescription(pixelconData.name, pixelconData.index, pixelconData.collection, pixelconData.creator, pixelconData.date);
				let imageUrl = appWebDomain + 'meta/image/' + id + getColorModifier([id]);
	
				let tagHTML = insertTagData(htmlData, type, name, description, imageUrl);
				return tagHTML;
			}
		}
	} else if(path.indexOf('/collection/') === 0) {
		let index = formatIndex(path.substring(path.lastIndexOf('/') + 1, (path.indexOf('?') > -1) ? path.indexOf('?') : path.length));
		if(index) {
			//get collection details
			let collectionData = await ethdata.getCollection(index);
			if(collectionData) {
				let type = 'summary_large_image';
				let name = 'PixelCon Collection' + (collectionData.name ? (' [' + collectionData.name + ']') : '');
				let description = 'Collection ' + index;
				let imageUrl = appWebDomain + 'meta/image_multi/' + getIdsList(collectionData.pixelcons) + getColorModifier(collectionData.pixelcons);
	
				let tagHTML = insertTagData(htmlData, type, name, description, imageUrl);
				return tagHTML;
			}
		}
	} else if(path.indexOf('/creator/') === 0) {
		let creator = formatAddress(path.substring(path.lastIndexOf('/') + 1, (path.indexOf('?') > -1) ? path.indexOf('?') : path.length));
		if(creator) {
			//get creator details
			let creatorData = await ethdata.getCreator(creator);
			if(creatorData) {
				let type = 'summary_large_image';
				let name = 'PixelCon Creator';
				let description = creator;
				let imageUrl = appWebDomain + 'meta/image_multi/' + getIdsList(creatorData.pixelcons) + getColorModifier(creatorData.pixelcons);
	
				let tagHTML = insertTagData(htmlData, type, name, description, imageUrl);
				return tagHTML;
			}
		}
	} else if(path.indexOf('/owner/') === 0) {
		let owner = formatAddress(path.substring(path.lastIndexOf('/') + 1, (path.indexOf('?') > -1) ? path.indexOf('?') : path.length));
		if(owner) {
			//get owner details
			let ownerData = await ethdata.getOwner(owner);
			if(ownerData) {
				let type = 'summary_large_image';
				let name = 'PixelCon Wallet';
				let description = owner;
				let imageUrl = appWebDomain + 'meta/image_multi/' + getIdsList(ownerData.pixelcons);
	
				let tagHTML = insertTagData(htmlData, type, name, description, imageUrl);
				return tagHTML;
			}
		}
	}
	
	return htmlData.plainHTML;
}

// Utils
async function getHTMLData(plainHTMLPath) {
	if(plain_html_obj) return plain_html_obj;
	
	//fetch the plain html file
	let plainHTML = await webdata.doGET(plainHTMLPath);
	
	//determine line endings
	let lineEnding = '\n';
	if((plainHTML.match(/\r\n/g) || []).length >= (plainHTML.match(/\n/g) || []).length) {
		lineEnding = '\r\n';
	}
	
	//generate html with tag data removed
	let taglessHTML = null;
	let tagStartIndex = plainHTML.indexOf(tagEntryPoint + lineEnding);
	if(tagStartIndex > -1) {
		let tagEndIndex = plainHTML.indexOf(lineEnding + lineEnding, tagStartIndex);
		taglessHTML = plainHTML.substring(0, tagStartIndex + tagEntryPoint.length + lineEnding.length) + plainHTML.substring(tagEndIndex + lineEnding.length, plainHTML.length);
	}
	
	//determine whitespace
	let whitespace = '';
	let whitespaceStartIndex = -1;
	while(whitespaceStartIndex < tagStartIndex) {
		let i = plainHTML.indexOf(lineEnding, whitespaceStartIndex + 1);
		if(i == -1 || i > tagStartIndex) break;
		whitespaceStartIndex = i;
	}
	if(whitespaceStartIndex > -1) whitespace = plainHTML.substring(whitespaceStartIndex + lineEnding.length, tagStartIndex);
	
	plain_html_obj = {
		plainHTML: plainHTML,
		taglessHTML: taglessHTML,
		lineEnding: lineEnding,
		whitespace: whitespace
	}
	return plain_html_obj;
}
function insertTagData(htmlData, type, title, description, imageUrl) {
	let tagHTML = (' ' + htmlData.taglessHTML).slice(1);
	let tagStartIndex = tagHTML.indexOf(tagEntryPoint);
	tagHTML = tagHTML.substring(0, tagStartIndex + tagEntryPoint.length + htmlData.lineEnding.length)
		+ htmlData.whitespace + '<meta name="twitter:card" content="' + type + '">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta name="twitter:site" content="@PixelConsToken">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta name="twitter:title" content="' + title + '">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta name="twitter:description" content="' + description + '">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta name="twitter:image" content="' + imageUrl + '">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta property="og:url" content="https://pixelcons.io/">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta property="og:title" content="' + title + '">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta property="og:description" content="' + description + '">' + htmlData.lineEnding
		+ htmlData.whitespace + '<meta property="og:image" content="' + imageUrl + '">' + htmlData.lineEnding
		+ tagHTML.substring(tagStartIndex + tagEntryPoint.length + htmlData.lineEnding.length, tagHTML.length);
	
	return tagHTML;
}
function formatAddress(address) {
	const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
	address = address.toLowerCase();
	if(address.indexOf('0x') == 0) address = address.substr(2, address.length);
	if(address.length == 64) address = address.substring(24,64);
	if(address.length != 40) return null;
	for(let i=0; i<40; i++) if(hexCharacters.indexOf(address[i]) == -1) return null;
	return '0x' + address;
}
function formatIndex(index) {
	index = parseInt('' + index);
	if(!isNaN(index)) return index;
	return null;
}
function formatId(id) {
	const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
	id = id.toLowerCase();
	if(id.indexOf('0x') == 0) id = id.substr(2, id.length);
	if(id.length != 64) return null;
	for(let i=0; i<64; i++) if(hexCharacters.indexOf(id[i]) == -1) return null;
	return '0x' + id;
}
function formatDate(millis) {
	if(millis) {
		let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		let date = new Date(millis);
		
		let day = (''+date.getDate()).padStart(2,'0');
		let month = months[date.getMonth()];
		let year = date.getFullYear();
		return day + ' ' + month + ' ' + year;
	}
	return null;
}
function getDescription(name, index, collection, creator, created) {
	let result = "";
	
	if(index) result += "PixelCon #" + index;
	if(index < genesisCount) result += " - ✨Genesis";
	if(invadersContract == formatAddress(creator)) result += " - 👾Invader";
	if(collection > 0) {
		result += " - Collection " + collection;
	}
	if(created) result += " - " + formatDate(created);
	if(creator) result += " - Creator " + creator;
	return result;
}
function scrambleList(list) {
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
function getIdsList(list) {
	let ids = '';
	list = scrambleList(list);
	for(let i=0; i<list.length && i<6; i++) ids += list[i].id.substring(2, 66);
	return ids;
}
function getColorModifier(ids) {
	if(settings.defaultGrayBackground && settings.defaultGrayBackground.indexOf) {
		let allGrayBackground = true;
		for(let i=0; i<ids.length; i++) {
			if(settings.defaultGrayBackground.indexOf(ids[i]) == -1) {
				allGrayBackground = false;
				break;
			}
		}
		if(allGrayBackground) return '?color=5F574F';
	}
	return '';
}

// Export
module.exports = {
    getTagDataHTML: getTagDataHTML
}
