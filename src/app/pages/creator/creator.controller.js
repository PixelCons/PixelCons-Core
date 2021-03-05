(function () {
	angular.module('App')
		.controller('CreatorPageCtrl', CreatorPageCtrl);

	CreatorPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', 'coreContract'];
	function CreatorPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, coreContract) {
		var _this = this;
		_this.creator = $routeParams.address;
		_this.copyLink = copyLink;
		_this.shareOnTwitter = shareOnTwitter;
		_this.shareOnFacebook = shareOnFacebook;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Copies share link to the clipboard
		function copyLink() {
			var copyText = document.getElementById("copyToClipboard");
			copyText.value = document.URL;
			copyText.select();
			document.execCommand("copy");
		}

		// Share this page on twitter
		function shareOnTwitter() {
			var url = "https://twitter.com/intent/tweet?url=";
			url += encodeURI(document.URL);
			url += '&text=' + encodeURI("Check out this PixelCon creator!");
			window.open(url, '_blank');
		}

		// Share this page on facebook
		function shareOnFacebook() {
			var url = "https://www.facebook.com/sharer/sharer.php?u="
			url += encodeURI(document.URL);
			window.open(url, '_blank');
		}

		// Get details for the pixelcon id
		_this.loading = true;
		coreContract.fetchPixelconsByCreator($routeParams.address)
			.then(function (pixelcons) {
				_this.loading = false;

				_this.pixelcons = pixelcons;
			}, function (reason) {
				_this.loading = false;
				_this.error = reason;
			});
	}
}());
