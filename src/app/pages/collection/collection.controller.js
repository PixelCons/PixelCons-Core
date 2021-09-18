(function () {
	angular.module('App')
		.controller('CollectionPageCtrl', CollectionPageCtrl);

	CollectionPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$sce', 'web3Service', 'coreContract', 'market', 'decoder'];
	function CollectionPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $sce, web3Service, coreContract, market, decoder) {
		var _this = this;
		_this.index = $routeParams.index;
		_this.rename = rename;
		_this.clear = clear;
		_this.send = send;
		_this.getMaxWidth = getMaxWidth;
		_this.copyLink = copyLink;
		_this.shareOnTwitter = shareOnTwitter;
		_this.shareOnFacebook = shareOnFacebook;
		_this.marketEnabled = market.isEnabled();
		_this.marketLink = market.getCollectionLink();

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Get details for the pixelcon id
		loadCollectionDetails();
		function loadCollectionDetails() {
			_this.loading = true;
			_this.error = null;
			_this.cleared = false;
			_this.collection = null;
			coreContract.fetchCollection(_this.index).then(function (collection) {
				_this.loading = false;
				_this.cleared = (collection.pixelcons.length == 0);
				_this.collection = collection;
				_this.marketLink = market.getCollectionLink(_this.collection.index);
				setCollectionBackground();
				checkPermissions();
			}, function (reason) {
				_this.loading = false;
				_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
			});
		}
		
		// Updates the background image according to collection details
		function setCollectionBackground() {
			let backgroundImage = null;
			if(_this.collection) backgroundImage = decoder.backgroundPNG(_this.collection.pixelconIds, true);
			decoder.updateBackground(backgroundImage, '/collection', 500);
		}

		// Update from transaction
		function updateFromTransaction(transactionData) {
			if (transactionData && transactionData.success && transactionData.pixelcons && transactionData.pixelcons[0]) {
				let collection = transactionData.pixelcons[0].collection;
				let pixelconInCollection = false;
				if (_this.collection) {
					for (let i = 0; i < _this.collection.pixelcons.length; i++) {
						if (transactionData.pixelcons[0].id == _this.collection.pixelcons[i].id) {
							pixelconInCollection = true;
							break;
						}
					}
				}
				if (pixelconInCollection) {
					if (collection && collection.index == _this.collection.index) {
						updateCollectionDetails(collection);
					} else {
						clearCollectionDetails();
					}
				}
			}
		}

		// Updates the collection page
		function updateCollectionDetails(collection) {
			_this.cleared = false;
			_this.collection.name = collection.name;
		}

		// Clears the collection page
		function clearCollectionDetails() {
			_this.cleared = true;
			_this.collection.pixelcons = [];
			_this.collection.pixelconIds = [];
		}

		// Checks permissions for the action buttons
		function checkPermissions() {
			let account = web3Service.getActiveAccount();
			if (_this.collection && _this.collection.pixelcons) {
				_this.collectionOwner = null;
				for (let i = 0; i < _this.collection.pixelcons.length; i++) {
					if (_this.collectionOwner == null) _this.collectionOwner = _this.collection.pixelcons[i].owner;
					if (_this.collectionOwner != _this.collection.pixelcons[i].owner) {
						_this.collectionOwner = null;
						break;
					}
				}
			}
			if (_this.collection && _this.collection.creator && account) {
				_this.isCreator = (account == _this.collection.creator);
				_this.isOwner = (account == _this.collectionOwner);
			}
		}

		// Rename the pixelcon collection
		function rename(ev) {
			$mdDialog.show({
				controller: 'CollectionDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.collection'],
				parent: angular.element(document.body),
				locals: { pixelcons: _this.collection.pixelcons, index: _this.index, editMode: true },
				bindToController: true,
				clickOutsideToClose: true
			});
		}

		// Clear the pixelcon collection
		function clear(ev) {
			$mdDialog.show({
				controller: 'CollectionDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.collection'],
				parent: angular.element(document.body),
				locals: { pixelcons: _this.collection.pixelcons, index: _this.index, clearMode: true },
				bindToController: true,
				clickOutsideToClose: true
			});
		}

		// Send the entire pixelcon collection
		function send(ev) {
			$mdDialog.show({
				controller: 'SendDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.send'],
				parent: angular.element(document.body),
				locals: { pixelconIds: _this.collection.pixelconIds },
				bindToController: true,
				clickOutsideToClose: true
			});
		}
		
		// Determines the max width given the number of pixelcons
		function getMaxWidth() {
			if(_this.collection && _this.collection.pixelcons && _this.collection.pixelcons.length > 0) {
				if(_this.screenSize['md']) {
					if(_this.collection.pixelcons.length <= 8) return '500px';
					if(_this.collection.pixelcons.length <= 10) return '600px';
					if(_this.collection.pixelcons.length <= 12) return '700px';
					if(_this.collection.pixelcons.length <= 21) return '810px';
					if(_this.collection.pixelcons.length <= 27) return '1020px';
				} else if(_this.screenSize['lg']) {
					if(_this.collection.pixelcons.length <= 6) return '500px';
					if(_this.collection.pixelcons.length <= 8) return '550px';
					if(_this.collection.pixelcons.length <= 10) return '670px';
					if(_this.collection.pixelcons.length <= 12) return '790px';
					if(_this.collection.pixelcons.length <= 21) return '910px';
					if(_this.collection.pixelcons.length <= 27) return '1150px';
				}
			}
			return '1400px';
		}

		// Copies share link to the clipboard
		function copyLink() {
			let copyText = document.getElementById("copyToClipboard");
			copyText.value = document.URL;
			copyText.select();
			document.execCommand("copy");
		}

		// Share this page on twitter
		function shareOnTwitter() {
			let url = "https://twitter.com/intent/tweet?url=";
			url += encodeURI(document.URL);
			url += '&text=' + encodeURI("Check out this PixelCon collection!");
			return url;
		}

		// Share this page on facebook
		function shareOnFacebook() {
			let url = "https://www.facebook.com/sharer/sharer.php?u="
			url += encodeURI(document.URL);
			return url;
		}

		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			checkPermissions();
		}, $scope);

		// Listen for network data changes
		web3Service.onNetworkChange(function () {
			if(_this.error) loadCollectionDetails();
		}, $scope);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(updateFromTransaction, $scope);
	}
}());
