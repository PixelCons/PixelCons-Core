(function () {
	angular.module('App')
		.controller('SearchPageCtrl', SearchPageCtrl);

	SearchPageCtrl.$inject = ['$scope', '$mdMedia', '$routeParams', '$route', '$location', '$window', '$sce', 'web3Service', 'coreContract'];
	function SearchPageCtrl($scope, $mdMedia, $routeParams, $route, $location, $window, $sce, web3Service, coreContract) {
		var _this = this;
		const maxInPage = 50;
		const minGrade = 8;
		_this.pixelcons = [];
		_this.filter = {
			searchText: $routeParams.search ? $routeParams.search : '',
			sortBy: 'dateCreated',
			sortDesc: $routeParams.desc == 'true'
		}
		_this.displayHeight = '';
		_this.currPage = 0;
		_this.setSortOrder = setSortOrder;
		_this.checkUpdateData = checkUpdateData;
		_this.updatePage = updatePage;
		_this.disableFilters = false;

		var loadedFilter = {};

		// Database data
		var dirtyDatabaseData = false;
		var pixelconCount;
		var pixelconNames;
		var pixelconFilterGrades;
		var pixelconFilterGradeMax;
		var pixelconFilterCount;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Fetch database to search through
		fetchDatabaseData();
		function fetchDatabaseData() {
			dirtyDatabaseData = false;
			_this.grabbingData = true;
			_this.loading = true;
			_this.currPage = 0;
			_this.pixelcons = [];

			coreContract.getTotalPixelcons().then(function (total) {
				pixelconCount = total;

				_this.grabbingData = false;
				let page = $routeParams.page ? parseInt($routeParams.page) : null;
				checkUpdateData(true, page);
			}, function (reason) {
				_this.grabbingData = false;
				_this.loading = false;
				_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
			});
		}

		// Check if data parameters have changed
		function checkUpdateData(forceUpdate, gotoPage) {
			web3Service.awaitState(function () {
				if (_this.error) return;
				if (dirtyDatabaseData) {
					fetchDatabaseData();
					return;
				}

				//update url parameters
				if (($routeParams.search === undefined && _this.filter.searchText) || ($routeParams.search !== undefined && _this.filter.searchText != $routeParams.search)) {
					$location.search('search', _this.filter.searchText ? _this.filter.searchText : undefined).replace();
				}
				if (($routeParams.desc === undefined && _this.filter.sortDesc) || ($routeParams.desc !== undefined && _this.filter.sortDesc == ($routeParams.desc != 'true'))) {
					$location.search('desc', (_this.filter.sortDesc) ? 'true' : undefined).replace();
				}

				//name grading related filter changes?
				if (forceUpdate || _this.filter.searchText != loadedFilter.searchText) {
					loadedFilter = JSON.parse(JSON.stringify(_this.filter));

					// get list of names or just grade?
					if (loadedFilter.searchText) fetchNames(gotoPage);
					else gradeNames(gotoPage);
					return;
				}

				//other filter parameters changed?
				let needToUpdate = false;
				for (let i in _this.filter) {
					if (_this.filter[i] != loadedFilter[i]) {
						needToUpdate = true;
						break;
					}
				}
				if (needToUpdate) {
					loadedFilter = JSON.parse(JSON.stringify(_this.filter));
					updatePage(1);
				}
			}, true);
		}

		// Grades the database names based on filter data
		function fetchNames(gotoPage) {
			if (!pixelconNames) {
				_this.grabbingData = true;
				_this.loading = true;
				_this.currPage = 0;
				_this.pixelcons = [];

				coreContract.getAllNames().then(function (names) {
					_this.grabbingData = false;
					pixelconNames = names;
					pixelconCount = pixelconNames.length;
					gradeNames(gotoPage);
				});
			} else {
				gradeNames(gotoPage);
			}
		}

		// Grades the database names based on filter data
		function gradeNames(gotoPage) {
			_this.loading = true;
			_this.currPage = 0;

			pixelconFilterCount = 0;
			pixelconFilterGradeMax = 0;
			pixelconFilterGrades = new Uint8Array(pixelconCount);

			//all
			for (let i = 0; i < pixelconCount; i++) {
				let grade = loadedFilter.searchText.length ? gradeNameWithText(pixelconNames[i], loadedFilter.searchText) : 200;
				if (grade > minGrade) pixelconFilterCount++;
				if (grade > pixelconFilterGradeMax) pixelconFilterGradeMax = grade;
				pixelconFilterGrades[i] = grade;
			}

			_this.totalFound = pixelconFilterCount;
			updatePage(gotoPage ? gotoPage : 1);
		}

		// Updates data to be displayed based on paging details
		function updatePage(page) {
			let scrollTarget = $window.document.getElementById('scrollTarget');
			let resultsCard = $window.document.getElementById('searchPagePixelconWindow');
			if (scrollTarget && resultsCard && resultsCard.offsetHeight < scrollTarget.offsetHeight) {
				_this.displayHeight = resultsCard.offsetHeight + 'px';
			} else {
				_this.displayHeight = '';
			}
			$location.search('page', (page > 1) ? page : undefined).replace();

			_this.loading = true;
			_this.currPage = 0;
			_this.pixelcons = [];

			//loop from high score to low score, until page slots are filled
			let indexes = [];
			let startIndex = (page - 1) * maxInPage;
			if (loadedFilter.sortDesc) {
				//all desc
				for (let grade = pixelconFilterGradeMax; grade > minGrade && indexes.length < maxInPage; grade--) {
					for (let i = pixelconFilterGrades.length - 1; i >= 0 && indexes.length < maxInPage; i--) {
						if (pixelconFilterGrades[i] == grade) {
							if (startIndex > 0) startIndex--;
							else indexes.push(i);
						}
					}
				}
			} else {
				//all asc
				for (let grade = pixelconFilterGradeMax; grade > minGrade && indexes.length < maxInPage; grade--) {
					for (let i = 0; i < pixelconFilterGrades.length && indexes.length < maxInPage; i++) {
						if (pixelconFilterGrades[i] == grade) {
							if (startIndex > 0) startIndex--;
							else indexes.push(i);
						}
					}
				}
			}

			//get the details for the pixelcon indexes
			_this.error = null;
			_this.currPage = page;
			_this.maxPage = Math.ceil(pixelconFilterCount / maxInPage);
			coreContract.fetchPixelconsByIndexes(indexes, {asynchronousLoad: true}).then(function (data) {
				_this.loading = false;
				_this.pixelcons = data;
				_this.displayHeight = '';
			}, function (reason) {
				_this.loading = false;
				_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
				_this.currPage = 0;
				_this.displayHeight = '';
			});
		}

		// Set the sort order
		function setSortOrder(desc) {
			_this.filter.sortDesc = desc;
			checkUpdateData();
		}

		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			checkUpdateData();
		}, $scope, true);

		// Listen for network data changes
		web3Service.onNetworkChange(function () {
			if(_this.error) $route.reload();
		}, $scope, true);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(function (transactionData) {
			dirtyDatabaseData = transactionData && transactionData.success;
		}, $scope);


		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		////////////////////////////////////////////////////// Text Search Algorithm //////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		function gradeNameWithText(name, text) {
			let lName = name.toLowerCase();
			let lText = text.toLowerCase();

			let highestGrade = 0;
			let foundCharacterIndexesInText = new Array(name.length);
			function searchForMatchingIndexes(nameIndex) {
				if (nameIndex == name.length) {
					//evaluate character index pattern (recursion end condition)
					let grade = 0;
					for (let i = 0; i < name.length; i++) {
						let matchingIndex = foundCharacterIndexesInText[i];

						//1 point if not null
						if (matchingIndex === null) {
							continue;
						}
						grade += 1;

						//1 point if index is unique
						let repeated = false;
						for (let j = 0; j < name.length; j++) {
							if (j != i && foundCharacterIndexesInText[j] === matchingIndex) {
								repeated = true;
								break;
							}
						}
						if (!repeated) grade += 1;

						//1 point if case matches
						if (name[i] == text[matchingIndex]) grade += 1;

						//Note: the next few rules depend on the previous index being valid
						if (i == 0 || foundCharacterIndexesInText[i - 1] === null) {
							continue;
						}
						let lastIndex = foundCharacterIndexesInText[i - 1];

						//1 point if this index is greater than the last
						if (matchingIndex <= lastIndex) continue;
						grade += 1;

						//1 point if this index is 5 steps of the last
						if (matchingIndex - lastIndex <= 5) grade += 1;

						//1 point if this index is 2 steps of the last
						if (matchingIndex - lastIndex <= 2) grade += 1;

					}

					//update highest grade
					if (grade > highestGrade) highestGrade = grade;

				} else {
					//search through 'text' to find all matching characters to 'name[nameIndex]'
					let foundIndexInText = false;
					for (let t = 0; t < text.length; t++) {
						if (lName[nameIndex] == lText[t]) {
							foundIndexInText = true;
							foundCharacterIndexesInText[nameIndex] = t;
							searchForMatchingIndexes(nameIndex + 1);
						}
					}
					//if 'name[nameIndex]' was not found in 'text', put 'null' as placeholder and continue with recursion
					if (!foundIndexInText) {
						foundCharacterIndexesInText[nameIndex] = null;
						searchForMatchingIndexes(nameIndex + 1);
					}
				}
			}
			searchForMatchingIndexes(0);

			return highestGrade;
		}
	}
}());
