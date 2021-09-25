/***********************************************************************
 * settings.js
 * Defines a set of common settings accross multiple modules
 ***********************************************************************/

// Settings
const customizedHTMLTagsEnabled = false;									/* Enables automatically adjusting the HTML tag data with details about the page being requested */
const detailedMetadataEnabled = false;										/* Enables extra data querying to fetch additional details in a PixelCons metadata */
const appWebDomain = 'https://pixelcons.io/';								/* Web domain that the app is hosted on */
const contractAddress = '0x5536b6aadd29eaf0db112bb28046a5fad3761bd4';		/* Deployed PixelCons contract address */
const jsonRpc = '';															/* JSON RPC endpoint to query PixelCons contract state from */

// Export
module.exports = {
	customizedHTMLTagsEnabled: customizedHTMLTagsEnabled,
	detailedMetadataEnabled: detailedMetadataEnabled,
    appWebDomain: appWebDomain,
	contractAddress: contractAddress,
	jsonRpc: jsonRpc
}
