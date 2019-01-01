(function () {
	angular.module('App')
		.controller('SearchPageCtrl', SearchPageCtrl);

	SearchPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$location', 'web3Service', 'coreContract', 'openSea'];
	function SearchPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $location, web3Service, coreContract, openSea) {
		var _this = this;
		var maxInPage = 50;
		var minGrade = 8;
		_this.pixelcons = [];
		_this.filter = {
			searchText: $routeParams.search?$routeParams.search:'',
			forSaleOnly: $routeParams.forSaleOnly=='true',
			sortBy: 'dateCreated',
			sortDesc: $routeParams.asc!='true'
		}
		_this.displayHeight = '';
		_this.currPage = 0;
		_this.setSortOrder = setSortOrder;
		_this.checkUpdateData = checkUpdateData;
		_this.updatePage = updatePage;
		_this.goPath = goPath;
		_this.marketEnabled = openSea.isEnabled();
		
		var loadedFilter = {};
		
		// Database data
		var dirtyDatabaseData = false;
		var pixelconCount;
		var pixelconNames;
		var pixelconFilterGrades;
		var pixelconFilterGradeMax;
		var pixelconFilterCount;
		var pixelconListings;
		
		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function() { return $mdMedia('gt-md'); }, function(lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function() { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function(md) { _this.screenSize['md'] = md; });
		$scope.$watch(function() { return $mdMedia('xs'); }, function(sm) { _this.screenSize['sm'] = sm; });
		
		// Fetch database to search through
		fetchDatabaseData();
		function fetchDatabaseData() {
			dirtyDatabaseData = false;
			_this.grabbingData = true;
			_this.loading = true;
			_this.currPage = 0;
			_this.pixelcons = [];
			_this.showMarketLink = !openSea.canGetForSaleList();
			_this.marketLink = openSea.getMarketLink();
			
			coreContract.getTotalPixelcons().then(function(total) {
				pixelconCount = total;
				
				return openSea.getItemsForSale();
			}).then(function(indexes) {
				pixelconListings = indexes;
				
				_this.grabbingData = false;
				var page = $routeParams.page?parseInt($routeParams.page):null;
				checkUpdateData(true, page);
			}, function(reason) {
				_this.grabbingData = false;
				_this.loading = false;
				_this.error = reason;
			});
		}
		
		// Check if data parameters have changed
		function checkUpdateData(forceUpdate, gotoPage) {
			if(_this.error) return;
			if(dirtyDatabaseData) {
				fetchDatabaseData();
				return;
			}
			
			//update url parameters
			if(($routeParams.search === undefined && _this.filter.searchText) || ($routeParams.search !== undefined && _this.filter.searchText != $routeParams.search)) {
				$location.search('search', _this.filter.searchText?_this.filter.searchText:undefined).replace();
			}
			if(($routeParams.forSaleOnly === undefined && _this.filter.forSaleOnly) || ($routeParams.forSaleOnly !== undefined && _this.filter.forSaleOnly != ($routeParams.forSaleOnly=='true'))) {
				$location.search('forSaleOnly', _this.filter.forSaleOnly?'true':undefined).replace();
			}
			if(($routeParams.asc === undefined && !_this.filter.sortDesc) || ($routeParams.asc !== undefined && _this.filter.sortDesc == ($routeParams.asc=='true'))) {
				$location.search('asc', (!_this.filter.sortDesc)?'true':undefined).replace();
			}
			
			//name grading related filter changes?
			if(forceUpdate || _this.filter.searchText != loadedFilter.searchText || _this.filter.forSaleOnly != loadedFilter.forSaleOnly) {
				loadedFilter = JSON.parse(JSON.stringify(_this.filter));
				
				// get list of names or just grade?
				if(loadedFilter.searchText) fetchNames(gotoPage);
				else gradeNames(gotoPage);
				return;
			}
			
			//other filter parameters changed?
			var needToUpdate = false;
			for(var i in _this.filter) {
				if(_this.filter[i] != loadedFilter[i]) {
					needToUpdate = true;
					break;
				}
			}
			if(needToUpdate) {
				loadedFilter = JSON.parse(JSON.stringify(_this.filter));
				updatePage(1);
			}
		}
		
		// Grades the database names based on filter data
		function fetchNames(gotoPage) {
			if(!pixelconNames) {
				_this.grabbingData = true;
				_this.loading = true;
				_this.currPage = 0;
				_this.pixelcons = [];
				
				coreContract.getAllNames().then(function(names) {
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
			
			if(loadedFilter.forSaleOnly) {
				//selling
				for(var i=0; i<pixelconListings.length; i++) {
					var grade = loadedFilter.searchText.length?gradeNameWithText(pixelconNames[pixelconListings[i]], loadedFilter.searchText):200;
					if(grade > minGrade) pixelconFilterCount++;
					if(grade > pixelconFilterGradeMax) pixelconFilterGradeMax = grade;
					pixelconFilterGrades[pixelconListings[i]] = grade;
				}
			} else {
				//all
				for(var i=0; i<pixelconCount; i++) {
					var grade = loadedFilter.searchText.length?gradeNameWithText(pixelconNames[i], loadedFilter.searchText):200;
					if(grade > minGrade) pixelconFilterCount++;
					if(grade > pixelconFilterGradeMax) pixelconFilterGradeMax = grade;
					pixelconFilterGrades[i] = grade;
				}
			}
			
			_this.totalFound = pixelconFilterCount;
			updatePage(gotoPage?gotoPage:1);
		}
		
		// Updates data to be displayed based on paging details
		function updatePage(page) {
			var scrollTarget = $('#scrollTarget');
			var resultsCard = $('#searchPagePixelconWindow');
			if(scrollTarget[0] && resultsCard[0] && resultsCard[0].offsetHeight < scrollTarget[0].offsetHeight) {
				_this.displayHeight = resultsCard[0].offsetHeight + 'px';
			} else {
				_this.displayHeight = '';
			}
			$location.search('page', (page>1)?page:undefined).replace();
			
			_this.loading = true;
			_this.currPage = 0;
			_this.pixelcons = [];
			
			//loop from high score to low score, until page slots are filled
			var indexes = [];
			var startIndex = (page-1)*maxInPage;
			if(loadedFilter.forSaleOnly) {
				if(loadedFilter.sortDesc) {
					//selling desc
					for(var grade=pixelconFilterGradeMax; grade>minGrade && indexes.length<maxInPage; grade--) {
						for(var i=pixelconListings.length-1; i>=0 && indexes.length<maxInPage; i--) {
							if(pixelconFilterGrades[pixelconListings[i]] == grade) {
								if(startIndex > 0) startIndex--;
								else indexes.push(pixelconListings[i]);
							}
						}
					}
				} else {
					//selling asc
					for(var grade=pixelconFilterGradeMax; grade>minGrade && indexes.length<maxInPage; grade--) {
						for(var i=0; i<pixelconListings.length && indexes.length<maxInPage; i++) {
							if(pixelconFilterGrades[pixelconListings[i]] == grade) {
								if(startIndex > 0) startIndex--;
								else indexes.push(pixelconListings[i]);
							}
						}
					}
				}
			} else {
				if(loadedFilter.sortDesc) {
					//all desc
					for(var grade=pixelconFilterGradeMax; grade>minGrade && indexes.length<maxInPage; grade--) {
						for(var i=pixelconFilterGrades.length-1; i>=0 && indexes.length<maxInPage; i--) {
							if(pixelconFilterGrades[i] == grade) {
								if(startIndex > 0) startIndex--;
								else indexes.push(i);
							}
						}
					}
				} else {
					//all asc
					for(var grade=pixelconFilterGradeMax; grade>minGrade && indexes.length<maxInPage; grade--) {
						for(var i=0; i<pixelconFilterGrades.length && indexes.length<maxInPage; i++) {
							if(pixelconFilterGrades[i] == grade) {
								if(startIndex > 0) startIndex--;
								else indexes.push(i);
							}
						}
					}
				}
			}
			
			//get the details for the pixelcon indexes
			_this.error = null;
			_this.currPage = page;
			_this.maxPage = Math.ceil(pixelconFilterCount/maxInPage);
			coreContract.fetchPixelconsByIndexes(indexes).then(function(data) {
				_this.loading = false;
				_this.pixelcons = data;
				_this.displayHeight = '';
			}, function(reason) {
				_this.loading = false;
				_this.error = reason;
				_this.currPage = 0;
				_this.displayHeight = '';
			});
		}
		
		// Set the sort order
		function setSortOrder(desc) {
			_this.filter.sortDesc = desc;
			checkUpdateData();
		}
		
		// Go to the specified path
		function goPath(path) {
			$location.url(path);
		}
		
		// Listen for account data changes
		web3Service.onAccountDataChange(checkUpdateData, $scope);	
		
		// Listen for transactions
		web3Service.onWaitingTransactionsChange(function(transactionData) {
			dirtyDatabaseData = transactionData && transactionData.success;
		}, $scope);	
		
		
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
		function gradeNameWithText(name, text) {
			var lName = name.toLowerCase();
			var lText = text.toLowerCase();
			
			var highestGrade = 0;
			var foundCharacterIndexesInText = new Array(name.length);
			function searchForMatchingIndexes(nameIndex) {
				if(nameIndex == name.length) {
					//evaluate character index pattern (recursion end condition)
					var grade = 0;
					for(var i=0; i<name.length; i++) {
						var matchingIndex = foundCharacterIndexesInText[i];
						
						//1 point if not null
						if(matchingIndex === null) {
							continue;
						}
						grade += 1;
					
						//1 point if index is unique
						var repeated = false;
						for(var j=0; j<name.length; j++) {
							if(j != i && foundCharacterIndexesInText[j] === matchingIndex) {
								repeated = true;
								break;
							}
						}
						if(!repeated) grade += 1;
					
						//1 point if case matches
						if(name[i] == text[matchingIndex]) grade += 1;
						
						//Note: the next few rules depend on the previous index being valid
						if(i == 0 || foundCharacterIndexesInText[i-1] === null) {
							continue;
						}
						var lastIndex = foundCharacterIndexesInText[i-1];
						
						//1 point if this index is greater than the last
						if(matchingIndex <= lastIndex) continue;
						grade += 1;
					
						//1 point if this index is 5 steps of the last
						if(matchingIndex - lastIndex <= 5) grade += 1;
					
						//1 point if this index is 2 steps of the last
						if(matchingIndex - lastIndex <= 2) grade += 1;
					
					}
					
					//update highest grade
					if(grade > highestGrade) highestGrade = grade;
					
				} else {
					//search through 'text' to find all matching characters to 'name[nameIndex]'
					var foundIndexInText = false;
					for(var t=0; t<text.length; t++) {
						if(lName[nameIndex] == lText[t]) {
							foundIndexInText = true;
							foundCharacterIndexesInText[nameIndex] = t;
							searchForMatchingIndexes(nameIndex+1);
						}
					}
					//if 'name[nameIndex]' was not found in 'text', put 'null' as placeholder and continue with recursion
					if(!foundIndexInText) {
							foundCharacterIndexesInText[nameIndex] = null;
							searchForMatchingIndexes(nameIndex+1);
					}
				}
			}
			searchForMatchingIndexes(0);
			
			return highestGrade;
		}
	}
}());
