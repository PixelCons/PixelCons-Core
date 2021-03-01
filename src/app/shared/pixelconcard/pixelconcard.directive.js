(function () {
	angular.module('App')
		.directive('pixelconcard', pixelconcard)
		.controller('PixelConCardCtrl', PixelConCardCtrl);

	PixelConCardCtrl.$inject = ['$scope', '$mdDialog', '$location', '$timeout', 'web3Service', 'coreContract', 'market'];
	function PixelConCardCtrl($scope, $mdDialog, $location, $timeout, web3Service, coreContract, market) {
		var _this = this;
		_this.coverAlwaysOn = false;
		_this.groupInfoClick = groupInfoClick;
		_this.pixelconClick = pixelconClick;
		_this.marketEnabled = market.isEnabled();
		var clicking = false;

		// Watch for changes to the pixelcon data
		$scope.$watch('ctrl.pixelcon', function() {
			if(_this.loaded) {
				_this.reloading = true;
				$timeout(function () {
					_this.reloading = false;
				});
			} else {
				$timeout(function () {
					_this.loaded = true;
				});
			}
		});

		// Standardize the size [xs, sm, md, lg, xl]
		$scope.$watch('ctrl.size', function() {
			if(!_this.size) _this.size = 'md';
		});

		// Standardize disabled flag [boolean]
		$scope.$watch('ctrl.disabled', function() {
			_this.disabled = (_this.disabled===true || _this.disabled=='true');
		});

		// Standardize disable collection [boolean]
		$scope.$watch('ctrl.noCollection', function() {
			_this.noCollection = (_this.noCollection===true || _this.noCollection=='true');
		});

		// Standardize disable selling [boolean]
		$scope.$watch('ctrl.noSelling', function() {
			_this.noSelling = (_this.noSelling===true || _this.noSelling=='true');
		});

		// Standardize disable account [boolean]
		$scope.$watch('ctrl.noAccount', function() {
			_this.noAccount = (_this.noAccount===true || _this.noAccount=='true');
		});

		// Standardize disable click functionality [boolean]
		$scope.$watch('ctrl.noClick', function() {
			_this.noClick = (_this.noClick===true || _this.noClick=='true');
		});

		// Update to the loaded account
		function updateToAccount() {
			var activeAccount = web3Service.getActiveAccount();
			if(_this.account != activeAccount) {
				_this.account = activeAccount;
				_this.accountIcon = undefined;
				if(activeAccount) {
					_this.accountIcon = blockies.create({
							seed: activeAccount.toLowerCase(),
							size: 8,
							scale: 6
						}).toDataURL();
				}
			}
		}

		// Refresh pixelcon data
		function refreshPixelconData(pixelcon) {
			if(pixelcon) {
				_this.pixelcon = angular.extend({}, _this.pixelcon, pixelcon);
			} else {
				_this.pixelcon = null;
			}
		}

		// Update from transaction
		function updateFromTransaction(transactionData) {
			if(transactionData && transactionData.success && transactionData.pixelcons) {
				var pixelcon = findInList(transactionData.pixelcons);
				if(pixelcon) refreshPixelconData(pixelcon);
			}
		}

		// Pixelcon card clicked
		function pixelconClick(ev) {
			if (_this.noClick) return;
			if (clicking) {
				clicking = false;
			} else {
				$location.url('/details/' + _this.pixelcon.id);
			}
		}

		// Group info clicked
		function groupInfoClick(ev) {
			if (_this.noClick) return;
			clicking = true;
		}

		// Gets page relevant pixelcon from list
		function findInList(list) {
			var pixelcon = null;
			if(list) {
				for(var i=0; i<list.length; i++) {
					if(list[i].id == _this.pixelcon.id) {
						pixelcon = list[i];
						break;
					}
				}
			}
			return pixelcon;
		}

		// Listen for account data changes
		web3Service.onAccountDataChange(updateToAccount, $scope);
		updateToAccount();

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(updateFromTransaction, $scope);
	}

	function pixelconcard() {
		return {
			restrict: 'E',
			scope: {
				pixelcon: '=',
				size: '@',
				disabled: '@',
				noCollection: '@',
				noSelling: '@',
				noAccount: '@',
				noClick: '@'
			},
			bindToController: true,
			controller: 'PixelConCardCtrl',
			controllerAs: 'ctrl',
			templateUrl: HTMLTemplates['shared.pixelconcard']
		};
	}
}());
