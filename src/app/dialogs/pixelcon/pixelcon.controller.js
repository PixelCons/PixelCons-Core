(function () {
	angular.module('App')
		.controller('PixelconDialogCtrl', PixelconDialogCtrl);

	PixelconDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$location', 'web3Service', 'coreContract'];
	function PixelconDialogCtrl($scope, $mdMedia, $mdDialog, $location, web3Service, coreContract) {
		var _this = this;
		_this.filterPixelconName = filterPixelconName;
		_this.goPath = goPath;
		_this.closeDialog = closeDialog;
		_this.update = update;
		_this.create = create;
		_this.pixelconId = (' ' + _this.pixelconId).slice(1);

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Verify the pixelcon
		_this.currView = 'loading';
		if (_this.editMode) {
			_this.title = 'Edit PixelCon';
			coreContract.verifyPixelconEdit(_this.pixelconId)
				.then(function (data) {
					_this.currView = 'rename';
					_this.pixelconName = '';
					_this.cost = data.estCost;
				}, function (reason) {
					_this.currView = 'error';
					_this.error = reason;
				});
		} else {
			_this.title = 'Create PixelCon';
			coreContract.verifyPixelcon(_this.pixelconId)
				.then(function (data) {
					if (data.owner) {
						_this.currView = 'duplicate';
					} else {
						_this.currView = 'create';
						_this.pixelconName = '';
						_this.cost = data.estCost;
					}
				}, function (reason) {
					_this.currView = 'error';
					_this.error = reason;
				});
		}

		// Filter name
		function filterPixelconName() {
			var filtered = "";
			for (var i = 0; i < _this.pixelconName.length; i++) {
				var c = _this.pixelconName.charAt(i);
				if (web3Service.fromUtf8(filtered + c).length <= 18) {
					filtered = filtered + c;
				} else {
					break;
				}
			}
			_this.pixelconName = filtered;
		}

		// Update the pixelcon
		function update() {
			var transaction = coreContract.updatePixelcon(_this.pixelconId, _this.pixelconName);
			$mdDialog.hide(transaction);
		}

		// Creates the pixelcon
		function create() {
			var transaction = coreContract.createPixelcon(_this.pixelconId, _this.pixelconName);
			$mdDialog.hide(transaction);
		}

		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
		}

		// Goes to the specified path
		function goPath(path) {
			$location.url(path);
		}

		// Close the dialog if page/account changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);
		web3Service.onAccountDataChange($mdDialog.cancel, $scope);
	}
}());
