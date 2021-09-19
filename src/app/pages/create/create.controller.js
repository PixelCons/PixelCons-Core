(function () {
	angular.module('App')
		.controller('CreatePageCtrl', CreatePageCtrl);

	CreatePageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$mdToast', '$location', '$window', '$sce', 'web3Service', 'coreContract', 'decoder'];
	function CreatePageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $mdToast, $location, $window, $sce, web3Service, coreContract, decoder) {
		var _this = this;
		_this.setPixel = setPixel;
		_this.setColor = setColor;
		_this.clear = clear;
		_this.create = create;
		_this.createCollection = createCollection;
		_this.canCreate = canCreate;
		_this.canCreateCollection = canCreateCollection;
		_this.setTab = setTab;
		_this.filterPixelconName = filterPixelconName;
		_this.removeAdvPixelcon = removeAdvPixelcon;
		_this.tabSelection = ($routeParams.view == 'advanced') ? 'advanced' : ($routeParams.view == 'collection') ? 'collection' : 'canvas';
		_this.pixelconId = '';
		_this.selectedColor = 0;
		_this.colorPalette = {
			'0': '#000000',
			'1': '#1D2B53',
			'2': '#7E2553',
			'3': '#008751',
			'4': '#AB5236',
			'5': '#5F574F',
			'6': '#C2C3C7',
			'7': '#FFF1E8',
			'8': '#FF004D',
			'9': '#FFA300',
			'10': '#FFFF27',
			'11': '#00E756',
			'12': '#29ADFF',
			'13': '#83769C',
			'14': '#FF77A8',
			'15': '#FFCCAA'
		}

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Start with blank canvas
		_this.canvasPixels = [];
		for (let i = 0; i < 64; i++) _this.canvasPixels[i] = 0;
		generatePixelconId();

		// Check if create is supported
		checkCreateSupported();
		function checkCreateSupported() {
			let web3state = web3Service.getState();
			if (web3state == "ready") {
				if (web3Service.getActiveAccount()) {
					_this.showButtons = true;
				} else {
					if (web3Service.isReadOnly()) {
						_this.infoText = 'You need an Account to create PixelCons';
						_this.showStartButton = true;
					} else if (web3Service.isPrivacyMode()) {
						_this.infoText = 'Please connect your Account';
					} else {
						_this.infoText = 'Please log into ' + web3Service.getProviderName();
					}
					_this.showButtons = false;
				}
			} else if (web3state == "not_enabled") {
				_this.infoText = 'You need an Account to create PixelCons';
				_this.showStartButton = true;
				_this.showButtons = false;
			} else {
				_this.infoText = 'Unkown Network Error';
				_this.showButtons = false;
			}
			fetchForCollection();
		}

		// Set pixel to the selected color
		function setPixel(index, $event) {
			if ($event && $event.buttons != 1) return;
			_this.canvasPixels[index] = _this.selectedColor;
			generatePixelconId();
		}

		// Set color
		function setColor(index) {
			_this.selectedColor = index;
		}

		// Create the pixelcon
		function create(ev) {
			$mdDialog.show({
				controller: 'PixelconDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.pixelcon'],
				parent: angular.element(document.body),
				locals: { pixelconId: _this.pixelconId },
				bindToController: true,
				clickOutsideToClose: true
			});
		}

		// Create the pixelcon collection
		function createCollection(ev) {
			let pixelconIds = [];
			for (let i = 0; i < _this.collectionPixelcons.length; i++) {
				if (_this.collectionPixelcons[i].selected) pixelconIds.push(_this.collectionPixelcons[i].id);
			}
			$mdDialog.show({
				controller: 'CollectionDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.collection'],
				parent: angular.element(document.body),
				locals: { pixelconIds: pixelconIds },
				bindToController: true,
				clickOutsideToClose: true
			});
		}

		// Checks if valid state for creating a pixelcon
		function canCreate() {
			if(_this.tabSelection=='canvas') {
				return _this.pixelconId != '0x0000000000000000000000000000000000000000000000000000000000000000';
			} else {
				return _this.advancedPixelcons && _this.advancedPixelcons.length > 0;
			}
		}

		// Checks if valid state for creating a pixelcon collection
		function canCreateCollection() {
			if(_this.tabSelection=='collection') {
				let selectCount = 0;
				if(_this.collectionPixelcons) {
					for(let i = 0; i < _this.collectionPixelcons.length; i++) {
						if(_this.collectionPixelcons[i].selected) selectCount++;
					}
				}
				return selectCount > 1;
			} else {
				return _this.advancedPixelcons && _this.advancedPixelcons.length > 0;
			}
		}
		
		// Clear the canvas
		function clear(ev) {
			if(_this.tabSelection=='canvas') {
				for (let i = 0; i < 64; i++) _this.canvasPixels[i] = 0;
				generatePixelconId();
			} else if(_this.tabSelection=='collection') {
				if(_this.collectionPixelcons) {
					for(let i = 0; i < _this.collectionPixelcons.length; i++) {
						_this.collectionPixelcons[i].selected = false;
					}
				}
			} else {
				_this.alreadyCreatedPixelconIds = null;
				_this.advancedPixelcons = null;
			}
		}
		
		// Sets the tab mode
		function setTab(selection) {
			if(_this.tabSelection != selection) {
				_this.tabSelection = selection;
				if (($routeParams.view === undefined && _this.tabSelection != 'canvas') || ($routeParams.view !== undefined && _this.tabSelection != $routeParams.view)) {
					$location.search('view', (_this.tabSelection == 'advanced') ? 'advanced' : (_this.tabSelection == 'collection') ? 'collection' : undefined).replace();
				}
			}
		}
		
		// Queries for collection creating data
		function fetchForCollection() {
			if(_this.tabSelection == 'collection') {
				let account = web3Service.getActiveAccount();
				if(account) {
					_this.loading = true;
					_this.error = null;
					_this.collectionPixelcons = [];
					coreContract.fetchPixelconsByCreator(account).then(function(pixelcons) {
						_this.loading = false;
						
						//filter to only what is owned and not already in a collection
						for(let i = 0; i < pixelcons.length; i++) {
							if(pixelcons[i].owner == account && !pixelcons[i].collection) {
								_this.collectionPixelcons.push(pixelcons[i]);
							}
						}
					}, function (reason) {
						_this.loading = false;
						_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
					});
				} else {
					
					//simply show blank page
					_this.collectionPixelcons = [];
				}
			}
		}
		
		// Processes an uploaded file for create
		$window.advancedCreateFileUpload = function(input) {
			let file = input.files[0];
			input.value = '';
			
			if(file) {
				_this.loading = true;
				let ids = [];
				decoder.decodePNG(file).then(function(decodedIds) {
					ids = decodedIds;
					coreContract.fetchPixelconsByIds(ids).then(function(pixelcons) {
						_this.loading = false;
						_this.alreadyCreatedPixelconIds = [];
						_this.advancedPixelcons = []
						
						//determine which ids already exist
						for(let i = 0; i < ids.length; i++) {
							let exists = false;
							for(let j = 0; j < pixelcons.length; j++) {
								if(ids[i] == pixelcons[j].id) {
									exists = true;
									break;
								}
							}
							if(exists) {
								_this.alreadyCreatedPixelconIds.push(ids[i]);
							} else {
								_this.advancedPixelcons.push({
									id: ids[i],
									name: null
								});
							}
						}
					}, function(err) {
						//failed to validate
						_this.loading = false;
						_this.alreadyCreatedPixelconIds = [];
						_this.advancedPixelcons = [];
						
						//assume they are all good
						for(let i = 0; i < ids.length; i++) {
							_this.advancedPixelcons.push({
								id: ids[i],
								name: null
							});
						}
					});
				}, function(err) {
					// failed to decode
					_this.loading = false;
					$mdToast.show(
						$mdToast.simple()
							.action('Templates')
							.highlightAction(true)
							.highlightClass('md-warn')
							.textContent('Failed to decode PNG! (see tempates for working examples)')
							.position('top right')
							.hideDelay(10000)
					).then(function(response) {
						if (response === 'ok') {
							$window.open('/data/PixelCons_AdvancedCreatorTemplates.zip');
						}
					});
				});
			}
		}

		// Filter name
		function filterPixelconName(pixelcon) {
			pixelcon.name = web3Service.filterTextToByteSize(pixelcon.name, 12);
		}

		// Removes the advanced pixelcon from the list
		function removeAdvPixelcon(index) {
			_this.advancedPixelcons.splice(index, 1);
		}

		// Generate the pixelcon id from canvas
		function generatePixelconId() {
			_this.pixelconId = '0x';
			let hexDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
			for (let i = 0; i < 64; i++) _this.pixelconId += hexDigits[_this.canvasPixels[i]];
		}
		
		// Checks if page needs to be reloaded
		function checkReload(transactionData) {
			if (transactionData && transactionData.success && transactionData.pixelcons) {
				let effectsLoadedPixelcons = false;
				for(let i = 0; i < transactionData.pixelcons.length; i++) {
					if(_this.tabSelection == 'collection') {
						if(_this.collectionPixelcons) {
							for(let j = 0; j < _this.collectionPixelcons.length; j++) {
								if(transactionData.pixelcons[i].id == _this.collectionPixelcons[j].id) {
									effectsLoadedPixelcons = true;
									break;
								}
							}
						}
					} else if(_this.tabSelection == 'advanced') {
						if(_this.advancedPixelcons) {
							for(let j = 0; j < _this.advancedPixelcons.length; j++) {
								if(transactionData.pixelcons[i].id == _this.advancedPixelcons[j].id) {
									effectsLoadedPixelcons = true;
									break;
								}
							}
						}
					}
					if(effectsLoadedPixelcons) break;
				}
				
				//reload any necessary page details
				if(effectsLoadedPixelcons) {
					if(_this.tabSelection == 'collection') {
						fetchForCollection();
					} else if(_this.tabSelection == 'advanced') {
						clear();
					}
				}
			}
		}

		// Listen for network data changes
		web3Service.onNetworkChange(function () {
			if(_this.error) {
				if(_this.tabSelection == 'collection') fetchForCollection();
			}
		}, $scope, true);

		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			checkCreateSupported();
		}, $scope);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(checkReload, $scope);
	}
}());
