/***********************************************************************
 * settings.js
 * Defines a set of common settings accross multiple modules
 ***********************************************************************/

// Settings
const appWebDomain = 'http://localhost:8080/';//'https://pixelcons.io/';
const jsonRpc = 'http://127.0.0.1:7545/';
const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';//'0x5536b6aadd29eaf0db112bb28046a5fad3761bd4';

// Export
module.exports = {
    appWebDomain: appWebDomain,
	jsonRpc: jsonRpc,
	contractAddress: contractAddress
}
