(function () {
	angular.module('App')
		.controller('SettingsDialogCtrl', SettingsDialogCtrl);

	SettingsDialogCtrl.$inject = ['$scope', '$route', '$mdMedia', '$mdDialog', '$sce', 'web3Service'];
	function SettingsDialogCtrl($scope, $route, $mdMedia, $mdDialog, $sce, web3Service) {
		var _this = this;
		_this.closeDialog = closeDialog;
		_this.apply = apply;
		const _l1ChainId = '31337';
		const _l2ChainId = '420';

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Load initial data
		_this.L1_RPC = web3Service.getFallbackRPC(_l1ChainId);
		_this.L2_RPC = web3Service.getFallbackRPC(_l2ChainId);
		
		// Applies the set values
		function apply() {
			web3Service.setFallbackRPC(_l1ChainId, _this.L1_RPC);
			web3Service.setFallbackRPC(_l2ChainId, _this.L2_RPC);
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
