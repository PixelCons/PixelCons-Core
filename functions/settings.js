/***********************************************************************
 * settings.js
 * Defines a set of common settings accross multiple modules
 ***********************************************************************/

/* Enables automatically adjusting the HTML tag data with details about the page being requested */
const customizedHTMLTagsEnabled = false;

/* Enables extra data querying to fetch additional details in a PixelCons metadata */
const detailedMetadataEnabled = false;

/* Web domain that the app is hosted on */
const appWebDomain = 'https://pixelcons.io/';

/* Deployed PixelCons contract address */
const contractAddress = '0x5536b6aadd29eaf0db112bb28046a5fad3761bd4';

/* JSON RPC endpoint to query PixelCons contract state from */
const jsonRpc = '';

/* Redirect link for opensea */
const openseaLink = 'https://opensea.io/collection/pixelcons?search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=Genesis&search[stringTraits][0][values][0]=2018%20Genesis';

/* List of PixelCon ids that default to a gray background instead of black */
const defaultGrayBackground = [];

// Export
module.exports = {
	customizedHTMLTagsEnabled: customizedHTMLTagsEnabled,
	detailedMetadataEnabled: detailedMetadataEnabled,
    appWebDomain: appWebDomain,
	contractAddress: contractAddress,
	jsonRpc: jsonRpc,
	openseaLink: openseaLink,
	defaultGrayBackground: defaultGrayBackground
}
