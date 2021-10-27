(function () {
	angular.module('App')
		.controller('PixelconDialogCtrl', PixelconDialogCtrl);

	PixelconDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$sce', 'web3Service', 'coreContract', 'similarities'];
	function PixelconDialogCtrl($scope, $mdMedia, $mdDialog, $sce, web3Service, coreContract, similarities) {
		var _this = this;
		_this.filterPixelconName = filterPixelconName;
		_this.closeDialog = closeDialog;
		_this.update = update;
		_this.create = create;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Validate the pixelcon data
		validate();
		function validate() {
			_this.currView = 'loading';
			if (_this.editMode) {
				_this.title = 'Edit PixelCon';
				coreContract.verifyUpdatePixelcon(_this.pixelconId).then(function (data) {
					_this.currView = 'rename';
					_this.pixelconName = '';
				}, function (reason) {
					_this.currView = 'error';
					_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
				});
			} else {
				_this.title = 'Create PixelCon';
				coreContract.verifyCreatePixelcon(_this.pixelconId).then(function (data) {
					return coreContract.getAllPixelcons();
					
				}).then(function (allPixelcons) {
					_this.account = web3Service.getActiveAccount();
					_this.match = similarities.getMatch(_this.pixelconId, allPixelcons);
					if(_this.match) _this.match.verified = (_this.match.creator == _this.account);
					_this.currView = _this.match ? 'similarityAcknowledge' : 'create';
					_this.pixelconName = '';
					
				}, function (reason) {
					if(reason.indexOf('already exists') > -1) {
						_this.currView = 'duplicate';
					} else {
						_this.currView = 'error';
						_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
					}
				});
			}
		}

		// Filter name
		function filterPixelconName() {
			_this.pixelconName = web3Service.filterTextToByteSize(_this.pixelconName, 8);
		}

		// Update the pixelcon
		function update() {
			let transaction = coreContract.updatePixelcon(_this.pixelconId, _this.pixelconName);
			$mdDialog.hide({transaction: transaction});
		}

		// Creates the pixelcon
		function create() {
			let transaction = coreContract.createPixelcon(_this.pixelconId, _this.pixelconName);
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
