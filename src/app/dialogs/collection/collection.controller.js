(function () {
	angular.module('App')
		.controller('CollectionDialogCtrl', CollectionDialogCtrl);

	CollectionDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', 'web3Service', 'coreContract'];
	function CollectionDialogCtrl($scope, $mdMedia, $mdDialog, web3Service, coreContract) {
		var _this = this;
		_this.closeDialog = closeDialog;
		_this.filterCollectionName = filterCollectionName;
		_this.clear = clear;
		_this.update = update;
		_this.create = create;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Get list of just pixelconIdx
		var pixelconIds = [];
		var pixelconIdxs = [];
		for (var i = 0; i < _this.pixelcons.length; i++) {
			pixelconIds.push(_this.pixelcons[i].id);
			pixelconIdxs.push(_this.pixelcons[i].index);
		}

		// Estimate cost
		_this.currView = 'loading';
		if (_this.clearMode) {
			_this.title = 'Clear Collection';
			coreContract.verifyPixelconCollectionClear(_this.index, pixelconIds)
				.then(function (data) {
					_this.currView = 'clear';
					_this.cost = data.estCost;
				}, function (reason) {
					_this.currView = 'error';
					_this.error = reason;
				});
		} else if (_this.editMode) {
			_this.title = 'Edit Collection';
			coreContract.verifyPixelconCollectionEdit(_this.index, pixelconIds)
				.then(function (data) {
					_this.currView = 'rename';
					_this.collectionName = '';
					_this.cost = data.estCost;
				}, function (reason) {
					_this.currView = 'error';
					_this.error = reason;
				});
		} else {
			_this.title = 'Create Collection';
			coreContract.verifyPixelconCollection(pixelconIdxs, pixelconIds)
				.then(function (data) {
					_this.currView = 'create';
					_this.collectionName = '';
					_this.cost = data.estCost;
				}, function (reason) {
					_this.currView = 'error';
					_this.error = reason;
				});
		}

		// Filter name
		function filterCollectionName() {
			var filtered = "";
			for (var i = 0; i < _this.collectionName.length; i++) {
				var c = _this.collectionName.charAt(i);
				if (web3Service.fromUtf8(filtered + c).length <= 18) {
					filtered = filtered + c;
				} else {
					break;
				}
			}
			_this.collectionName = filtered;
		}

		// Clears the pixelcon collection
		function clear() {
			var transaction = coreContract.clearPixelconCollection(_this.index);
			$mdDialog.hide(transaction);
		}

		// Update the pixelcon collection
		function update() {
			var transaction = coreContract.updatePixelconCollection(_this.index, _this.collectionName);
			$mdDialog.hide(transaction);
		}

		// Creates the pixelcon collection
		function create() {
			var transaction = coreContract.createPixelconCollection(pixelconIdxs, _this.collectionName);
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
