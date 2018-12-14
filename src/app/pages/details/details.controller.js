(function () {
	angular.module('App')
		.controller('DetailsPageCtrl', DetailsPageCtrl);

	DetailsPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$timeout', '$location', 'web3Service', 'coreContract', 'marketContract'];
	function DetailsPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $timeout, $location, web3Service, coreContract, marketContract) {
		var _this = this;
		var pixelconDetails;
		_this.rename = rename;
		_this.create = create;
		_this.send = send;
		_this.goPath = goPath;
		_this.clickMarketButton = clickMarketButton;
		_this.generateSigText = generateSigText;
		_this.canMakeListings = marketContract.canMakeListings();
		
		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function() { return $mdMedia('gt-md'); }, function(lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function() { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function(md) { _this.screenSize['md'] = md; });
		$scope.$watch(function() { return $mdMedia('xs'); }, function(sm) { _this.screenSize['sm'] = sm; });
		
		// Format id (set to null if invalid)
		var pixelconId = coreContract.formatPixelconId($routeParams.id);
		_this.pixelconId = pixelconId;
		
		// Get details for the pixelcon id
		loadPixelconDetails();
		function loadPixelconDetails(pixelcon) {
			_this.details = null;
			_this.unclaimed = false;
			
			if(pixelcon) {
				setPixelconDetails(pixelcon);
			} else {
				_this.loading = true;
				coreContract.fetchPixelcon(pixelconId).then(function(pixelcon) {
					_this.loading = false;
					if(pixelcon) {
						setPixelconDetails(pixelcon);
					} else {
						if(web3Service.isReadOnly()) _this.error = 'This PixelCon does not exist yet...';
						else _this.unclaimed = true;
					}
				}, function(reason) {
					_this.loading = false;
					_this.error = reason;
				});
			}
		}
		
		// Update from transaction
		function updateFromTransaction(transactionData) {
			if(transactionData && transactionData.success) {
				var pixelcon = null;
				if(transactionData.pixelcons) pixelcon = findInList(transactionData.pixelcons);
				else if(transactionData.listings) pixelcon = filterWithList(transactionData.listings);
				
				if(pixelcon) {
					pixelcon = angular.extend({}, pixelconDetails, pixelcon);
					loadPixelconDetails(pixelcon);
				}
			}
		}
		
		// Sets page details to the given pixelcon data
		function setPixelconDetails(pixelcon) {
			pixelconDetails = pixelcon;
			_this.details = {
				index: pixelcon.index,
				owner: pixelcon.owner,
				creator: pixelcon.creator,
				name: pixelcon.name,
				number: 'Number ' + pixelcon.index,
				date: 'Created ' + (new Date(pixelcon.date)).toLocaleDateString(),
				collection: pixelcon.collection,
				listing: pixelcon.listing
			}
			checkPermissions();
		}
				
		// Checks permissions for the action buttons
		function checkPermissions() {
			var account = web3Service.getActiveAccount();
			if(_this.details && account) {
				_this.isOwner = account == _this.details.owner;
				_this.isCreator = account == _this.details.creator;
				_this.isSeller = _this.details.listing && account == _this.details.listing.seller;
			}
		}

		// Go to the specified path
		function goPath(path) {
			$location.url(path);
		}
			
		// Rename the pixelcon
		function rename(ev) {
			$mdDialog.show({
				controller: 'PixelconDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: 'app/shared/dialogs/pixelcon/pixelcon.view.html',
				parent: angular.element(document.body),
				locals:{pixelconId: _this.pixelconId, editMode: true},
				bindToController: true,
				clickOutsideToClose: true
			});
		}
		
		// Create the pixelcon
		function create(ev) {
			$mdDialog.show({
				controller: 'PixelconDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: 'app/shared/dialogs/pixelcon/pixelcon.view.html',
				parent: angular.element(document.body),
				locals:{pixelconId: _this.pixelconId},
				bindToController: true,
				clickOutsideToClose: true
			});
		}
		
		// Send pixelcon 
		function send(ev) {
			$mdDialog.show({
				controller: 'SendDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: 'app/shared/dialogs/send/send.view.html',
				parent: angular.element(document.body),
				locals:{pixelconId: _this.pixelconId},
				bindToController: true,
				clickOutsideToClose: true
			});
		}
		
		// Buy the pixelcon
		function buyPixelcon(ev) {
			if(_this.details.listing.timeLeft) {
				$mdDialog.show({
					controller: 'MarketListingDialogCtrl',
					controllerAs: 'ctrl',
					templateUrl: 'app/shared/dialogs/listing/listing.view.html',
					parent: angular.element(document.body),
					locals:{pixelconId: _this.pixelconId, pixelconIdx: _this.details.index, price:_this.details.listing.price, buyMode: true},
					bindToController: true,
					clickOutsideToClose: true
				});
			}
		}
		
		// Sell the pixelcon
		function sellPixelcon(ev) {
			$mdDialog.show({
				controller: 'SellPixelconDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: 'app/shared/dialogs/sell/sell.view.html',
				parent: angular.element(document.body),
				locals:{pixelconId: _this.pixelconId, pixelconIdx: _this.details.index},
				bindToController: true,
				clickOutsideToClose: true
			});
		}
		
		// Removes pixelcon sale listing
		function removeListing(ev) {
			$mdDialog.show({
				controller: 'MarketListingDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: 'app/shared/dialogs/listing/listing.view.html',
				parent: angular.element(document.body),
				locals:{pixelconId: _this.pixelconId, pixelconIdx: _this.details.index, removeMode: true},
				bindToController: true,
				clickOutsideToClose: true
			});
		}
		
		// Market button clicked
		function clickMarketButton(ev) {
			if(_this.isOwner) sellPixelcon(ev);
			else if(_this.isSeller) removeListing(ev);
			else buyPixelcon(ev);
		}
		
		// Generates signature text
		function generateSigText() {
			if(_this.details && _this.details.listing) {
				var hoursLeft = Math.floor(_this.details.listing.timeLeft/(60*60));
				if(hoursLeft>24) return Math.round(hoursLeft/24)+'d Left';
				if(hoursLeft==0) return "Market";
				return hoursLeft+'h Left';
			} else {
				return 'Owned By';
			}
		}
		
		// Gets page relevant pixelcon from list
		function findInList(list) {
			var pixelcon = null;
			if(list) {
				for(var i=0; i<list.length; i++) {
					if(list[i].id == _this.pixelconId) {
						pixelcon = list[i];
						break;
					}
				}
			}
			return pixelcon;
		}
		
		// Gets the relevant pixelcon with listing data removed
		function filterWithList(list) {
			var pixelcon = null;
			if(list) {
				for(var i=0; i<list.length; i++) {
					if(list[i].pixelconIndex == pixelconDetails.index) {
						pixelconDetails.owner = list[i].pixelconOwner;
						pixelconDetails.listing = list[i].listing;
						pixelcon = pixelconDetails;
						break;
					}
				}
			}
			return pixelcon;
		}
		
		// Set flag the directive as loaded
		$timeout(function () {
			_this.loaded = true;
		});
		
		// Listen for account data changes
		web3Service.onAccountDataChange(function(){
			checkPermissions();
		}, $scope);	
		
		// Listen for transactions
		web3Service.onWaitingTransactionsChange(updateFromTransaction, $scope);	
	}
}());
