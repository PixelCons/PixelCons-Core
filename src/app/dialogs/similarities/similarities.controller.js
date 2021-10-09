(function () {
	angular.module('App')
		.controller('SimilaritiesDialogCtrl', SimilaritiesDialogCtrl);

	SimilaritiesDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$sce', 'web3Service', 'coreContract', 'similarities'];
	function SimilaritiesDialogCtrl($scope, $mdMedia, $mdDialog, $sce, web3Service, coreContract, similarities) {
		var _this = this;
		_this.title = "Similar PixelCons Search";
		_this.closeDialog = closeDialog;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Search fro similarities
		search();
		async function search() {
			try {
				_this.currView = 'loading';
				let allPixelcons = await coreContract.getAllPixelcons();
				let results = await similarities.searchSimilar(_this.pixelconId, allPixelcons);
				
				_this.currView = 'results';
				_this.pixelcon = results.pixelcon;
				_this.closeMatch = results.closeMatch;
				_this.similarCreator = results.similarCreator;
				_this.similarOther = results.similarOther;
				
			} catch(reason) {
				_this.currView = 'error';
				_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
			}
		}

		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
		}

		// Listen for network data changes
		web3Service.onNetworkChange(search, $scope, true);

		// Close the dialog if page/account changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);
	}
}());
