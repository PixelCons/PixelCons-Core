(function () {
	angular.module('App')
		.directive('accounticon', accounticon)
		.controller('AccountIconCtrl', AccountIconCtrl);

	AccountIconCtrl.$inject = ['$scope', '$timeout', 'web3Service'];
	function AccountIconCtrl($scope, $timeout, web3Service) {
		var _this = this;
		_this.account = web3Service.getActiveAccount();
		_this.getCompressedAddressString = getCompressedAddressString;
		
		// Standardize the size [xs, sm, md, lg, xl]
		$scope.$watch('ctrl.size', function () {
			if (!_this.size) _this.size = 'md';
			if (_this.size == 'xs') _this.size = 'sm';
			if (_this.size == 'xl') _this.size = 'lg';
		});

		// Standardize the max address chars [integer]
		$scope.$watch('ctrl.maxChars', function () {
			if (_this.maxChars && Number.isInteger(parseInt(_this.maxChars)) && parseInt(_this.maxChars) > 0) _this.maxChars = parseInt(_this.maxChars);
			else _this.maxChars = null;
		});

		// Standardize the mode [icon, signature]
		$scope.$watch('ctrl.mode', function () {
			if (!_this.mode) _this.mode = 'icon';
		});

		// Standardize clickable flag [boolean]
		$scope.$watch('ctrl.clickable', function () {
			_this.clickable = (_this.clickable === true || _this.clickable == 'true');
		});

		// Watch for address changes
		$scope.$watch('ctrl.address', function () {
			_this.addressIcon = null;
			if (_this.address) {
				_this.address = _this.address;
				_this.addressIcon = blockies.create({
					seed: _this.address.toLowerCase(),
					size: 8,
					scale: 6
				}).toDataURL();
			}
		});

		// Compresses the address string
		function getCompressedAddressString(address) {
			return web3Service.compressAddressString(address, _this.maxChars);
		}

		// Set flag the directive as loaded
		$timeout(function () {
			_this.loaded = true;
		});

		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			_this.account = web3Service.getActiveAccount();
		}, $scope);
	}

	function accounticon() {
		return {
			restrict: 'E',
			scope: {
				address: '=',
				size: '@',
				text: '@',
				maxChars: '@',
				mode: '@',
				clickable: '@'
			},
			bindToController: true,
			controller: 'AccountIconCtrl',
			controllerAs: 'ctrl',
			templateUrl: HTMLTemplates['shared.accounticon']
		};
	}
}());
