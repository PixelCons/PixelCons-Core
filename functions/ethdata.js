/***********************************************************************
 * ethdata.js
 * Provides functions for fetching data about the ethereum chain
 ***********************************************************************/
const settings = require('./settings.js');
const webdata = require('./webdata.js');
const cachedata = require('./cachedata.js');

// Settings
const jsonRpc = settings.jsonRpc;
const contractAddress = settings.contractAddress;
const getTokenDataFunctionSelector = '0xb09afec1';
const getBasicDataFunctionSelector = '0xe2b31903';
const getCollectionDataFunctionSelector = '0x6bb2a9a8';
const getForCreatorFunctionSelector = '0xd4aa25cc';
const getLogsCreateTopic = '0x5ada7cc76c691909522f79b403dee86482e43a5064fb2d5849c685ab7d40be20';
const getBasicDataMaxSearchSize = 20;
const rpcCallCacheSeconds = 60;

// Gets pixelcon details
async function getPixelcon(id) {
	id = formatId(id);
	let tokenData = await getTokenData(id);
	if(tokenData == null) return null;
	
	return tokenData;
}

// Gets basic data about all pixelcons
async function getAllPixelcons() {
	let allPixelcons = await getLogsCreate();
	if(allPixelcons == null) return null;
	
	return allPixelcons;
}

//Get collection details
async function getCollection(index) {
	index = formatIndex(index);
	let collectionData = await getCollectionData(index);
	if(collectionData == null) return null;
	
	let pixelcons = await getBasicData(collectionData.pixelconIndexes);
	if(pixelcons == null) return null;
	
	collectionData.index = index;
	collectionData.pixelcons = pixelcons;
	delete collectionData.pixelconIndexes;
	return collectionData;
}

//Get creator details
async function getCreator(address) {
	address = formatAddress(address);
	let creator = await getForCreator(address);
	if(creator == null) return null;
	
	let pixelcons = await getBasicData(creator.pixelconIndexes);
	if(pixelcons == null) return null;
	
	creator.address = address;
	creator.pixelcons = pixelcons;
	delete creator.pixelconIndexes;
	return creator;
}

// Utils
const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
async function getTokenData(id) {
	return await cachedata.cacheData('ethdata_getTokenData(' + id + ')', async function() {
		try {
			if(contractAddress && jsonRpc) {
				let payload = {
					id: 1,
					jsonrpc: "2.0",
					method: "eth_call",
					params:[{ to:contractAddress, data:(getTokenDataFunctionSelector + id)}, "latest"]
				};
				let data = await webdata.doPOST(jsonRpc, JSON.stringify(payload));
				let result = JSON.parse(data).result;
				if(!result || result.length < 64) return null;
				return {
					id: '0x' + id,
					index: parseInt(result.substr(1*64 + 2, 64), 16),
					owner: '0x' + formatAddress(result.substr(3*64 + 2, 64)),
					creator: '0x' + formatAddress(result.substr(4*64 + 2, 64)),
					name: toUtf8(result.substr(5*64 + 2, 64)),
					collection: parseInt(result.substr(2*64 + 2, 64), 16),
					date: parseInt(result.substr(6*64 +2, 64), 16) * 1000
				}
			}
		} catch (err) {
			console.log(err);
		}
		return null;
	}, rpcCallCacheSeconds);
}
async function getCollectionData(index) {
	return await cachedata.cacheData('ethdata_getCollectionData(' + index + ')', async function() {
		try {
			if(contractAddress && jsonRpc) {
				let payload = {
					id: 1,
					jsonrpc: "2.0",
					method: "eth_call",
					params:[{ to:contractAddress, data:(getCollectionDataFunctionSelector + index.toString(16).padStart(64,'0'))}, "latest"]
				};
				let data = await webdata.doPOST(jsonRpc, JSON.stringify(payload));
				let result = JSON.parse(data).result;
				if(!result) return null;
				
				let name = toUtf8(result.substr(0*64 + 2, 64));
				let size = parseInt(result.substr(2*64 + 2, 64), 16);
				let indexes = [];
				for(let i=0; i<size; i++) indexes.push(parseInt(result.substr((i+3)*64 + 2, 64), 16));
				return {
					name: name,
					pixelconIndexes: indexes
				}
			}
		} catch (err) {
			console.log(err);
		}
		return null;
	}, rpcCallCacheSeconds);
}
async function getForCreator(address) {
	return await cachedata.cacheData('ethdata_getForCreator(' + address + ')', async function() {
		try {
			if(contractAddress && jsonRpc) {
				let payload = {
					id: 1,
					jsonrpc: "2.0",
					method: "eth_call",
					params:[{ to:contractAddress, data:(getForCreatorFunctionSelector + address.padStart(64,'0'))}, "latest"]
				};
				let data = await webdata.doPOST(jsonRpc, JSON.stringify(payload));
				let result = JSON.parse(data).result;
				if(!result) return null;
				
				let size = parseInt(result.substr(1*64 + 2, 64), 16);
				let indexes = [];
				for(let i=0; i<size; i++) indexes.push(parseInt(result.substr((i+2)*64 + 2, 64), 16));
				return {
					pixelconIndexes: indexes
				}
			}
		} catch (err) {
			console.log(err);
		}
		return null;
	}, rpcCallCacheSeconds);
}
async function getBasicData(indexes) {
	return await cachedata.cacheData('ethdata_getBasicData([' + indexes + '])', async function() {
		try {
			if(contractAddress && jsonRpc) {
				let numSearches = Math.ceil(indexes.length/getBasicDataMaxSearchSize);
				let indexesCallData = [];
				for(let i=0; i<numSearches; i++) {
					let indexesStr = '';
					let count = 0;
					for(let j=(i*getBasicDataMaxSearchSize); j<indexes.length && j<((i+1)*getBasicDataMaxSearchSize); j++) {
						indexesStr += parseInt(indexes[j]).toString(16).padStart(64,'0');
						count++;
					}
					indexesCallData.push({
						size: count,
						sizeHex: count.toString(16).padStart(64,'0'),
						indexesStr: indexesStr
					});
				}
				
				let basicData = [];
				for(let i=0; i<indexesCallData.length; i++) {
					let payload = {
						id: 1,
						jsonrpc: "2.0",
						method: "eth_call",
						params:[{ to:contractAddress, data:(getBasicDataFunctionSelector + "20".padStart(64,'0') + indexesCallData[i].sizeHex + indexesCallData[i].indexesStr)}, "latest"]
					};
					let data = await webdata.doPOST(jsonRpc, JSON.stringify(payload));
					let result = JSON.parse(data).result;
					if(!result) return null;
					
					let querySize = indexesCallData[i].size;
					for(let j=0; j<indexesCallData[i].size; j++) {
						basicData.push({
							id: '0x' + result.substr((4+(querySize+1)*0+1+j)*64 + 2, 64),
							name: toUtf8(result.substr((4+(querySize+1)*1+1+j)*64 + 2, 64)),
							owner: '0x' + formatAddress(result.substr((4+(querySize+1)*2+1+j)*64 + 2, 64)),
							collection: parseInt(result.substr((4+(querySize+1)*3+1+j)*64 + 2, 64), 16)
						});
					}
				}
				return basicData;
			}
		} catch (err) {
			console.log(err);
		}
		return null;
	}, rpcCallCacheSeconds);
}
async function getLogsCreate() {
	return await cachedata.cacheData('ethdata_getLogsCreate()', async function() {
		try {
			if(contractAddress && jsonRpc) {
				let payload = {
					id: 1,
					jsonrpc: "2.0",
					method: "eth_getLogs",
					params:[{ fromBlock:"earliest", toBlock:"latest", address:contractAddress, topics:[getLogsCreateTopic]}]
				};
				let data = await webdata.doPOST(jsonRpc, JSON.stringify(payload));
				let results = JSON.parse(data).result;

				var pixelconList = [];
				for(let i=0; i<results.length; i++) {
					let index = parseInt(results[i].data.substr(64*0 + 2, 64), 16);
					pixelconList[index] = {
						id: results[i].topics[1],
						creator: '0x' + formatAddress(results[i].topics[2])
					}
				}
				return pixelconList;
			}
		} catch (err) {
			console.log(err);
		}
		return null;
	}, rpcCallCacheSeconds);
}
function formatAddress(address) {
	const empty = '0000000000000000000000000000000000000000';
	address = address.toLowerCase();
	if(address.indexOf('0x') == 0) address = address.substr(2, address.length);
	if(address.length == 64) address = address.substring(24,64);
	if(address.length != 40) return empty;
	for(let i=0; i<40; i++) if(hexCharacters.indexOf(address[i]) == -1) return empty;
	return address;
}
function formatId(id) {
	const empty = '0000000000000000000000000000000000000000000000000000000000000000';
	id = id.toLowerCase();
	if(id.indexOf('0x') == 0) id = id.substr(2, id.length);
	if(id.length != 64) return empty;
	for(let i=0; i<64; i++) if(hexCharacters.indexOf(id[i]) == -1) return empty;
	return id;
}
function formatIndex(index) {
	const empty = 0;
	index = parseInt('' + index);
	if(isNaN(index)) return empty;
	return index;
}
function toUtf8(hex) {
	if(hex.substr(0,2) == '0x') hex = hex.substr(2,hex.length);
	if(hex.length%2 == 1) hex = '0' + hex;
	
	let utf8 = decodeURIComponent(hex.replace(/\s+/g, '').replace(/[0-9a-f]{2}/g, '%$&'));
	if(utf8.indexOf('\x00') > -1) utf8 = utf8.substring(0, utf8.indexOf('\x00'));
	return utf8;
}

// Export
module.exports = {
    getPixelcon: getPixelcon,
	getAllPixelcons: getAllPixelcons,
	getCollection: getCollection,
	getCreator: getCreator
}
