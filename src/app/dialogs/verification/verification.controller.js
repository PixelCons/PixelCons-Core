(function () {
	angular.module('App')
		.controller('VerificationDialogCtrl', VerificationDialogCtrl);

	VerificationDialogCtrl.$inject = ['$scope', '$route', '$mdMedia', '$mdDialog', '$mdToast', '$sce', 'web3Service'];
	function VerificationDialogCtrl($scope, $route, $mdMedia, $mdDialog, $mdToast, $sce, web3Service) {
		var _this = this;
		_this.closeDialog = closeDialog;
		_this.connect = connect;
		_this.signMessage = signMessage;
		_this.copyCode = copyCode;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Load initial data
		function initDialog() {
			_this.view = 'loading';
			web3Service.awaitState(function () {
				let account = web3Service.getActiveAccount();
				if (account) {
					_this.view = 'validate';
					
				} else if (web3Service.isPrivacyMode()) {
					_this.view = 'connect';
					
				} else if (web3Service.isReadOnly()) {
					_this.view = 'start';
					
				}
			}, true);
		}

		// Connect wallet
		function connect() {
			web3Service.requestAccess();
		}
		
		// Sign the verification message
		async function signMessage() {
			web3Service.requestAccess();
			let timestamp = (new Date((new Date()).toUTCString())).toUTCString();
			let message = "Verifying my PixelCons account (" + timestamp + ")";
			
			let signature = null;
			try {
				let account = web3Service.getActiveAccount();
				let signer = web3Service.getSigner();
				signature = await signer.signMessage(message);
			} catch(err) {
				console.log(err);
			}
			
			if(signature) {
				signature = signature + (new Date(timestamp)).getTime().toString(16);
				signature = signature.toLowerCase();
				_this.code = signature;
			}
		}
		
		// Copy verification code
		function copyCode() {
			let copyText = document.getElementById("copyToClipboard");
			copyText.value = _this.code;
			copyText.select();
			document.execCommand("copy");
			
			$mdToast.show(
				$mdToast.simple()
					.textContent('Copied Verification Code!')
					.position('top right')
					.hideDelay(1000)
			);
		}

		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
		}
		
		// Close the dialog if page/account changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);

		// Listen for account data changes
		web3Service.onAccountDataChange(initDialog, $scope, true);
		
		initDialog();
	}
}());