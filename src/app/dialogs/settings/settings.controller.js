(function () {
	angular.module('App')
		.controller('SettingsDialogCtrl', SettingsDialogCtrl);

	SettingsDialogCtrl.$inject = ['$scope', '$route', '$mdMedia', '$mdDialog', '$sce', 'web3Service'];
	function SettingsDialogCtrl($scope, $route, $mdMedia, $mdDialog, $sce, web3Service) {
		var _this = this;
		_this.closeDialog = closeDialog;
		_this.apply = apply;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Load initial data
		var mainNetwork = web3Service.getMainNetwork();
		_this.networkName = mainNetwork.name + ' RPC';
		_this.networkRPC = web3Service.getFallbackRPC(mainNetwork.chainId);
		
		// Applies the set values
		function apply() {
			web3Service.setFallbackRPC(mainNetwork.chainId, _this.networkRPC);
			$mdDialog.cancel();
			$route.reload();
		}

		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
		}
		
		// Close the dialog if page/account changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);
	}
}());
