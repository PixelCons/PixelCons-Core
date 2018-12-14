(function () {
	angular.module('App')
		.controller('CollectionPageCtrl', CollectionPageCtrl);

	CollectionPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$location', 'web3Service', 'coreContract'];
	function CollectionPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $location, web3Service, coreContract) {
		var _this = this;
		_this.index = $routeParams.index;
		_this.rename = rename;
		_this.clear = clear;
		
		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function() { return $mdMedia('gt-md'); }, function(lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function() { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function(md) { _this.screenSize['md'] = md; });
		$scope.$watch(function() { return $mdMedia('xs'); }, function(sm) { _this.screenSize['sm'] = sm; });
		
		// Get details for the pixelcon id
		loadCollectionDetails();
		function loadCollectionDetails() {
			_this.loading = true;
			_this.cleared = false;
			_this.collection = null;
			coreContract.fetchCollection(_this.index).then(function(collection) {
				_this.loading = false;
				_this.cleared = (collection.pixelcons.length == 0);
				_this.collection = collection;
				checkPermissions();
			}, function(reason) {
				_this.loading = false;
				_this.error = reason;
			});
		}
		
		// Update from transaction
		function updateFromTransaction(transactionData) {
			if(transactionData && transactionData.success && transactionData.pixelcons && transactionData.pixelcons[0]) {
				var collection = transactionData.pixelcons[0].collection;
				var pixelconInCollection = false;
				if(_this.collection) {
					for(var i=0; i<_this.collection.pixelcons.length; i++) {
						if(transactionData.pixelcons[0].id == _this.collection.pixelcons[i].id) {
							pixelconInCollection = true;
							break;
						}
					}
				}
				if(pixelconInCollection) {
					if(collection && collection.index == _this.collection.index) {
						updateCollectionDetails(collection);
					} else {
						clearCollectionDetails();
					}
				}
			}
		}
		
		// Updates the collection page
		function updateCollectionDetails(collection) {
			_this.cleared = false;
			_this.collection = collection;
		}
		
		// Clears the collection page
		function clearCollectionDetails() {
			_this.cleared = true;
			_this.collection.index = _this.collection.index;
			_this.collection.creator = null;
			_this.collection.name = '';
			_this.collection.pixelcons = [];
		}
			
		// Checks permissions for the action buttons
		function checkPermissions() {
			var account = web3Service.getActiveAccount();
			if(_this.collection.creator && account) {
				_this.isCreator = (account == _this.collection.creator);
				_this.isOwner = (_this.collection.pixelcons.length > 0);
				for(var i=0; i<_this.collection.pixelcons.length; i++) {
					if(_this.collection.pixelcons[i].owner != account) {
						_this.isOwner = false;
						break;
					}
				}
			}
		}
			
		// Rename the pixelcon collection
		function rename(ev) {
			$mdDialog.show({
				controller: 'CollectionDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: 'app/shared/dialogs/collection/collection.view.html',
				parent: angular.element(document.body),
				locals:{pixelcons: _this.collection.pixelcons, index: _this.index, editMode: true},
				bindToController: true,
				clickOutsideToClose: true
			});
		}
			
		// Clear the pixelcon collection
		function clear(ev) {
			$mdDialog.show({
				controller: 'CollectionDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: 'app/shared/dialogs/collection/collection.view.html',
				parent: angular.element(document.body),
				locals:{pixelcons: _this.collection.pixelcons, index: _this.index, clearMode: true},
				bindToController: true,
				clickOutsideToClose: true
			});
		}
		
		// Listen for account data changes
		web3Service.onAccountDataChange(function(){
			checkPermissions();
		}, $scope);	
		
		// Listen for transactions
		web3Service.onWaitingTransactionsChange(updateFromTransaction, $scope);	
	}
}());
