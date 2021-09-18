(function () {
	angular.module('App')
		.controller('SendDialogCtrl', SendDialogCtrl);

	SendDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$sce', 'web3Service', 'coreContract', 'mergeContract'];
	function SendDialogCtrl($scope, $mdMedia, $mdDialog, $sce, web3Service, coreContract, mergeContract) {
		var _this = this;
		_this.closeDialog = closeDialog;
		_this.checkValid = checkValid;
		_this.checkValidAmount = checkValidAmount;
		_this.sendPixelcon = sendPixelcon;
		_this.sendEth = sendEth;
		_this.pixelconIds = cloneList(_this.pixelconIds);

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Validate the send data
		validate();
		function validate() {
			_this.currView = 'loading';
			if (_this.ethMode) {
				_this.title = 'Tip the Devs!';
				_this.toAddress = '0x9f2fedFfF291314E5a86661e5ED5E6f12e36dd37';

				let activeAccount = web3Service.getActiveAccount();
				if (activeAccount) {
					web3Service.verifySendEth(_this.toAddress).then(function (data) {
						_this.currView = 'sendEth';
						_this.cost = data.estCost;
					}, function (reason) {
						_this.currView = 'sendEthError';
					});
				} else {
					_this.currView = 'sendEthError';
				}
			} else {
				_this.title = 'Send PixelCon';
				let verifyPromise = null;
				if (_this.l1Mode) verifyPromise = mergeContract.verifyTransferL1Pixelcon(_this.pixelconIds[0]);
				else verifyPromise = coreContract.verifyTransferPixelcons(_this.pixelconIds);
				verifyPromise.then(function (data) {
					_this.currView = 'sendPixelcon';
					_this.cost = data.estCost;
				}, function (reason) {
					_this.currView = 'error';
					_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
				});
			}
		}

		// Check if address is valid
		function checkValid() {
			_this.canSend = web3Service.isAddress(_this.toAddress);
		}

		// Check if amount is valid
		function checkValidAmount() {
			_this.canSend = (_this.sendAmount > 0);
		}
		
		// Clones the given array
		function cloneList(list) {
			if(!list) return null;
			let clonedList = [];
			for(let i = 0; i < list.length; i++) {
				clonedList.push((' ' + list[i]).slice(1));
			}
			return clonedList;
		}

		// Send pixelcon
		function sendPixelcon() {
			if(_this.pixelconIds.length == 1) {
				if (_this.l1Mode) {
					let transaction = mergeContract.transferL1Pixelcon(_this.pixelconIds[0], web3Service.formatAddress(_this.toAddress));
					$mdDialog.hide({transaction: transaction});
				} else {
					let transaction = coreContract.transferPixelcon(_this.pixelconIds[0],web3Service.formatAddress( _this.toAddress));
					$mdDialog.hide({transaction: transaction});
				}
			} else {
				let transaction = coreContract.transferPixelcons(_this.pixelconIds, web3Service.formatAddress(_this.toAddress));
				$mdDialog.hide({transaction: transaction});
			}
		}

		// Send ether
		function sendEth() {
			let transaction = web3Service.sendEth(_this.toAddress, _this.sendAmount);
			$mdDialog.hide({transaction: transaction});
		}

		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
		}

		// Listen for network data changes
		web3Service.onNetworkChange(validate, $scope, true);

		// Close the dialog if page/account changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);
		web3Service.onAccountDataChange($mdDialog.cancel, $scope);
	}
}());
