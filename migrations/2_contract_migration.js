var PixelCons = artifacts.require("./PixelCons.sol");
var NotReceiver = artifacts.require("./NotReceiver.sol");

module.exports = function(deployer) {
	var migratorAddress = web3.eth.accounts[0];
	
	// Deploy the PixelCons Contract
	return deployer.deploy(PixelCons).then(function(pixelconsContract) {
			
			//set tokenURITemplate
			var tokenURITemplate = 'https://pixelcons.io/meta/data/<tokenId>?name=<name>&index=<tokenIndex>&owner=<owner>&creator=<creator>&created=<dateCreated>&collection=<collectionIndex>';
			pixelconsContract.adminSetTokenURITemplate(tokenURITemplate, {from: migratorAddress, gas: 3000000});
			
			//dummy contract for testing safe transfers
			return deployer.deploy(NotReceiver);
	});
};
