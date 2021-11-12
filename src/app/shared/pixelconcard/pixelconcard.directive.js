(function () {
	angular.module('App')
		.directive('pixelconcard', pixelconcard)
		.controller('PixelConCardCtrl', PixelConCardCtrl);

	PixelConCardCtrl.$inject = ['$scope', '$mdDialog', '$location', '$timeout', 'web3Service', 'coreContract'];
	function PixelConCardCtrl($scope, $mdDialog, $location, $timeout, web3Service, coreContract) {
		var _this = this;
		_this.coverAlwaysOn = false;
		_this.infoItemClick = infoItemClick;
		_this.pixelconClick = pixelconClick;
		var clicking = false;

		// Watch for changes to the pixelcon data
		$scope.$watch('ctrl.pixelcon', function () {
			if (_this.loaded) {
				_this.reloading = true;
				$timeout(function () {
					_this.reloading = false;
				});
			} else {
				$timeout(function () {
					_this.loaded = true;
				});
			}
			refreshPixelconData(_this.pixelcon);
		});

		// Standardize the size [xs, sm, md, lg, xl]
		$scope.$watch('ctrl.size', function () {
			if (!_this.size) _this.size = 'md';
		});

		// Standardize disable collection [boolean]
		$scope.$watch('ctrl.noCollection', function () {
			_this.noCollection = (_this.noCollection === true || _this.noCollection == 'true');
		});

		// Standardize disable match [boolean]
		$scope.$watch('ctrl.noMatch', function () {
			_this.noMatch = (_this.noMatch === true || _this.noMatch == 'true');
		});

		// Standardize disable account [boolean]
		$scope.$watch('ctrl.noAccount', function () {
			_this.noAccount = (_this.noAccount === true || _this.noAccount == 'true');
		});

		// Standardize selectable functionality [boolean]
		$scope.$watch('ctrl.selectable', function () {
			_this.selectable = (_this.selectable === true || _this.selectable == 'true');
		});

		// Standardize disable functionality [boolean]
		$scope.$watch('ctrl.disabled', function () {
			_this.disabled = (_this.disabled === true || _this.disabled == 'true');
		});

		// Update to the loaded account
		updateToAccount();
		function updateToAccount() {
			let activeAccount = web3Service.getActiveAccount();
			_this.account = activeAccount;
		}

		// Refresh pixelcon data
		function refreshPixelconData(pixelcon) {
			if (pixelcon) {
				if(pixelcon.loadPromise) pixelcon.loadPromise.then(refreshPixelconData);
				_this.loading = !!pixelcon.loadPromise;
				_this.pixelcon = angular.extend(_this.pixelcon, _this.pixelcon, pixelcon);
				scramblePixelconCollection();
			} else {
				_this.pixelcon = null;
			}
		}

		// Update from transaction
		function updateFromTransaction(transactionData) {
			if (transactionData && transactionData.success && transactionData.pixelcons) {
				let pixelcon = findInList(transactionData.pixelcons);
				if (pixelcon) refreshPixelconData(pixelcon);
			}
		}
		
		// Scramble pixelcon collection
		function scramblePixelconCollection() {
			if(_this.pixelcon && _this.pixelcon.collection) {
				_this.scrambledCollectionPixelconIds = web3Service.scrambleList(_this.pixelcon.collection.pixelconIds, _this.pixelcon.id);
			} else {
				_this.scrambledCollectionPixelconIds = null;
			}
		}

		// Pixelcon card clicked
		function pixelconClick(ev) {
			if (_this.disabled) return;
			if (_this.selectable) {
				_this.pixelcon.selected = !_this.pixelcon.selected;
			} else {
				if (clicking) {
					clicking = false;
				} else {
					$location.url('/details/' + _this.pixelcon.id);
				}
			}
		}

		// Info item clicked
		function infoItemClick(ev) {
			if (_this.selectable || _this.disabled || !_this.dirHover) return;
			clicking = true;
		}

		// Gets page relevant pixelcon from list
		function findInList(list) {
			let pixelcon = null;
			if (list) {
				for (let i = 0; i < list.length; i++) {
					if (list[i].id == _this.pixelcon.id) {
						pixelcon = list[i];
						break;
					}
				}
			}
			return pixelcon;
		}

		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			updateToAccount();
		}, $scope);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(updateFromTransaction, $scope);
	}

	function pixelconcard() {
		return {
			restrict: 'E',
			scope: {
				pixelcon: '=',
				size: '@',
				noCollection: '@',
				noMatch: '@',
				noAccount: '@',
				selectable: '@',
				disabled: '@'
			},
			bindToController: true,
			controller: 'PixelConCardCtrl',
			controllerAs: 'ctrl',
			templateUrl: HTMLTemplates['shared.pixelconcard']
		};
	}
}());
