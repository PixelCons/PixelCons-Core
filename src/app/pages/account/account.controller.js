(function () {
	angular.module('App')
		.controller('AccountPageCtrl', AccountPageCtrl);

	AccountPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$mdToast', '$routeParams', '$timeout', '$location', '$sce', 'web3Service', 'coreContract', 'market'];
	function AccountPageCtrl($scope, $mdMedia, $mdDialog, $mdToast, $routeParams, $timeout, $location, $sce, web3Service, coreContract, market) {
		var _this = this;
		const loadStep = 80;
		const loadStepThreshold = 100;
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
		_this.checkActionDisabled = checkActionDisabled;
		_this.checkDisabled = checkDisabled;
		_this.checkSelectModeActionable = checkSelectModeActionable;
		_this.send = send;
		_this.loadMore = loadMore;
		_this.copyLink = copyLink;
		_this.shareOnTwitter = shareOnTwitter;
		_this.shareOnFacebook = shareOnFacebook;
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
				
				//get pixelcons for account
				coreContract.fetchPixelconsByAccount(_this.accountAddress, {asynchronousLoad: true}).then(function (pixelcons) {
					//_this.pixelcons = data;
					
					_this.pixelcons = pixelcons;
					_this.displayPixelcons = pixelcons.slice(0, pixelcons.length < loadStepThreshold ? pixelcons.length : loadStep);
					
					_this.loading = false;
					sortData();
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
			if (transactionData && transactionData.success && transactionData.pixelcons) {
				let updated = false;
				for (let i = 0; i < transactionData.pixelcons.length; i++) {
					let pixelcon = transactionData.pixelcons[i];

					let found = false;
					for (let j = 0; j < _this.pixelcons.length; j++) {
						if (_this.pixelcons[j].id == pixelcon.id) {
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
				if(updated) {
					sortData();
				}
			}
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
			
			//reset displayed pixelcons
			if(_this.displayPixelcons) {
				_this.displayPixelcons = _this.pixelcons.slice(0, _this.displayPixelcons.length);
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
		
		// Checks if the selection mode action is enabled
		function checkActionDisabled(selectionMode) {
			if(!selectionMode) selectionMode = _this.selectionMode;
			if(selectionMode == 'send') {
				singleSelectionOnly();
				return (getNumSelected() != 1);
			}
			return false;
		}
		
		// Checks if a pixelcon should be enabled or disabled
		function checkDisabled(pixelcon, selectionMode) {
			if(!selectionMode) selectionMode = _this.selectionMode;
			if(selectionMode == 'send') {
				return false;
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
		
		// Enforce single selection
		function singleSelectionOnly() {
			for(let i = 0; i < _this.pixelcons.length; i++) {
				if(_this.pixelcons[i].selected && !_this.pixelcons[i].singleSelect) {
					_this.pixelcons[i].singleSelect = true;
					for(let j = 0; j < _this.pixelcons.length; j++) {
						if(j != i) {
							delete _this.pixelcons[j].singleSelect;
							_this.pixelcons[j].selected = false;
						}
					}
					break;
				}
			}
		}
		
		// Sends the selected pixelcons
		function send(ev) {
			let pixelconId = null;
			for(let i = 0; i < _this.pixelcons.length; i++) {
				if(_this.pixelcons[i].selected) {
					pixelconId = _this.pixelcons[i].id;
					break;
				}
			}
			$mdDialog.show({
				controller: 'SendDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.send'],
				parent: angular.element(document.body),
				locals: { pixelconId: pixelconId },
				bindToController: true,
				clickOutsideToClose: true
			}).then(function(result) {
				setSelectionMode(null);
			});
		}

		// Loads more pixelcons on the display
		function loadMore() {
			if(_this.pixelcons.length > _this.displayPixelcons.length) {
				let size = Math.min(_this.displayPixelcons.length + loadStep, _this.pixelcons.length);
				_this.displayPixelcons = _this.pixelcons.slice(0, size);
			}
		}

		// Copies share link to the clipboard
		function copyLink() {
			let copyText = document.getElementById("copyToClipboard");
			copyText.value = document.location.origin + '/owner/' + _this.accountAddress;
			copyText.select();
			document.execCommand("copy");
		}

		// Share this page on twitter
		function shareOnTwitter() {
			let url = "https://twitter.com/intent/tweet?url=";
			url += encodeURI(document.location.origin + '/owner/' + _this.accountAddress);
			url += '&text=' + encodeURI("Check out these PixelCons!");
			return url;
		}

		// Share this page on facebook
		function shareOnFacebook() {
			let url = "https://www.facebook.com/sharer/sharer.php?u="
			url += encodeURI(document.location.origin + '/owner/' + _this.accountAddress);
			return url;
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
