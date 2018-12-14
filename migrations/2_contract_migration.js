var PixelCons = artifacts.require("./PixelCons.sol");
var PixelConMarket = artifacts.require("./PixelConMarket.sol");
var NotReceiver = artifacts.require("./NotReceiver.sol");

module.exports = function(deployer) {
	var migratorAddress = web3.eth.accounts[0];
	var primaryAddress = '0xfE643f001caC62a5f513Af517765146d331261C8';
	var secondaryAddress = '0x9f2fedFfF291314E5a86661e5ED5E6f12e36dd37';
	
	// Provide funds to user addresses
	if(web3.fromWei(web3.eth.getBalance(primaryAddress)) < 9)
		web3.eth.sendTransaction({from: migratorAddress, to:primaryAddress, value:web3.toWei(10, 'ether'), gasLimit:21000, gasPrice:20000000000});
	if(web3.fromWei(web3.eth.getBalance(secondaryAddress)) < 9)
		web3.eth.sendTransaction({from: migratorAddress, to:secondaryAddress, value:web3.toWei(10, 'ether'), gasLimit:21000, gasPrice:20000000000});
	
	// Deploy PixelCons and PixelConMarket Contract
	deployer.deploy(PixelCons, {gas: '8000000'}).then(function(pixelconsContract) {
		return deployer.deploy(PixelConMarket, migratorAddress, pixelconsContract.address).then(function(marketContract) {
			
			//set tokenURITemplate
			var tokenURITemplate = 'https://pixelcons.io/meta/data/<tokenId>?name=<name>&index=<tokenIndex>&owner=<owner>&creator=<creator>&created=<dateCreated>&collection=<collectionIndex>';
			pixelconsContract.adminSetTokenURITemplate(tokenURITemplate, {from: migratorAddress, gas: 3000000});
			
			//change market lock state and admin
			marketContract.adminSetLock(false, true, {from: migratorAddress, gas: 3000000});
			marketContract.adminSetDetails(0, 1*60*60, 5*60, 5*60, 30*24*60*60, 1*24*60*60, 100000000000000000000, 1000000000000000);
			
			//dummy contract for testing safe transfers
			return deployer.deploy(NotReceiver);
		});
	});
};
