(function () {
	angular.module('App')
		.controller('PixelconDialogCtrl', PixelconDialogCtrl);

	PixelconDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$sce', 'web3Service', 'coreContract'];
	function PixelconDialogCtrl($scope, $mdMedia, $mdDialog, $sce, web3Service, coreContract) {
		var _this = this;
		_this.filterPixelconName = filterPixelconName;
		_this.closeDialog = closeDialog;
		_this.update = update;
		_this.create = create;
		_this.pixelconIds = cloneList(_this.pixelconIds);

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

		// Validate the pixelcon data
		validate();
		function validate() {
			_this.currView = 'loading';
			if (_this.editMode) {
				_this.title = 'Edit PixelCon';
				coreContract.verifyUpdatePixelcon(_this.pixelconIds[0]).then(function (data) {
					_this.currView = 'rename';
					_this.pixelconName = '';
					_this.cost = data.estCost;
				}, function (reason) {
					_this.currView = 'error';
					_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
				});
			} else {
				_this.title = 'Create PixelCon';
				if(_this.pixelcons) {
					coreContract.verifyCreatePixelcons(_this.pixelconIds).then(function (data) {
						_this.currView = 'multiCreate';
						_this.cost = data.estCost;
					}, function (reason) {
						_this.currView = 'error';
						_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
					});
				} else {
					coreContract.verifyCreatePixelcon(_this.pixelconIds[0]).then(function (data) {
						_this.currView = 'create';
						_this.pixelconName = '';
						_this.cost = data.estCost;
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
		}

		// Filter name
		function filterPixelconName() {
			_this.pixelconName = web3Service.filterTextToByteSize(_this.pixelconName, 12);
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

		// Update the pixelcon
		function update() {
			let transaction = coreContract.updatePixelcon(_this.pixelconIds[0], _this.pixelconName);
			$mdDialog.hide({transaction: transaction});
		}

		// Creates the pixelcon
		function create() {
			if(_this.pixelcons) {
				let transaction = coreContract.createPixelcons(_this.pixelcons);
				$mdDialog.hide({transaction: transaction});
			} else {
				let transaction = coreContract.createPixelcon(_this.pixelconIds[0], _this.pixelconName);
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
