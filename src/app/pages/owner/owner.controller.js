(function () {
	angular.module('App')
		.controller('OwnerPageCtrl', OwnerPageCtrl);

	OwnerPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$sce', 'web3Service', 'coreContract', 'market'];
	function OwnerPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $sce, web3Service, coreContract, market) {
		var _this = this;
		const loadStep = 80;
		const loadStepThreshold = 100;
		_this.owner = web3Service.formatAddress($routeParams.address);
		_this.ownerName = _this.owner;
		_this.getMaxWidth = getMaxWidth;
		_this.loadMore = loadMore;
		_this.copyLink = copyLink;
		_this.shareOnTwitter = shareOnTwitter;
		_this.shareOnFacebook = shareOnFacebook;
		_this.marketEnabled = market.isEnabled();
		_this.marketLink = market.getOwnerLink(_this.owner);

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Get details for the pixelcon id
		loadOwnerDetails();
		function loadOwnerDetails() {
			_this.loading = true;
			_this.error = null;
			coreContract.fetchPixelconsByAccount(_this.owner, {asynchronousLoad: true}).then(function(pixelcons) {
				_this.loading = false;
				_this.pixelcons = pixelcons;
				_this.displayPixelcons = _this.pixelcons.slice(0, _this.pixelcons.length < loadStepThreshold ? _this.pixelcons.length : loadStep);
			}, function (reason) {
				_this.loading = false;
				_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
			});
			
			web3Service.awaitState(function() {
				web3Service.reverseName(_this.owner).then(function(name){
					if(name) _this.ownerName = name;
				});
			}, true);
		}

		// Updates data from transactions
		function updateFromTransaction(transactionData) {
			if (transactionData && transactionData.success && transactionData.pixelcons) {
				for (let i = 0; i < transactionData.pixelcons.length; i++) {
					let pixelcon = transactionData.pixelcons[i];

					let found = false;
					for (let j = 0; j < _this.pixelcons.length; j++) {
						if (_this.pixelcons[j].id == pixelcon.id) {
							if (pixelcon.owner == _this.owner) { //update
								_this.pixelcons[j] = pixelcon;
							} else { //delete
								_this.pixelcons.splice(j, 1);
								j--;
							}
							found = true;
							break;
						}
					}
					if (!found && pixelcon.owner == _this.owner) { //insert
						_this.pixelcons.push(pixelcon);
					}
				}
				_this.displayPixelcons = _this.pixelcons.slice(0, _this.pixelcons.length < loadStepThreshold ? _this.pixelcons.length : loadStep);
			}
		}
		
		// Determines the max width given the number of pixelcons
		function getMaxWidth() {
			if(_this.pixelcons && _this.pixelcons.length > 0) {
				if(_this.screenSize['md']) {
					if(_this.pixelcons.length <= 8) return '500px';
					if(_this.pixelcons.length <= 10) return '600px';
					if(_this.pixelcons.length <= 12) return '700px';
					if(_this.pixelcons.length <= 21) return '810px';
					if(_this.pixelcons.length <= 27) return '1020px';
				} else if(_this.screenSize['lg']) {
					if(_this.pixelcons.length <= 6) return '500px';
					if(_this.pixelcons.length <= 8) return '550px';
					if(_this.pixelcons.length <= 10) return '670px';
					if(_this.pixelcons.length <= 12) return '790px';
					if(_this.pixelcons.length <= 21) return '910px';
					if(_this.pixelcons.length <= 27) return '1150px';
				}
			}
			return '1400px';
		}

		// Loads more pixelcons on the display
		function loadMore() {
			if(_this.pixelcons.length > _this.displayPixelcons.length) {
				let size = Math.min(_this.displayPixelcons.length + loadStep, _this.pixelcons.length);
				_this.displayPixelcons = _this.pixelcons.slice(0, size);
			}
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
			url += '&text=' + encodeURI("Check out these PixelCons!");
			return url;
		}

		// Share this page on facebook
		function shareOnFacebook() {
			let url = "https://www.facebook.com/sharer/sharer.php?u="
			url += encodeURI(document.URL);
			return url;
		}

		// Listen for network data changes
		web3Service.onNetworkChange(function () {
			if(_this.error) loadOwnerDetails();
		}, $scope);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(updateFromTransaction, $scope);
	}
}());
