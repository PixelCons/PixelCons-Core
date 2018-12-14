(function () {
	angular.module('App')
		.service('marketContract', marketContract);
		
	marketContract.$inject = ['web3Service', '$q'];
	function marketContract(web3Service, $q) {
		var _enabled = true;
		var _canMakeListings = true;
		var _canMakePurchases = true;
		var _contractABI = 'contracts/PixelConMarket.json';
		var _gasPadding = 1.2;
		var _gasPricePadding = 1.4;
		var _maxListingFetch = null;
		var _cacheListingFetch = false;
		
		var _contractDetails = null;
		var _noAccountError = 'No Ethereum Account';
		var _notEnabledError = 'No Ethereum Connection';
		var _notConnectedError = 'Ethereum Provider Not Connected';
		var _unknownError = 'Unknown Error';
		var _marketNotEnabledError = 'Market is Not Enabled';
		var _functionDisabledError = 'Function is Disabled';
		var _invalidIdError = 'Invalid ID';
		var _invalidIndexError = 'Invalid Index';
		var _invalidAddressError = 'Invalid Address';
		var _duplicateTransactionError = 'Already Processing';
		
		// Setup functions
		this.getAllSelling = getAllSelling;
		this.fetchMarketListing = fetchMarketListing;
		this.fetchMarketListingsByPixelconIndexes = fetchMarketListingsByPixelconIndexes;
		this.fetchPixelconIndexesBySeller = fetchPixelconIndexesBySeller;
		this.verifyRemoveListing = verifyRemoveListing;
		this.verifyPurchase = verifyPurchase;
		this.removeListing = removeListing;
		this.purchase = purchase;
		this.getMarketDetails = getMarketDetails;
		this.generateTransferBytesData = generateTransferBytesData;
		this.isEnabled = isEnabled;
		this.canMakeListings = canMakeListings;
		this.canMakePurchases = canMakePurchases;
		
		// Transaction type/description
		var _removeTypeDescription = ["Remove Market Listing", "Removing Listing..."];
		var _purchaseTypeDescription = ["Purchase PixelCon", "Purchasing PixelCon..."];
		
		// Init
		getMarketDetails();
		web3Service.addRecoveryTransactionDataInjector(addListingDataForTransaction);
		
		
		///////////
		// Query //
		///////////
		
		
		// Gets the indexes of all pixelcons on the market
		var marketListings = [];
		function getAllSelling() {
			return $q(function(resolve, reject) {
				var state = web3Service.getState();
				if(state == "not_enabled") reject(_notEnabledError);
				else if(state == "not_connected") reject(_notConnectedError);
				else if(state != "ready") reject(_unknownError);
				else if(!isEnabled()) resolve([]);
				else {
					web3Service.getContract(_contractABI).then(function(contract) {
						contract.totalListings.call().then(function(total) {
							total = total.toNumber();
							if(total == 0) resolve([]);
							else if(_cacheListingFetch && marketListings.length == total) resolve(marketListings);
							else if(!_maxListingFetch || total <= _maxListingFetch) {
								
								//get all at once
								contract.getAllListings.call().then(function(indexes) {
									marketListings = new Array(total);
									for(i=0; i<indexes.length; i++) marketListings[i] = indexes[i].toNumber();
									marketListings.sort();
									resolve(marketListings);
								}, generateErrorCallback(reject, 'Something went wrong while fetching all market listings'));
							} else {
								
								//get in pages
								var index = 0;
								var marketListingsIndex = 0;
								marketListings = new Array(total);
								var fetchNext = function(indexes) {
									if(indexes) for(i=0; i<indexes.length; i++) marketListings[marketListingsIndex++] = indexes[i].toNumber();
									if(index >= total) { 
										marketListings.sort();
										resolve(marketListings);
									} else {
										var start = index;
										index += _maxListingFetch;
										if(index > total) index = total;
										contract.getListingsInRange.call(start, index).then(fetchNext, generateErrorCallback(reject, 'Something went wrong while fetching all market listings'));
									}
								}
								fetchNext();
							}
						}, generateErrorCallback(reject, 'Something went wrong while fetching all market listings'));
					}, reject);
				}
			});
		}
		
		// Gets market listing by pixelcon index
		function fetchMarketListing(pixelconIndex) {
			return $q(function(resolve, reject) {
				var state = web3Service.getState();
				if(state == "not_enabled") reject(_notEnabledError);
				else if(state == "not_connected") reject(_notConnectedError);
				else if(state != "ready") reject(_unknownError);
				else if(!isEnabled()) resolve(null);
				else {
					web3Service.getContract(_contractABI).then(function(contract) {
						contract.exists.call(pixelconIndex).then(function(exists) {
							if(!exists) {
								//not found
								resolve(null);
							} else {
								
								//get details
								contract.getListing.call(pixelconIndex).then(function(listingDetails) {
									//address _seller, uint256 _startPrice, uint256 _endPrice, uint256 _currPrice, uint64 _startDate, uint64 _duration, uint64 _timeLeft
									var listing = {
										pixelconIndex: pixelconIndex,
										seller: listingDetails[0],
										startPrice: listingDetails[1].dividedBy(1000000).toNumber()/1000000000000,
										endPrice: listingDetails[2].dividedBy(1000000).toNumber()/1000000000000,
										price: listingDetails[3].dividedBy(1000000).toNumber()/1000000000000,
										startDate: listingDetails[4].toNumber()*1000,
										duration: listingDetails[5].toNumber(),
										timeLeft: listingDetails[6].toNumber()
									};
									return listing;
								}).then(resolve, generateErrorCallback(reject, 'Something went wrong while fetching market listing'));
							}
						}, generateErrorCallback(reject, 'Something went wrong while fetching market listing'));
					}, reject);
				}
			});
		}
		
		// Gets market listing details for the specified pixelcon indexes
		function fetchMarketListingsByPixelconIndexes(indexes) {
			return $q(function(resolve, reject) {
				var state = web3Service.getState();
				if(state == "not_enabled") reject(_notEnabledError);
				else if(state == "not_connected") reject(_notConnectedError);
				else if(state != "ready") reject(_unknownError);
				else if(!isEnabled()) resolve([]);
				else {
					web3Service.getContract(_contractABI).then(function(contract) {
						
						//get details for indexes
						contract.getBasicData.call(indexes).then(function(basicDetails) {
							var listings = [];
							for(var i=0; i<basicDetails[0].length; i++) {
								if(basicDetails[0][i].greaterThan(0)) {
									listings.push({
										pixelconIndex: basicDetails[0][i].toNumber(),
										seller: basicDetails[1][i],
										price: basicDetails[2][i].dividedBy(1000000).toNumber()/1000000000000,
										timeLeft: basicDetails[3][i].toNumber()
									});
								}
							}
							resolve(listings);
						}, generateErrorCallback(reject, 'Something went wrong while fetching market listings'));
					}, reject);
				}
			});
		}
		
		// Gets market listing details for the specified seller
		function fetchPixelconIndexesBySeller(address) {
			return $q(function(resolve, reject) {
				var state = web3Service.getState();
				if(state == "not_enabled") reject(_notEnabledError);
				else if(state == "not_connected") reject(_notConnectedError);
				else if(state != "ready") reject(_unknownError);
				else if(!web3Service.isAddress(address)) reject(_invalidAddressError);
				else if(!isEnabled()) resolve([]);
				else {
					web3Service.getContract(_contractABI).then(function(contract) {
						
						//get all tokens for seller
						contract.getForSeller.call(address).then(function(indexes) {
							var tokenIndexes = [];
							for(i=0; i<indexes.length; i++) tokenIndexes.push(indexes[i].toNumber());
							resolve(tokenIndexes);
						}, generateErrorCallback(reject, 'Something went wrong while fetching market listing'));
					}, reject);
				}
			});
		}
		
		
		//////////////////
		// Verification //
		//////////////////
		
		
		// Verifies the remove listing action
		function verifyRemoveListing(pixelconIndex) {
			return $q(function(resolve, reject) {
				var state = web3Service.getState();
				if(state == "not_enabled") reject(_notEnabledError);
				else if(state == "not_connected") reject(_notConnectedError);
				else if(state != "ready") reject(_unknownError);
				else if(web3Service.isReadOnly()) reject(_noAccountError);
				else if(!isEnabled()) reject(_marketNotEnabledError);
				else {
					web3Service.getContract(_contractABI).then(function(contract) {
						return contract.removeListing.estimateGas(pixelconIndex).then(function(estimate) {
							var estCost = web3Service.getGasPrice(estimate);
							resolve({
								estCost: estCost
							});
						}, generateErrorCallback(reject, 'Something went wrong while verifying remove market listing'));
					}, reject);
				}
			});
		}
		
		// Verifies the purchase action
		function verifyPurchase(pixelconIndex, value) {
			return $q(function(resolve, reject) {
				var state = web3Service.getState();
				if(state == "not_enabled") reject(_notEnabledError);
				else if(state == "not_connected") reject(_notConnectedError);
				else if(state != "ready") reject(_unknownError);
				else if(web3Service.isReadOnly()) reject(_noAccountError);
				else if(!isEnabled()) reject(_marketNotEnabledError);
				else if(!canMakePurchases()) reject(_functionDisabledError);
				else {
					web3Service.getContract(_contractABI).then(function(contract) {
						value = (Math.floor(value*100000)+1)/100000;
						value = web3Service.toWei(value);
						var to = web3Service.getActiveAccount();
						contract.purchase.estimateGas(to, pixelconIndex, {from:to, value:value}).then(function(estimate) {
							var estCost = web3Service.getGasPrice(estimate);
							resolve({
								estCost: estCost
							});
						}, generateErrorCallback(reject, 'Something went wrong while verifying purchase action'));
					}, reject);
				}
			});
		}
		
		
		//////////////////////////
		// Create/Update/Delete //
		//////////////////////////
		
		
		// Removes the listing the given pixelcon index
		function removeListing(pixelconId, pixelconIndex) {
			return $q(function(resolve, reject) {
				var state = web3Service.getState();
				if(state == "not_enabled") reject(_notEnabledError);
				else if(state == "not_connected") reject(_notConnectedError);
				else if(state != "ready") reject(_unknownError);
				else if(web3Service.isReadOnly()) reject(_noAccountError);
				else if(!isEnabled()) reject(_marketNotEnabledError);
				else {
					web3Service.getContract(_contractABI).then(function(contract) {
						var listing;
						return fetchMarketListing(pixelconIndex).then(function(data) {
							listing = data;
							return contract.removeListing.estimateGas(pixelconIndex);
						}).then(function(estimate) {
							estimate = Math.floor(estimate*_gasPadding);
							var gasPrice = web3Service.getGasPrice();
							var acct = web3Service.getActiveAccount();
							
							var params = {from:acct, gas:estimate, gasPrice:Math.floor(gasPrice*_gasPricePadding)};
							return web3Service.transactionWrapper(contract, 'removeListing', pixelconIndex, params).then(function(data) {
								
								//add listing data for return
								var transactionParams = {pixelconId:pixelconId, pixelconIndex:pixelconIndex, seller:listing.seller};
								//var transaction = addListingDataForRemove(data.transactionPromise, transactionParams);
								var transaction = data.transactionPromise.then(function(data){ return addListingDataForRemove(transactionParams, data) });
								
								web3Service.addWaitingTransaction(transaction, data.txHash, transactionParams, _removeTypeDescription[0], _removeTypeDescription[1]);
								return transaction;
							});
						}).then(resolve, generateErrorCallback(reject, 'Something went wrong while removing market listing'));
					}, reject);
				}
			});
		}
		
		// Purchases the given pixelcon index from the market
		function purchase(pixelconId, pixelconIndex, value) {
			return $q(function(resolve, reject) {
				var state = web3Service.getState();
				if(state == "not_enabled") reject(_notEnabledError);
				else if(state == "not_connected") reject(_notConnectedError);
				else if(state != "ready") reject(_unknownError);
				else if(web3Service.isReadOnly()) reject(_noAccountError);
				else if(!isEnabled()) reject(_marketNotEnabledError);
				else if(!canMakePurchases()) reject(_functionDisabledError);
				else {
					web3Service.getContract(_contractABI).then(function(contract) {
						value = (Math.floor(value*100000)+1)/100000;
						value = web3Service.toWei(value);
						var to = web3Service.getActiveAccount();
						contract.purchase.estimateGas(to, pixelconIndex, {from:to, value:value}).then(function(estimate) {
							estimate = Math.floor(estimate*_gasPadding);
							var gasPrice = web3Service.getGasPrice();
							
							var params = {from:to, value:value, gas:estimate, gasPrice:Math.floor(gasPrice*_gasPricePadding)};
							return web3Service.transactionWrapper(contract, 'purchase', to, pixelconIndex, params).then(function(data) {
								
								//add listing data for return
								var transactionParams = {pixelconId:pixelconId, pixelconIndex:pixelconIndex, buyer:to};
								//var transaction = addListingDataForPurchase(data.transactionPromise, transactionParams);
								var transaction = data.transactionPromise.then(function(data){ return addListingDataForPurchase(transactionParams, data) });
								
								web3Service.addWaitingTransaction(transaction, data.txHash, transactionParams, _purchaseTypeDescription[0], _purchaseTypeDescription[1]);
								return transaction;
							});
						}).then(resolve, generateErrorCallback(reject, 'Something went wrong while purchasing PixelCon'));
					}, reject);
				}
			});
		}
		
		
		///////////
		// Utils //
		///////////
		
		
		// Gets if the market is enabled
		function isEnabled() {
			return _enabled;
		}
		
		// Gets if new listings are allowed
		function canMakeListings() {
			return _canMakeListings && _enabled && !web3Service.isReadOnly();
		}
		
		// Gets if purchases are allowed
		function canMakePurchases() {
			return _canMakePurchases && _enabled && !web3Service.isReadOnly();
		}
		
		// Error reject wrapper
		function generateErrorCallback(reject, text) {
			return function(err) { 
				console.log(err);
				reject(text); 
			}
		}
		
		// Generates the byte data for pixelcon transfer to market
		function generateTransferBytesData(startPrice, endPrice, duration) {
			startPrice = web3Service.to256Hex(web3Service.toWei(startPrice));
			endPrice = web3Service.to256Hex(web3Service.toWei(endPrice));
			return '0x' + hexToBytes(startPrice) + hexToBytes(endPrice) + hexToBytes(web3.toHex(duration));
		}
		
		// Gets the address of contract
		function getMarketDetails() {
			return $q(function(resolve, reject) {
				if(_contractDetails) resolve(_contractDetails);
				else {
					var state = web3Service.getState();
					if(state == "not_enabled") reject(_notEnabledError);
					else if(state == "not_connected") reject(_notConnectedError);
					else if(state != "ready") reject(_unknownError);
					else {
						web3Service.getContract(_contractABI).then(function(contract) {
							contract.getMarketDetails.call().then(function(details) {
								//devFee, priceUpdateInterval, startDateRoundValue, durationRoundValue, maxDuration, minDuration, maxPrice, minPrice
								_contractDetails = {
									address: contract.address,
									devFee: details[0].toNumber()/100000,
									priceUpdateInterval: details[1].toNumber(),
									startDateRoundValue: details[2].toNumber(),
									durationRoundValue: details[3].toNumber(),
									maxDuration: details[4].toNumber(),
									minDuration: details[5].toNumber(),
									maxPrice: details[6].dividedBy(1000000).toNumber()/1000000000000,
									minPrice: details[7].dividedBy(1000000).toNumber()/1000000000000,
								}
								resolve(_contractDetails);
							}, function() { reject('Something went wrong while fetching market listing'); });
						}, reject);
					}
				}
			});
		}
		
		// Gets the bytes string of the given hex
		function hexToBytes(hex) {
			hex = hex.substring(2,hex.length);
			if(hex.length%2 == 1) hex = '0' + hex;
			
			var bytes = '';
			for(var i=0; i<32-(hex.length/2); i++) bytes += '00';
			for(var i=0; i<hex.length; i+=2) bytes += hex[i]+hex[i+1];
			return bytes;
		}
		
		// Checks if the given data looks like a currently processing transaction
		function isDuplicate(transactionType, pixelconIndex) {
			var transactions = web3Service.getWaitingTransactions();
			for(var i=0; i<transactions.length; i++) {
				if(transactions[i].type == transactionType && transactions[i].params) {
					if(transactions[i].params.pixelconIndex == pixelconIndex) return true;
				}
			}
			
			return false;
		}
		
		
		//////////////////////////////////
		// Utils (return data wrappers) //
		//////////////////////////////////
		
		
		// Adds data to return for remove transaction
		function addListingDataForRemove(params, data) {
			//params.pixelconId
			//params.pixelconIndex
			//params.seller

			data.listings = [{
				pixelconIndex: params.pixelconIndex,
				pixelconOwner: params.seller,
				listing: null
			}];
			return data;
		}
		
		// Adds data to return for purchase transaction
		function addListingDataForPurchase(params, data) {
			//params.pixelconId
			//params.pixelconIndex
			//params.buyer

			data.listings = [{
				pixelconIndex: params.pixelconIndex,
				pixelconOwner: params.buyer,
				listing: null
			}];
			return data;
		}
		
		// Adds data to return for the given transaction
		function addListingDataForTransaction(details, data) {
			if(details.type == _removeTypeDescription[0]) return addListingDataForRemove(details.params, data);
			if(details.type == _purchaseTypeDescription[0]) return addListingDataForPurchase(details.params, data);
				
			return data;
		}
		
	}
}());