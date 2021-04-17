(function () {
	angular.module('App')
		.controller('AccountPageCtrl', AccountPageCtrl);

	AccountPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$timeout', '$location', 'web3Service', 'coreContract', 'market'];
	function AccountPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $timeout, $location, web3Service, coreContract, market) {
		var _this = this;
		_this.pixelcons = [];
		_this.pixelconsCount = 0;
		_this.accountAddress;
		_this.filter = {
			viewMode: ($routeParams.view == 'created') ? 'created' : 'owned',
			sortBy: ($routeParams.sortBy == 'name') ? 'name' : 'dateCreated',
			sortDesc: $routeParams.asc != 'true'
		}
		_this.groupMode = false;
		_this.groupSelection = [];
		_this.checkUpdateData = checkUpdateData;
		_this.setSortOrder = setSortOrder;
		_this.setQueryMode = setQueryMode;
		_this.setGroupMode = setGroupMode;
		_this.createCollection = createCollection;
		_this.pixelconSelect = pixelconSelect;
		_this.marketEnabled = market.isEnabled();
		_this.marketAccountLink = market.getAccountLink();

		var loadedFilter = {};
		var pixelconData = [];
		checkUpdateData(true);

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Check if data parameters have changed
		function checkUpdateData(forceDataFetch) {
			//update url parameters
			if (($routeParams.view === undefined && _this.filter.viewMode == 'created') || ($routeParams.view !== undefined && _this.filter.viewMode != $routeParams.view)) {
				$location.search('view', (_this.filter.viewMode == 'created') ? 'created' : undefined).replace();
			}
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
			var account = web3Service.getActiveAccount();
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
			var needToSort = false;
			for (var i in _this.filter) {
				if (_this.filter[i] != loadedFilter[i]) {
					needToSort = true;
					break;
				}
			}
			if (needToSort) {
				loadedFilter = JSON.parse(JSON.stringify(_this.filter));
				sortData();
			}
		}

		// Fetches data according to set address
		function fetchData() {
			_this.pixelcons = [];
			_this.pixelconsCount = 0;
			pixelconData = [];

			//get new data
			if (_this.accountAddress) {
				_this.loading = true;
				_this.error = null;
				coreContract.fetchPixelconsByAccount(_this.accountAddress).then(function (data) {
					_this.loading = false;
					pixelconData = data;
					sortData();
				}, function (reason) {
					_this.loading = false;
					_this.error = reason;
				});
			} else if (web3Service.isPrivacyMode()) {
				_this.error = 'Ethereum Account Not Connected';
			} else if (web3Service.isReadOnly()) {
				_this.error = 'No Ethereum Account';
			}
		}

		// Updates data from transactions
		function updateFromTransaction(transactionData) {
			if (transactionData && transactionData.success && transactionData.pixelcons) {
				for (var i = 0; i < transactionData.pixelcons.length; i++) {
					var pixelcon = transactionData.pixelcons[i];

					var found = false;
					for (var j = 0; j < pixelconData.length; j++) {
						if (pixelconData[j].id == pixelcon.id) {
							//update
							pixelconData[j] = angular.extend({}, pixelconData[j], pixelcon);
							pixelconData[j].owned = (pixelconData[j].owner == _this.accountAddress);
							found = true;
							break;
						}
					}

					if (!found && (pixelcon.owner == _this.accountAddress || pixelcon.creator == _this.accountAddress)) {
						//insert
						pixelcon.created = (pixelcon.creator == _this.accountAddress);
						pixelcon.owned = (pixelcon.owner == _this.accountAddress);
						pixelconData.push(pixelcon);
					}
				}
				for (var i = 0; i < pixelconData.length; i++) updatePixelconCollection(pixelconData[i].collection, transactionData.pixelcons);
				sortData();
			}
		}

		// Updates a pixelcons collection with the given list of pixelcons
		function updatePixelconCollection(collection, pixelcons) {
			if (collection && collection.index) {
				for (var i = 0; i < collection.pixelcons.length; i++) {
					for (var j = 0; j < pixelcons.length; j++) {
						if (collection.pixelcons[i].id == pixelcons[j].id) {
							collection.pixelcons[i] = angular.extend({}, collection.pixelcons[i], pixelcons[j]);
							break;
						}
					}
					collection.pixelcons[i].owned = (collection.pixelcons[i].owner == _this.accountAddress);
				}
			}
		}

		// Sorts the data collection according to filters
		function sortData() {
			_this.pixelcons = [];
			_this.pixelconsCount = 0;

			//filter data
			for (var i in pixelconData) {
				if (loadedFilter.viewMode == 'owned') {
					if (pixelconData[i].owned) _this.pixelcons.push(pixelconData[i]);
				} else if (loadedFilter.viewMode == 'created') {
					if (pixelconData[i].created) _this.pixelcons.push(pixelconData[i]);

				}
			}
			_this.pixelconsCount = _this.pixelcons.length;

			//sort data according to filters
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

		// Click on a pixelcon
		function pixelconSelect(index, p) {
			var pixelcon = _this.pixelcons[index];
			pixelcon.selected = !pixelcon.selected;
			p.selected = pixelcon.selected;

			var id = pixelcon.id;
			if (_this.pixelcons[index].selected) {
				var index = _this.groupSelection.indexOf(id);
				if (index == -1) _this.groupSelection.push(id);
			} else {
				var index = _this.groupSelection.indexOf(id);
				if (index > -1) _this.groupSelection.splice(index, 1);
			}
		}

		// Set the sort order
		function setSortOrder(desc) {
			_this.filter.sortDesc = desc;
			checkUpdateData();
		}

		// Set the query mode
		function setQueryMode(mode) {
			_this.groupMode = false;
			_this.filter.viewMode = mode;
			checkUpdateData();
		}

		// Set the query mode
		function setGroupMode(mode) {
			_this.groupSelection = [];
			for (var i in _this.pixelcons) _this.pixelcons[i].selected = false;
			_this.groupMode = mode;
		}

		// Creates a collection
		function createCollection(ev) {
			var pixelcons = [];
			for (var i = 0; i < pixelconData.length; i++) {
				if (pixelconData[i].selected) pixelcons.push(pixelconData[i]);
			}
			setGroupMode(false);
			$mdDialog.show({
				controller: 'CollectionDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.collection'],
				parent: angular.element(document.body),
				locals: { pixelcons: pixelcons },
				bindToController: true,
				clickOutsideToClose: true
			});
		}

		// Set flag the directive as loaded
		$timeout(function () {
			_this.loaded = true;
		});

		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			checkUpdateData();
		}, $scope);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(updateFromTransaction, $scope);
	}
}());
