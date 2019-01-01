(function () {
	angular.module('App')
		.service('openSea', openSea);
		
	openSea.$inject = ['$q', 'web3Service'];
	function openSea($q, web3Service) {
		var _enabled = false;
		var _forSaleListEnabled = false;
		var _cacheResults = true;
		var _maxConcurrentCalls = 2;
		var _apiKey = '<my_api_key>';
		var _contractAddress = '0x5536b6aadd29eaf0db112bb28046a5fad3761bd4';
		var _accountLink = 'https://opensea.io/account';
		var _storeLink = 'https://opensea.io/assets/pixelcons?toggle%5Bon_sale%5D=true';
		var _referral = '';
		
		// Setup functions
		this.isEnabled = isEnabled;
		this.canGetForSaleList = canGetForSaleList;
		this.getItemsForSale = getItemsForSale;
		this.getAssetData = getAssetData;
		this.getMarketLink = getMarketLink;
		this.getAccountLink = getAccountLink;
		
		
		///////////
		// Query //
		///////////
		
		
		// Gets a list of all pixelcon indexes that are currently for sale
		var forSaleCache = [];
		function getItemsForSale() {
			if(!_forSaleListEnabled) return Promise.resolve([]);
			if(!_enabled) return Promise.resolve([]);
			
			if(_cacheResults && forSaleCache.length > 0) {
				return Promise.resolve(forSaleCache);
			} else {
				var url = 'https://api.opensea.io/api/v1/assets/';
				return getJSON(url, {'asset_contract_address':_contractAddress, 'limit':200, on_sale:true}).then(function(data) {
					//filter to array of indexes
					var indexes = [];
					if(data && data.assets) {
						for(var i=0; i<data.assets.length; i++) {
							if(data.assets[i].description && data.assets[i].sell_orders.length) {
								var strIdx = data.assets[i].description.indexOf("Number");
								if(strIdx > -1) {
									var num = parseInt(data.assets[i].description.substring(strIdx+7, data.assets[i].description.length));
									if(!isNaN(num)) indexes.push(num);
								}
							}
						}
					}
					forSaleCache = indexes;
					return indexes;
				});
			}
		}
		
		// Gets openSea asset data for the given pixelcon ids
		var assetCache = [];
		function getAssetData(ids) {
			if(!_enabled) return Promise.resolve([]);
			
			if(!Array.isArray(ids)) ids = [ids];
			return $q(function(resolve, reject) {
				var assets = [];
				if(_cacheResults) {
					for(var i=0; i<ids.length; i++) {
						for(var a=0; a<assetCache.length; a++) {
							if(assetCache[a].id == ids[i]) {
								ids.splice(i, 1);
								assets.push(assetCache[a]);
								i--;
								break;
							}
						}
					}
				}
				
				var maxURLSize = 2048;
				var urls = [];
				for(var i=0; i<ids.length; ) {
					var url = 'https://api.opensea.io/api/v1/assets/?';
					var urlEnding = 'asset_contract_address=' + _contractAddress;
					for(; i<ids.length; i++) {
						var tempUrl = url + 'token_ids=' + web3Service.hexToInt(ids[i]) + '&';
						if(tempUrl.length + urlEnding.length > maxURLSize) break;
						else url = tempUrl;
					}
					urls.push(url + urlEnding);
				}
				
				var failed = false;
				var queryCount = urls.length;
				var success = function(data) {
					if(!failed) {
						if(data && data.assets) {
							for(var i=0; i<data.assets.length; i++) {
								var asset = {};
								asset.id = web3Service.to256Hex(data.assets[i].token_id);
								asset.link = data.assets[i].permalink + _referral;
								if(data.assets[i].sell_orders && data.assets[i].sell_orders[0]) {
									var price = parseFloat(data.assets[i].sell_orders[0].current_price);
									var decimal = data.assets[i].sell_orders[0].payment_token_contract.decimals;
									asset.price = price / (Math.pow(10, decimal));
									asset.priceDenomination = data.assets[i].sell_orders[0].payment_token_contract.symbol;
									asset.seller = data.assets[i].sell_orders[0].maker.address.toLowerCase();
									if(data.assets[i].sell_orders[0].sale_kind == 1) {
										var priceEnd = parseFloat(data.assets[i].sell_orders[0].base_price) - parseFloat(data.assets[i].sell_orders[0].extra);
										asset.priceEnd = priceEnd / (Math.pow(10, decimal));
										asset.timeLeft = data.assets[i].sell_orders[0].expiration_time - Math.floor((new Date()).getTime()/1000);
									}
								}
								if(data.assets[i].last_sale) {
									var price = parseFloat(data.assets[i].last_sale.total_price);
									var decimal = data.assets[i].last_sale.payment_token.decimals;
									asset.lastSold = price / (Math.pow(10, decimal));
									asset.lastSoldDenomination = data.assets[i].last_sale.payment_token.symbol;
								}
								assets.push(asset);	
							}
						}
						if(--queryCount == 0) {
							if(_cacheResults) {
								for(var i=0; i<assets.length; i++) {
									var found = false;
									for(var a=0; a<assetCache.length; a++) {
										if(assetCache[a].id == assets[i].id) {
											assetCache[a] = assets[i];
											found = true;
											break;
										}
									}
									if(!found) assetCache.push(assets[i]);
								}
							}
							resolve(assets);
						}
					}
				}
				var error = function() {
					failed = true;
					console.log('Error while fetching openSea asset data');
					resolve([]);
				}
				
				if(urls.length == 0) resolve(assets);
				for(var i=0; i<urls.length; i++) getJSON(urls[i]).then(success, error);
			});
		}
		
		
		///////////
		// Utils //
		///////////
		
		
		// Gets if the market is enabled
		function isEnabled() {
			return _enabled;
		}
		
		// Gets if the market is enabled
		function canGetForSaleList() {
			return _forSaleListEnabled;
		}
		
		// Gets link to the market
		function getMarketLink() {
			return _storeLink;
		}
		
		// Gets link to account for the market
		function getAccountLink() {
			return _accountLink;
		}
		
		// Helper function for making openSea API calls
		var queuedCalls = [];
		var numCallsPending = 0;
		function getJSON(url, query) {
			
			var checkWaitingCalls = function() {
				while(queuedCalls.length > 0 && numCallsPending < _maxConcurrentCalls) {
					var call = queuedCalls.shift();
					makeCall(call.url, call.query, call.resolve, call.reject);
				}
			}
			
			var makeCall = function(url, query, resolve, reject) {
				numCallsPending++;
				$.ajax({
					url: url,
					method: 'GET',
					contentType: 'application/json; charset=utf-8',
					dataType: 'json',
					data: query,
					cache: false,
					beforeSend: function(xhr) {
						xhr.setRequestHeader('X-API-KEY', _apiKey);
					},
					success: function(data){
						numCallsPending--;
						checkWaitingCalls();
						resolve(data);
					},
					error: function(xhr, textStatus, errorThrown) {
						numCallsPending--;
						checkWaitingCalls();
						reject(textStatus);
					}
				});
			}
			
			return $q(function(resolve, reject) {
				if(numCallsPending < _maxConcurrentCalls) makeCall(url, query, resolve, reject);
				else queuedCalls.push({url: url, query: query, resolve: resolve, reject: reject});
			});
		}
		
	}
}());