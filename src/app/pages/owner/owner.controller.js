(function () {
	angular.module('App')
		.controller('OwnerPageCtrl', OwnerPageCtrl);

	OwnerPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$sce', 'web3Service', 'coreContract', 'market'];
	function OwnerPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $sce, web3Service, coreContract, market) {
		var _this = this;
		_this.owner = $routeParams.address;
		_this.getMaxWidth = getMaxWidth;
		_this.copyLink = copyLink;
		_this.shareOnTwitter = shareOnTwitter;
		_this.shareOnFacebook = shareOnFacebook;
		_this.marketEnabled = market.isEnabled();
		_this.marketLink = market.getOwnerLink($routeParams.address);

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
			coreContract.fetchPixelconsByAccount($routeParams.address)
				.then(function (pixelcons) {
					_this.loading = false;
					_this.pixelcons = pixelcons;
				}, function (reason) {
					_this.loading = false;
					_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
				});
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
	}
}());
