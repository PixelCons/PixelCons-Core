(function () {
	angular.module('App')
		.controller('SendDialogCtrl', SendDialogCtrl);

	SendDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$timeout', '$sce', 'web3Service', 'coreContract'];
	function SendDialogCtrl($scope, $mdMedia, $mdDialog, $timeout, $sce, web3Service, coreContract) {
		var _this = this;
		var validCheckTimeout;
		var validAddress;
		_this.closeDialog = closeDialog;
		_this.checkValid = checkValid;
		_this.checkValidAmount = checkValidAmount;
		_this.sendPixelcon = sendPixelcon;
		_this.sendEth = sendEth;

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
				_this.toAddress = 'pixelcons.eth';

				let activeAccount = web3Service.getActiveAccount();
				if (activeAccount) {
					web3Service.verifySendEth(_this.toAddress).then(function (data) {
						_this.currView = 'sendEth';
					}, function (reason) {
						_this.currView = 'sendEthError';
					});
				} else {
					_this.currView = 'sendEthError';
				}
			} else {
				_this.title = 'Send PixelCon';
				coreContract.verifyTransferPixelcon(_this.pixelconId).then(function (data) {
					_this.currView = 'sendPixelcon';
				}, function (reason) {
					_this.currView = 'error';
					_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
				});
			}
		}

		// Check if address is valid
		function checkValid() {
			_this.canSend = false;
			_this.canSendChecking = true;
			
			if(validCheckTimeout) $timeout.cancel(validCheckTimeout);
			validCheckTimeout = $timeout(async function() {
				validAddress = await web3Service.resolveName(_this.toAddress);
				_this.canSendChecking = false;
				_this.canSend = !!validAddress;
			}, 700);
		}

		// Check if amount is valid
		function checkValidAmount() {
			_this.canSend = (_this.sendAmount > 0);
		}

		// Send pixelcon
		function sendPixelcon() {
			let transaction = coreContract.transferPixelcon(_this.pixelconId, web3Service.formatAddress(validAddress));
			$mdDialog.hide({transaction: transaction});
		}

		// Send ether
		function sendEth() {
			let transaction = web3Service.sendEth(validAddress, _this.sendAmount);
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
