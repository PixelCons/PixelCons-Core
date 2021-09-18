/***********************************************************************
 * ethdata.js
 * Provides functions for fetching data about the ethereum chain
 ***********************************************************************/
const webdata = require('./webdata.js');
const cachedata = require('./cachedata.js');

// Settings
const rpcUrl = 'http://192.168.1.69:8545/';
const rpcUrlL1 = 'http://192.168.1.69:9545/';
const contractAddress = '';
const contractAddressL1 = '';
const createEventsTopic = '0x0bb06f84625453df81b1e0c022326c60a552aa2ff62cad0d55b15320dc90e02e';
const renameEventsTopic = '0x0c367742135a973f5cdf4f6e6e1e6bad317d3fcd999fc88d361cab50b246f29f';
const createCollectionEventsTopic = '0xd65506846bf03550e25f783c355f2ff0b7a098bb2c8025f452f597fd35a4a3df';
const editCollectionEventsTopic = '0xacb48b696a39ce65be96a531780e49a5175b779f4f8afb59a9f33b11a3bf1918';
const tokenDataFunctionSelector = '0xe8c25360';
const tokenDataFunctionSelectorL1 = '0xb09afec1';
const rpcCallCacheSeconds = 60;

// Backup contract address lookup
const contractName = 'PixelConsV2';
const contractNameL1 = 'PixelCons';
const contractChainId = '420';
const contractChainIdL1 = '31337';
const contractDeployJson = 'http://localhost:8082/contracts/deployments.json';
var backupContractAddress = '';
var backupContractAddressL1 = '';

// Gets pixelcon details
async function getPixelconData(id) {
	let address = await getContractAddress();
	if(!address) throw "Failed to find " + contractName + " contract address";
	
	id = formatId(id);
	let createDataPromise = getCreateData(id);
	let renameDataPromise = getRenameData(id);
	let detailsDataPromise = getDetailsData(id);
	let data = await Promise.all([createDataPromise, renameDataPromise, detailsDataPromise]);
	if(data[0] == null || data[1] == null || data[2] == null) return null;
	
	let details = data[0];
	if(data[1].rename) details.name = data[1].rename;
	details.owner = data[2].owner;
	details.collection = data[2].collection;
	details.isMergedL1 = data[2].isMergedL1;
	return details;
}

// Gets l1 pixelcon details
async function getPixelconDataL1(id) {
	let address = await getContractAddress(true);
	if(!address) throw "Failed to find " + contractNameL1 + " contract address";
	
	id = formatId(id);
	let tokenDataPromise = getTokenDataL1(id);
	let data = await Promise.all([tokenDataPromise]);
	if(data[0] == null) return null;
	
	let details = data[0];
	return details;
}

// Gets pixelcon details
async function getPixelconRenderData(id) {
	let address = await getContractAddress();
	if(!address) throw "Failed to find " + contractName + " contract address";
	
	id = formatId(id);
	let createDataPromise = getCreateData(id);
	let detailsDataPromise = getDetailsData(id);
	let data = await Promise.all([createDataPromise, detailsDataPromise]);
	if(data[0] == null || data[1] == null) return null;
	
	let details = data[0];
	details.owner = data[1].owner;
	details.isMergedL1 = data[1].isMergedL1;
	if(data[1].collection) {
		let createCollectionDataPromise = getCreateCollectionData(data[1].collection);
		let collectionData = await Promise.all([createCollectionDataPromise]);
		if(collectionData[0] == null) return null;
		
		details.collection = collectionData[0];
	}
	
	return details;
}

// Gets l1 pixelcon details
async function getPixelconRenderDataL1(id) {
	let address = await getContractAddress(true);
	if(!address) throw "Failed to find " + contractNameL1 + " contract address";
	
	id = formatId(id);
	let tokenDataPromise = getTokenDataL1(id);
	let data = await Promise.all([tokenDataPromise]);
	if(data[0] == null) return null;
	
	let details = data[0];
	return details;
}

// Gets collection details
async function getCollectionData(index) {
	let address = await getContractAddress();
	if(!address) throw "Failed to find " + contractName + " contract address";
	
	index = formatIndex(index);
	let createCollectionDataPromise = getCreateCollectionData(index);
	let renameCollectionDataPromise = getEditCollectionData(index);
	let collectionData = await Promise.all([createCollectionDataPromise, renameCollectionDataPromise]);
	if(collectionData[0] == null || collectionData[1] == null) return null;
	
	let details = collectionData[0];
	if(collectionData[1].rename) details.name = collectionData[1].rename;
	return details;
}

// Gets creator details
async function getCreatorData(creator) {
	let address = await getContractAddress();
	if(!address) throw "Failed to find " + contractName + " contract address";
	
	creator = formatAddress(creator);
	let createDataPromise = getCreateDataCreator(creator);
	let data = await Promise.all([createDataPromise]);
	if(data[0] == null) return null;
	
	let details = data[0];
	return details;
}

// Utils
const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
async function getContractAddress(isL1) {
	try {
		if(isL1) {
			if(contractAddressL1) return contractAddressL1;
			if(backupContractAddressL1) return backupContractAddressL1;
		} else {
			if(contractAddress) return contractAddress;
			if(backupContractAddress) return backupContractAddress;
		}
		
		if(((contractName && contractChainId) || (contractNameL1 && contractChainIdL1)) && contractDeployJson) {
			let data = await webdata.doGET(contractDeployJson);
			let deployments = JSON.parse(data);
			for(let i=0; i<deployments.length; i++) {
				if(contractName && contractChainId && deployments[i].id == contractChainId) {
					for(let j=0; j<deployments[i].contracts.length; j++) {
						if(deployments[i].contracts[j].name == contractName) {
							backupContractAddress = deployments[i].contracts[j].address;
							break;
						}
					}
				}
				if(contractNameL1 && contractChainIdL1 && deployments[i].id == contractChainIdL1) {
					for(let j=0; j<deployments[i].contracts.length; j++) {
						if(deployments[i].contracts[j].name == contractNameL1) {
							backupContractAddressL1 = deployments[i].contracts[j].address;
							break;
						}
					}
				}
			}
			if(isL1 && backupContractAddressL1) return backupContractAddressL1;
			if(!isL1 && backupContractAddress) return backupContractAddress;
		}
	} catch (err) {
		console.log(err);
	}
	return null;
}
async function getCreateData(id) {
	return await cachedata.cacheData('ethdata_getCreateData(' + id + ')', async function() {
		try {
			let address = await getContractAddress();
			let payload = {
				id: 1,
				jsonrpc: "2.0",
				method: "eth_getLogs",
				params:[{ fromBlock:"earliest", toBlock:"latest", address:address, topics:[createEventsTopic, ['0x'+id]] }]
			};
			let data = await webdata.doPOST(rpcUrl, JSON.stringify(payload));
			let result = JSON.parse(data).result[0];
			if(!result) return null;
			return {
				id: '0x' + id,
				index: parseInt(result.topics[3], 16),
				name: toUtf8(result.data.substr(0*64 + 2, 64)),
				creator: '0x' + formatAddress(result.topics[2]),
				date: parseInt(result.data.substr(1*64 +2, 64), 16) * 1000
			}
		} catch (err) {
			console.log(err);
		}
		return null;
	}, rpcCallCacheSeconds);
}
async function getCreateDataCreator(creator) {
	return await cachedata.cacheData('ethdata_getCreateDataCreator(' + creator + ')', async function() {
		try {
			let address = await getContractAddress();
			let payload = {
				id: 1,
				jsonrpc: "2.0",
				method: "eth_getLogs",
				params:[{ fromBlock:"earliest", toBlock:"latest", address:address, topics:[createEventsTopic, [null, '0x'+creator]] }]
			};
			let data = await webdata.doPOST(rpcUrl, JSON.stringify(payload));
			let results = JSON.parse(data).result;
			if(!results) return null;
			let pixelcons = [];
			for(let i=0; i<results.length; i++) pixelcons.push(results[i].topics[1]);
			return {
				address: '0x' + creator,
				pixelcons: pixelcons
			}
		} catch (err) {
			console.log(err);
		}
		return null;
	}, rpcCallCacheSeconds);
}
async function getRenameData(id) {
	return await cachedata.cacheData('ethdata_getRenameData(' + id + ')', async function() {
		try {
			let address = await getContractAddress();
			let payload = {
				id: 1,
				jsonrpc: "2.0",
				method: "eth_getLogs",
				params:[{ fromBlock:"earliest", toBlock:"latest", address:address, topics:[renameEventsTopic, ['0x'+id]] }]
			};
			let data = await webdata.doPOST(rpcUrl, JSON.stringify(payload));
			let results = JSON.parse(data).result;
			if(!results) return null;
			let mostRecentBlock = -1;
			let mostRecentTransactionIndex = -1;
			let renameHex = null;
			for(let i=0; i<results.length; i++) {
				let blockNumber = parseInt(results[i].blockNumber, 16);
				let transactionIndex = parseInt(results[i].transactionIndex, 16);
				if(blockNumber > mostRecentBlock || (blockNumber == mostRecentBlock && transactionIndex > mostRecentTransactionIndex)) {
					mostRecentBlock = blockNumber;
					mostRecentTransactionIndex = transactionIndex;
					renameHex = results[i].data;
				}
			}
			return {
				id: '0x' + id,
				rename: renameHex ? toUtf8(renameHex) : null
			}
		} catch (err) {
			console.log(err);
		}
		return null;
	}, rpcCallCacheSeconds);
}
async function getDetailsData(id) {
	return await cachedata.cacheData('ethdata_getDetailsData(' + id + ')', async function() {
		try {
			let address = await getContractAddress();
			let singleElementArrayABI = "00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000001"
			let payload = {
				id: 1,
				jsonrpc: "2.0",
				method: "eth_call",
				params:[{ to:address, data:(tokenDataFunctionSelector + singleElementArrayABI + id)}, "latest"]
			};
			let data = await webdata.doPOST(rpcUrl, JSON.stringify(payload));
			let result = JSON.parse(data).result;
			if(!result) return null;
			return {
				id: '0x' + id,
				collection: parseInt(result.substr(4*64 + 2, 64), 16),
				owner: '0x' + formatAddress(result.substr(6*64 + 2, 64)),
				isMergedL1: checkFlag(result.substr(8*64 + 2, 2), '0x01')
			}
		} catch (err) {
			console.log(err);
		}
		return null;
	}, rpcCallCacheSeconds);
}
async function getCreateCollectionData(index) {
	return await cachedata.cacheData('ethdata_getCreateCollectionData(' + index + ')', async function() {
		try {
			let address = await getContractAddress();
			let payload = {
				id: 1,
				jsonrpc: "2.0",
				method: "eth_getLogs",
				params:[{ fromBlock:"earliest", toBlock:"latest", address:address, topics:[createCollectionEventsTopic, ['0x'+(index).toString(16).padStart(64, '0')]] }]
			};
			let data = await webdata.doPOST(rpcUrl, JSON.stringify(payload));
			let result = JSON.parse(data).result[0];
			if(!result) return null;
			let tokensCount = parseInt(result.data.substr(3*64 + 2, 64), 16);
			let pixelcons = [];
			for(let i=0; i<tokensCount; i++) pixelcons.push('0x' + result.data.substr(4*64 + 2 + i*64, 64));
			return {
				index: index,
				name: toUtf8(result.data.substr(2, 64)),
				creator: '0x' + formatAddress(result.topics[2]),
				pixelcons: pixelcons
			}
		} catch (err) {
			console.log(err);
		}
		return null;
	}, rpcCallCacheSeconds);
}
async function getEditCollectionData(index) {
	return await cachedata.cacheData('ethdata_getEditCollectionData(' + index + ')', async function() {
		try {
			let address = await getContractAddress();
			let payload = {
				id: 1,
				jsonrpc: "2.0",
				method: "eth_getLogs",
				params:[{ fromBlock:"earliest", toBlock:"latest", address:address, topics:[editCollectionEventsTopic, ['0x'+(index).toString(16).padStart(64, '0')]] }]
			};
			let data = await webdata.doPOST(rpcUrl, JSON.stringify(payload));
			let results = JSON.parse(data).result;
			if(!results) return null;
			let mostRecentBlock = -1;
			let mostRecentTransactionIndex = -1;
			let editHex = null;
			for(let i=0; i<results.length; i++) {
				let blockNumber = parseInt(results[i].blockNumber, 16);
				let transactionIndex = parseInt(results[i].transactionIndex, 16);
				if(blockNumber > mostRecentBlock || (blockNumber == mostRecentBlock && transactionIndex > mostRecentTransactionIndex)) {
					mostRecentBlock = blockNumber;
					mostRecentTransactionIndex = transactionIndex;
					editHex = results[i].data;
				}
			}
			return {
				index: index,
				rename: editHex ? toUtf8(editHex) : null
			}
		} catch (err) {
			console.log(err);
		}
		return null;
	}, rpcCallCacheSeconds);
}
async function getTokenDataL1(id) {
	return await cachedata.cacheData('ethdata_getTokenDataL1(' + id + ')', async function() {
		try {
			let address = await getContractAddress(true);
			let payload = {
				id: 1,
				jsonrpc: "2.0",
				method: "eth_call",
				params:[{ to:address, data:(tokenDataFunctionSelectorL1 + id)}, "latest"]
			};
			let data = await webdata.doPOST(rpcUrlL1, JSON.stringify(payload));
			let result = JSON.parse(data).result;
			if(!result || result.length < 64) return null;
			return {
				id: '0x' + id,
				index: parseInt(result.substr(1*64 + 2, 64), 16),
				owner: '0x' + formatAddress(result.substr(3*64 + 2, 64)),
				creator: '0x' + formatAddress(result.substr(4*64 + 2, 64)),
				name: toUtf8(result.substr(5*64 + 2, 64)),
				date: parseInt(result.substr(6*64 +2, 64), 16) * 1000
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
	hex = hex.toLowerCase();
	if(hex.indexOf('0x') == 0) hex = hex.substr(2, hex.length);
	if(hex.length % 2 !== 0) return null;
	for(let i=0; i<hex.length; i++) if(hexCharacters.indexOf(hex[i]) == -1) return null;
	while (hex[hex.length - 1] == '0' && hex[hex.length - 2] == '0') hex = hex.slice(0, hex.length - 2);
	
	let encodedString = "";
    for (let i = 0; i < hex.length; i += 2) encodedString += '%' + hex[i] + hex[i+1];
	return decodeURIComponent(encodedString);
}
function checkFlag(value, flag) {
	value = parseInt(value, 16);
	flag = parseInt(flag, 16);
	return (value & flag) == flag;
}

// Export
module.exports = {
    getPixelconData: getPixelconData,
	getPixelconDataL1: getPixelconDataL1,
	getPixelconRenderData: getPixelconRenderData,
	getPixelconRenderDataL1: getPixelconRenderDataL1,
	getCollectionData: getCollectionData,
	getCreatorData: getCreatorData
}
