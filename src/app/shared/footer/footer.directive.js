(function () {
	angular.module('App')
		.directive('appFooter', appFooter)
		.controller('FooterCtrl', FooterCtrl);

	FooterCtrl.$inject = ['$scope', '$mdMedia', '$location', '$mdDialog', 'web3Service', 'coreContract'];
	function FooterCtrl($scope, $mdMedia, $location, $mdDialog, web3Service, coreContract) {
		var _this = this;
		_this.tip = tip;
		_this.goPath = goPath;
		checkAccount();
		
		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function() { return $mdMedia('gt-md'); }, function(lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function() { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function(md) { _this.screenSize['md'] = md; });
		$scope.$watch(function() { return $mdMedia('xs'); }, function(sm) { _this.screenSize['sm'] = sm; });
		
		// Go to the specified path
		function goPath(path) {
			if($location.path() != path) $location.url(path);
		}
		
		// Tip the developer
		function tip(ev) {
			$mdDialog.show({
				controller: 'SendDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: 'app/shared/dialogs/send/send.view.html',
				parent: angular.element(document.body),
				locals:{ethMode: true},
				bindToController: true,
				clickOutsideToClose: true
			});
		}
		
		// Account change
		function checkAccount() {
			var web3state = web3Service.getState();
			_this.noWeb3 = (web3state=="not_enabled" || web3Service.isReadOnly());
		}
		
		// Listen for account data changes
		web3Service.onAccountDataChange(checkAccount, $scope);	
	}

	function appFooter() {
		return {
			restrict: 'E',
			scope: {},
			bindToController: true,
			controller: 'FooterCtrl',
			controllerAs: 'ctrl',
			templateUrl: 'app/shared/footer/footer.view.html'
		};
	}
}());
