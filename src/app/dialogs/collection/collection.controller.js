(function () {
	angular.module('App')
		.controller('CollectionDialogCtrl', CollectionDialogCtrl);

	CollectionDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$sce', 'web3Service', 'coreContract'];
	function CollectionDialogCtrl($scope, $mdMedia, $mdDialog, $sce, web3Service, coreContract) {
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

		// Generate list of pixelcon ids if not provided
		if(_this.pixelcons && !_this.pixelconIds) {
			_this.pixelconIds = [];
			for (let i = 0; i < _this.pixelcons.length; i++) _this.pixelconIds.push(_this.pixelcons[i].id);
		}

		// Validate the collection data
		validate();
		function validate() {
			_this.currView = 'loading';
			if (_this.clearMode) {
				_this.title = 'Clear Collection';
				coreContract.verifyClearCollection(_this.index, _this.pixelconIds).then(function (data) {
					_this.currView = 'clear';
					_this.cost = data.estCost;
				}, function (reason) {
					_this.currView = 'error';
					_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
				});
			} else if (_this.editMode) {
				_this.title = 'Edit Collection';
				coreContract.verifyUpdateCollection(_this.index, _this.pixelconIds).then(function (data) {
					_this.currView = 'rename';
					_this.collectionName = '';
					_this.cost = data.estCost;
				}, function (reason) {
					_this.currView = 'error';
					_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
				});
			} else {
				_this.title = 'Create Collection';
				if(_this.pixelcons) {
					coreContract.verifyCreatePixelconsCollection(_this.pixelconIds).then(function (data) {
						_this.currView = 'create';
						_this.collectionName = '';
						_this.cost = data.estCost;
					}, function (reason) {
						_this.currView = 'error';
						_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
					});
				} else {
					coreContract.verifyCreateCollection(_this.pixelconIds).then(function (data) {
						_this.currView = 'create';
						_this.collectionName = '';
						_this.cost = data.estCost;
					}, function (reason) {
						_this.currView = 'error';
						_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
					});
				}
			}
		}

		// Filter name
		function filterCollectionName() {
			_this.collectionName = web3Service.filterTextToByteSize(_this.collectionName, 16);
		}

		// Clears the pixelcon collection
		function clear() {
			let transaction = coreContract.clearCollection(_this.index, _this.pixelconIds);
			$mdDialog.hide({transaction: transaction});
		}

		// Update the pixelcon collection
		function update() {
			let transaction = coreContract.updateCollection(_this.index, _this.pixelconIds, _this.collectionName);
			$mdDialog.hide({transaction: transaction});
		}

		// Creates the pixelcon collection
		function create() {
			if(_this.pixelcons) {
				let transaction = coreContract.createPixelconsCollection(_this.pixelcons, _this.collectionName);
				$mdDialog.hide({transaction: transaction});
			} else {
				let transaction = coreContract.createCollection(_this.pixelconIds, _this.collectionName);
				$mdDialog.hide({transaction: transaction});
			}
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
