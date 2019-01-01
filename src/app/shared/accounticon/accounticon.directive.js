(function () {
	angular.module('App')
		.directive('accounticon', accounticon)
		.controller('AccountIconCtrl', AccountIconCtrl);

	AccountIconCtrl.$inject = ['$scope', '$location', '$timeout', 'web3Service'];
	function AccountIconCtrl($scope, $location, $timeout, web3Service) {
		var _this = this;
		_this.account = web3Service.getActiveAccount();
		_this.iconClicked = iconClicked;
		_this.getCompressedAddressString = getCompressedAddressString;
		var reserveAddresses = [
			'0x421ec412e458c9c57cbdb3fe8510b8b08a02af2a',
			'0x2c755a1231bcabb363598277c52be7865d365257',
			'0xd99f18ecc67d0b4011fd6ac8425422bf733b05fc'
		];
		
		// Standardize the size [xs, sm, md, lg, xl]
		$scope.$watch('ctrl.size', function() {
			if(!_this.size) _this.size = 'md';
			if(_this.size == 'xs') _this.size = 'sm';
			if(_this.size == 'xl') _this.size = 'lg';
		});
		
		// Standardize the max address chars [integer]
		$scope.$watch('ctrl.maxChars', function() {
			if(_this.maxChars && Number.isInteger(parseInt(_this.maxChars)) && parseInt(_this.maxChars) > 0) _this.maxChars = parseInt(_this.maxChars);
			else _this.maxChars = null;
		});
		
		// Standardize the mode [icon, signature]
		$scope.$watch('ctrl.mode', function() {
			if(!_this.mode) _this.mode = 'icon';
		});
		
		// Standardize clickable flag [boolean]
		$scope.$watch('ctrl.clickable', function() {
			_this.clickable = (_this.clickable===true || _this.clickable=='true');
		});
		
		// Watch for address changes
		$scope.$watch('ctrl.address', function() {
			_this.isReserveAddress = false;
			_this.addressIcon = null;
			if(_this.address) {
				if(reserveAddresses.indexOf(_this.address) > -1) {
					_this.isReserveAddress = true;
					if(_this.mode=='signature') _this.text = "Reserved";
				}
				
				_this.address = _this.address.toLowerCase();
				_this.addressIcon = blockies.create({
					seed: _this.address.toLowerCase(),
					size: 8,
					scale: 6
				}).toDataURL();
			}
		});
		
		// Icon was clicked on
		function iconClicked() {
			if(_this.clickable) {
				$location.url('/creator/'+_this.address);
			}
		}
		
		// Compresses the address string
		function getCompressedAddressString(address) {
			var comp = address || '';
			if(_this.maxChars) {
				comp = comp.substr(0, _this.maxChars/2) + '...' + comp.substr(comp.length - (_this.maxChars/2));
			}
			
			return comp;
		}
		
		// Set flag the directive as loaded
		$timeout(function () {
			_this.loaded = true;
		});
		
		// Listen for account data changes
		web3Service.onAccountDataChange(function(){
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
