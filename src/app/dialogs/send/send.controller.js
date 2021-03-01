(function () {
	angular.module('App')
		.controller('SendDialogCtrl', SendDialogCtrl);

	SendDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', 'web3Service', 'coreContract'];
	function SendDialogCtrl($scope, $mdMedia, $mdDialog, web3Service, coreContract) {
		var _this = this;
		_this.closeDialog = closeDialog;
		_this.checkValid = checkValid;
		_this.checkValidAmount = checkValidAmount;
		_this.sendPixelcon = sendPixelcon;
		_this.sendEth = sendEth;
		_this.pixelconId = (' ' + _this.pixelconId).slice(1);

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function() { return $mdMedia('gt-md'); }, function(lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function() { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function(md) { _this.screenSize['md'] = md; });
		$scope.$watch(function() { return $mdMedia('xs'); }, function(sm) { _this.screenSize['sm'] = sm; });

		// Verify the pixelcon
		_this.currView = 'loading';
		if(_this.ethMode) {
			_this.title = 'Tip the Devs!';
			_this.toAddress = '0x9f2fedFfF291314E5a86661e5ED5E6f12e36dd37';

			var activeAccount = web3Service.getActiveAccount();
			if(activeAccount) {
				web3Service.verifySendEth().then(function(data) {
					_this.currView = 'sendEth';
					_this.cost = data.estCost;
				}, function(reason) {
					_this.currView = 'sendEthError';
				});
			} else {
				_this.currView = 'sendEthError';
			}
		} else {
			_this.title = 'Send PixelCon';

			coreContract.verifyTransferPixelcon(_this.pixelconId).then(function(data) {
				_this.currView = 'sendPixelcon';
				_this.cost = data.estCost;
			}, function(reason) {
				_this.currView = 'error';
				_this.error = reason;
			});
		}

		// Check if address is valid
		function checkValid() {
			_this.canSend = web3Service.isAddress(_this.toAddress);
		}

		// Check if amount is valid
		function checkValidAmount() {
			_this.canSend = (_this.sendAmount > 0);
		}

		// Send pixelcon
		function sendPixelcon() {
			var transaction = coreContract.transferPixelcon(_this.pixelconId, _this.toAddress);
			$mdDialog.hide(transaction);
		}

		// Send ether
		function sendEth() {
			var transaction = web3Service.sendEth(_this.toAddress, _this.sendAmount);
			$mdDialog.hide(transaction);
		}

		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
		}

		// Close the dialog if page/account changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);
		web3Service.onAccountDataChange($mdDialog.cancel, $scope);
	}
}());
