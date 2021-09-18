(function () {
	angular.module('App')
		.controller('AccountPageCtrl', AccountPageCtrl);

	AccountPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$mdToast', '$routeParams', '$timeout', '$location', '$sce', 'web3Service', 'coreContract', 'mergeContract', 'market', 'decoder'];
	function AccountPageCtrl($scope, $mdMedia, $mdDialog, $mdToast, $routeParams, $timeout, $location, $sce, web3Service, coreContract, mergeContract, market, decoder) {
		var _this = this;
		_this.pixelcons = [];
		_this.accountAddress;
		_this.filter = {
			sortBy: ($routeParams.sortBy == 'name') ? 'name' : 'dateCreated',
			sortDesc: $routeParams.asc != 'true'
		}
		_this.selectionMode = null;
		_this.checkUpdateData = checkUpdateData;
		_this.setSortOrder = setSortOrder;
		_this.setSelectionMode = setSelectionMode;
		_this.getNumSelected = getNumSelected;
		_this.checkDisabled = checkDisabled;
		_this.checkSelectModeActionable = checkSelectModeActionable;
		_this.send = send;
		_this.mergeL1 = mergeL1;
		_this.createL1 = createL1;
		_this.withdrawL1 = withdrawL1;
		_this.marketEnabled = market.isEnabled();
		_this.marketAccountLink = market.getAccountLink();

		var loadedFilter = {};
		checkUpdateData(true);

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-sm'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-sm'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Check if data parameters have changed
		function checkUpdateData(forceDataFetch) {
			web3Service.awaitState(function () {
				//update url parameters
				if (($routeParams.sortBy === undefined && _this.filter.sortBy == 'name') || ($routeParams.sortBy !== undefined && _this.filter.sortBy != $routeParams.sortBy)) {
					$location.search('sortBy', (_this.filter.sortBy == 'name') ? 'name' : undefined).replace();
				}
				if (($routeParams.asc === undefined && !_this.filter.sortDesc) || ($routeParams.asc !== undefined && _this.filter.sortDesc == ($routeParams.asc == 'true'))) {
					$location.search('asc', (!_this.filter.sortDesc) ? 'true' : undefined).replace();
				}

				//force upgrade?
				if (forceDataFetch) {
					_this.accountAddress = 'invalid';
					loadedFilter = JSON.parse(JSON.stringify(_this.filter));
				}

				//loaded address changed?
				let account = web3Service.getActiveAccount();
				if ((account == null && _this.accountAddress != null) || (account != null && _this.accountAddress == null)
					|| (account != null && _this.accountAddress != null && account != _this.accountAddress)) {
					_this.marketAccountLink = market.getAccountLink(account);
					_this.accountAddress = account;
					_this.accountIcon = undefined;
					if (account) {
						_this.accountIcon = blockies.create({
							seed: account.toLowerCase(),
							size: 8,
							scale: 6
						}).toDataURL();
					}
					fetchData();
					return;
				}

				//filter parameters changed?
				let needToSort = false;
				for (let i in _this.filter) {
					if (_this.filter[i] != loadedFilter[i]) {
						needToSort = true;
						break;
					}
				}
				if (needToSort) {
					loadedFilter = JSON.parse(JSON.stringify(_this.filter));
					sortData();
				}
			}, true);
		}

		// Fetches data according to set address
		function fetchData() {
			_this.pixelcons = [];

			//get new data
			if (_this.accountAddress) {
				_this.loading = true;
				_this.error = null;
				
				//get l2 pixelcons for account
				coreContract.fetchPixelconsByAccount(_this.accountAddress).then(function (data) {
					let l2Pixelcons = data;
					
					//try to get l1 pixelcon data
					let l1Pixelcons = null;
					mergeContract.fetchL1PixelconsByAccount(_this.accountAddress).then(function (data) {
						l1Pixelcons = data;
						_this.pixelcons = l2Pixelcons.concat(l1Pixelcons);
						
						updateOwnedOnL2();
						return updateNotOnL1();
					}).then(function () {
						
						_this.loading = false;
						setBackground();
						sortData();
					}, function (reason) {
						
						//failed to get l1 data, just show l2 data
						$mdToast.show(
							$mdToast.simple()
								.action('Settings')
								.highlightAction(true)
								.highlightClass('md-primary')
								.textContent("Showing only L2 PixelCons (Bad Mainnet RPC)")
								.position('top right')
								.hideDelay(10000)
						).then(function(response) {
							if (response === 'ok') {
								$mdDialog.show({
									controller: 'SettingsDialogCtrl',
									controllerAs: 'ctrl',
									templateUrl: HTMLTemplates['dialog.settings'],
									parent: angular.element(document.body),
									bindToController: true,
									clickOutsideToClose: true
								});
							}
						});
						_this.loading = false;
						_this.pixelcons = l2Pixelcons;
						setBackground();
						sortData();
					});
				}, function (reason) {
					_this.loading = false;
					_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
				});
			} else if (web3Service.isPrivacyMode()) {
				_this.error = $sce.trustAsHtml('Account Not Connected');
			} else if (web3Service.isReadOnly()) {
				_this.error = $sce.trustAsHtml('No Account');
			}
		}

		// Updates data from transactions
		function updateFromTransaction(transactionData) {
			if (transactionData && transactionData.success && (transactionData.pixelcons || transactionData.pixelconsL1)) {
				let updated = false;
				if (transactionData.pixelcons) {
					for (let i = 0; i < transactionData.pixelcons.length; i++) {
						let pixelcon = transactionData.pixelcons[i];

						let found = false;
						for (let j = 0; j < _this.pixelcons.length; j++) {
							if (_this.pixelcons[j].id == pixelcon.id && !_this.pixelcons[j].isL1) {
								if (pixelcon.owner == _this.accountAddress) {
									//update
									updated = true;
									_this.pixelcons[j] = pixelcon;
								} else {
									//delete
									updated = true;
									_this.pixelcons.splice(j, 1);
									j--;
								}
								found = true;
								break;
							}
						}

						if (!found && pixelcon.owner == _this.accountAddress) {
							//insert
							updated = true;
							_this.pixelcons.push(pixelcon);
						}
					}
				}
				if (transactionData.pixelconsL1) {
					for (let i = 0; i < transactionData.pixelconsL1.length; i++) {
						let pixelcon = transactionData.pixelconsL1[i];

						let found = false;
						for (let j = 0; j < _this.pixelcons.length; j++) {
							if (_this.pixelcons[j].id == pixelcon.id && _this.pixelcons[j].isL1) {
								if (pixelcon.owner == _this.accountAddress) {
									//update
									updated = true;
									_this.pixelcons[j] = pixelcon;
								} else {
									//delete
									updated = true;
									_this.pixelcons.splice(j, 1);
									j--;
								}
								found = true;
								break;
							}
						}

						if (!found && pixelcon.owner == _this.accountAddress) {
							//insert
							updated = true;
							_this.pixelcons.push(pixelcon);
						}
					}
				}
				if(updated) {
					updateOwnedOnL2();
					updateNotOnL1();
					sortData();
				}
			}
		}
		
		// Updates the background image according to loaded pixelcon
		function setBackground() {
			let backgroundImage = null;
			if(_this.pixelcons) {
				let ids = [];
				for(let i=0; i<_this.pixelcons.length; i++) ids.push(_this.pixelcons[i].id);
				backgroundImage = decoder.backgroundPNG(ids, true);
			}
			decoder.updateBackground(backgroundImage, '/account', 500);
		}

		// Sorts the data collection according to filters
		function sortData() {
			_this.pixelcons.sort(function (a, b) {
				if (loadedFilter.sortBy == 'dateCreated') {
					if (loadedFilter.sortDesc) return b.index - a.index;
					else return a.index - b.index;
				} else if (loadedFilter.sortBy == 'name') {
					if (loadedFilter.sortDesc) return a.name.localeCompare(b.name);
					else return b.name.localeCompare(a.name);
				}
				return 0;
			});
		}
		
		// Sets the ownedOnL2 flags for the pixelcon data
		function updateOwnedOnL2() {
			for(let i = 0; i < _this.pixelcons.length; i++) {
				if(_this.pixelcons[i].isL1) {
					let foundOnL2 = false;
					for(let j = 0; j < _this.pixelcons.length; j++) {
						if(!_this.pixelcons[j].isL1 && _this.pixelcons[i].id == _this.pixelcons[j].id) {
							foundOnL2 = true;
							break;
						}
					}
					_this.pixelcons[i].ownedOnL2 = foundOnL2 ? true : undefined;
				}
			}
			return _this.pixelcons;
		}
		
		// Sets the notOnL1 flags for the pixelcon data
		function updateNotOnL1() {
			let foundL1Pixelcons = [];
			let searchL1TokenIds = [];
			for(let i = 0; i < _this.pixelcons.length; i++) {
				if(!_this.pixelcons[i].isL1) {
					let foundOnL1 = false;
					for(let j = 0; j < _this.pixelcons.length; j++) {
						if(_this.pixelcons[j].isL1 && _this.pixelcons[i].id == _this.pixelcons[j].id) {
							foundL1Pixelcons.push(_this.pixelcons[j]);
							foundOnL1 = true;
							break;
						}
					}
					if(!foundOnL1) {
						if(_this.pixelcons[i].isMergedL1) {
							foundL1Pixelcons.push({
								id: _this.pixelcons[i].id
							});
						} else {
							searchL1TokenIds.push(_this.pixelcons[i].id);
						}
					}
				}
			}
			let finishUpdate = function(l1Pixelcons) {
				for(let i = 0; i < _this.pixelcons.length; i++) {
					if(!_this.pixelcons[i].isL1) {
						let foundOnL1 = false;
						for(let j = 0; j < l1Pixelcons.length; j++) {
							if(_this.pixelcons[i].id == l1Pixelcons[j].id) {
								foundOnL1 = true;
								break;
							}
						}
						_this.pixelcons[i].notOnL1 = foundOnL1 ? undefined : true;
					}
				}
			}
			if(searchL1TokenIds.length == 0) {
				finishUpdate(foundL1Pixelcons);
				return _this.pixelcons;
			} else {
				return mergeContract.fetchL1PixelconsByIds(searchL1TokenIds).then(function(l1Pixelcons) {
					foundL1Pixelcons = foundL1Pixelcons.concat(l1Pixelcons);
					finishUpdate(foundL1Pixelcons);
					return _this.pixelcons;
				});
			}
		}

		// Set the sort order
		function setSortOrder(desc) {
			_this.filter.sortDesc = desc;
			checkUpdateData();
		}

		// Set the selection mode
		function setSelectionMode(mode) {
			for (let i in _this.pixelcons) _this.pixelcons[i].selected = false;
			_this.selectionMode = mode;
		}
		
		// Gets the number of pixelcon currently selected
		function getNumSelected() {
			let count = 0;
			for (let i in _this.pixelcons) {
				if(_this.pixelcons[i].selected) count++;
			}
			return count;
		}
		
		// Checks if a pixelcon should be enabled or disabled
		function checkDisabled(pixelcon, selectionMode) {
			if(!selectionMode) selectionMode = _this.selectionMode;
			if(selectionMode == 'mergeL1') {
				return !pixelcon.ownedOnL2;
			} else if(selectionMode == 'createL1') {
				return !pixelcon.notOnL1;
			} else if(selectionMode == 'withdrawL1') {
				return !pixelcon.isMergedL1;
			} else if(selectionMode == 'send') {
				return pixelcon.isL1;
			}
			return false;
		}
		
		// Checks if the given selectionMode has any selectable pixelcons
		function checkSelectModeActionable(selectionMode) {
			for (let i in _this.pixelcons) {
				if(!checkDisabled(_this.pixelcons[i], selectionMode)) {
					return true;
				}
			}
			return false;
		}
		
		// Sends the selected pixelcons
		function send(ev) {
			let pixelconIds = [];
			for(let i = 0; i < _this.pixelcons.length; i++) {
				if(_this.pixelcons[i].selected) pixelconIds.push(_this.pixelcons[i].id);
			}
			$mdDialog.show({
				controller: 'SendDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.send'],
				parent: angular.element(document.body),
				locals: { pixelconIds: pixelconIds },
				bindToController: true,
				clickOutsideToClose: true
			}).then(function(result) {
				setSelectionMode(null);
			});
		}
		
		// Merges the selected pixelcons from L1
		function mergeL1(ev) {
			let tokenIds = [];
			for(let i = 0; i < _this.pixelcons.length; i++) {
				if(_this.pixelcons[i].selected) tokenIds.push(_this.pixelcons[i].id);
			}
			$mdDialog.show({
				controller: 'MergeDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.merge'],
				parent: angular.element(document.body),
				locals: { tokenIds: tokenIds, transferMode: true },
				bindToController: true,
				clickOutsideToClose: true
			}).then(function(result) {
				if(!result.approvingTransfer) setSelectionMode(null);
			});
		}
		
		// Creates the selected pixelcons on L1 and merges to L2
		function createL1(ev) {
			let tokenIds = [];
			for(let i = 0; i < _this.pixelcons.length; i++) {
				if(_this.pixelcons[i].selected) tokenIds.push(_this.pixelcons[i].id);
			}
			$mdDialog.show({
				controller: 'MergeDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.merge'],
				parent: angular.element(document.body),
				locals: { tokenIds: tokenIds, createMode: true },
				bindToController: true,
				clickOutsideToClose: true
			}).then(function(result) {
				setSelectionMode(null);
			});
		}
		
		// Withdraws the selected pixelcons to L1
		function withdrawL1(ev) {
			let tokenIds = [];
			for(let i = 0; i < _this.pixelcons.length; i++) {
				if(_this.pixelcons[i].selected) tokenIds.push(_this.pixelcons[i].id);
			}
			$mdDialog.show({
				controller: 'MergeDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.merge'],
				parent: angular.element(document.body),
				locals: { tokenIds: tokenIds, withdrawMode: true },
				bindToController: true,
				clickOutsideToClose: true
			}).then(function(result) {
				setSelectionMode(null);
			});
		}

		// Set flag the directive as loaded
		$timeout(function () {
			_this.loaded = true;
		});

		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			setSelectionMode(null);
			checkUpdateData();
		}, $scope, true);

		// Listen for network data changes
		web3Service.onNetworkChange(function () {
			if(_this.error) checkUpdateData(true);
		}, $scope, true);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(updateFromTransaction, $scope);
	}
}());
