(function () {
	var app = angular.module('App', ['ngMaterial', 'ngRoute']);
	var ignoreReload = false;

	// Configuration
	app.config(['$mdThemingProvider', function ($mdThemingProvider) {
		$mdThemingProvider.theme('default')
			.primaryPalette('blue')
			.accentPalette('blue');
	}]);
	app.config(['$routeProvider', '$locationProvider', function ($routeProvider, $locationProvider) {
		$routeProvider.when("/", {
			templateUrl: HTMLTemplates['page.home'],
			controller: 'HomePageCtrl',
			controllerAs: 'ctrl'
		})
			.when("/details/:id", {
				templateUrl: HTMLTemplates['page.details'],
				controller: 'DetailsPageCtrl',
				controllerAs: 'ctrl'
			})
			.when("/collection/:index", {
				templateUrl: HTMLTemplates['page.collection'],
				controller: 'CollectionPageCtrl',
				controllerAs: 'ctrl'
			})
			.when("/creator/:address", {
				templateUrl: HTMLTemplates['page.creator'],
				controller: 'CreatorPageCtrl',
				controllerAs: 'ctrl'
			})
			.when("/owner/:address", {
				templateUrl: HTMLTemplates['page.owner'],
				controller: 'OwnerPageCtrl',
				controllerAs: 'ctrl'
			})
			.when("/search", {
				templateUrl: HTMLTemplates['page.search'],
				controller: 'SearchPageCtrl',
				controllerAs: 'ctrl',
				reloadOnSearch: false
			})
			.when("/account", {
				templateUrl: HTMLTemplates['page.account'],
				controller: 'AccountPageCtrl',
				controllerAs: 'ctrl',
				reloadOnSearch: false
			})
			.when("/create", {
				templateUrl: HTMLTemplates['page.create'],
				controller: 'CreatePageCtrl',
				controllerAs: 'ctrl',
				reloadOnSearch: false
			})
			.when("/start", {
				templateUrl: HTMLTemplates['page.start'],
				controller: 'StartPageCtrl',
				controllerAs: 'ctrl'
			})
			.when("/terms", {
				templateUrl: HTMLTemplates['page.terms'],
				controller: 'TermsPageCtrl',
				controllerAs: 'ctrl'
			})
			.when("/:qrcode", {
				templateUrl: HTMLTemplates['page.details'],
				controller: 'DetailsPageCtrl',
				controllerAs: 'ctrl'
			})
			.otherwise({
				redirectTo: '/'
			});

		// use the HTML5 History API
		$locationProvider.html5Mode(true);
	}]);
	app.run(['$route', '$rootScope', '$location', '$timeout', '$templateCache', '$http', '$window', 'web3Service', 'coreContract', 'decoder',
		function ($route, $rootScope, $location, $timeout, $templateCache, $http, $window, web3Service, coreContract, decoder) {
			var lastPage = $location.path();
			var replacementRoute = null;

			// always scroll to top on page load
			$rootScope.$on("$locationChangeSuccess", function (data) {
				let currPage = $location.path();
				if (replacementRoute !== null) {
					$route.current = replacementRoute;
					replacementRoute = null;
				} else if (lastPage != currPage) {
					let viewElement = $window.document.getElementById('view')
					if(viewElement) {
						viewElement.style.display = 'none';
						$timeout(function () {
							$window.document.getElementById('scrollTarget').scrollTop = 0;
						});
					}
				}
				lastPage = currPage;
			});
			
			
			// add reload parameter to the location path function
			var _locationPath = $location.path;
			$location.path = function (path, reload) {
				if (reload === false) {
					replacementRoute = $route.current;
					ignoreReload = true;
				}
				return _locationPath.apply($location, [path]);
			};
			
			// update background according to account data
			var backgroundAccount = null;
			function updateBackgroundForAccount() {
				web3Service.awaitState(async function() {
					try {
						let loadedAccount = web3Service.getActiveAccount();
						if(backgroundAccount != loadedAccount) {
							backgroundAccount = loadedAccount;
							if(backgroundAccount) {
								let pixelcons = await coreContract.fetchPixelconsByAccount(backgroundAccount, {simpleFetch: true});
								if(pixelcons && pixelcons.length) {
									let pixelconIds = [];
									for(let i=0; i<pixelcons.length; i++) pixelconIds.push(pixelcons[i].id);
									let backgroundImage = decoder.generateTiledImage(pixelconIds, 7, 7, 8, null, true, true, false);
									updateBackground(backgroundImage, 500);
									
								} else {
									let backgroundImage = decoder.generateTiledImage([], 7, 7, 8, null, true, true, false);
									updateBackground(backgroundImage, 500);
								}
							}
						}
					} catch(err) { }
				}, true);
			}
			web3Service.onAccountDataChange(updateBackgroundForAccount, null, true);
			updateBackgroundForAccount();

			// pre-load dialogs
			$http.get(HTMLTemplates['dialog.collection'], { cache: $templateCache });
			$http.get(HTMLTemplates['dialog.pixelcon'], { cache: $templateCache });
			$http.get(HTMLTemplates['dialog.send'], { cache: $templateCache });
			$http.get(HTMLTemplates['dialog.similarities'], { cache: $templateCache });
			$http.get(HTMLTemplates['dialog.prints'], { cache: $templateCache });
			$http.get(HTMLTemplates['dialog.settings'], { cache: $templateCache });
		}]);


	// Main controller
	app.controller('AppCtrl', AppCtrl);

	AppCtrl.$inject = ['$scope', 'decoder'];
	function AppCtrl($scope, decoder) {
		$scope.$on('$routeChangeStart', function($event, next, current) {
			ignoreReload = false;
		});
	}
	
	
	///////////
	// Utils //
	///////////
	
	//Updates the background image
	var backgroundUpdateTimeout = null;
	function updateBackground(backgroundImage, delay) {
		if(backgroundUpdateTimeout) clearTimeout(backgroundUpdateTimeout);
		backgroundUpdateTimeout = null;
		if(delay) {
			backgroundUpdateTimeout = setTimeout(function() {
				backgroundUpdateTimeout = null;
				updateBackgroundImage(backgroundImage);
			}, delay);
		} else {
			updateBackgroundImage(backgroundImage);
		}
	}
		
	//Updates the background image
	function updateBackgroundImage(backgroundImage) {
		if(backgroundImage) {
			//find the style rule
			let styleRule = null;
			for(let i = 0; i < document.styleSheets.length; i++) {
				if(document.styleSheets[i].href && (document.styleSheets[i].href.indexOf('/style.css') > -1 || document.styleSheets[i].href.indexOf('/style.min.css') > -1)) {
					for(let j = 0; j < document.styleSheets[i].cssRules.length; j++) {
						if(document.styleSheets[i].cssRules[j].selectorText.indexOf('div.pageContentBackground.groupOverride') > -1) {
							styleRule = document.styleSheets[i].cssRules[j];
							break;
						}
					}
					if(styleRule) break;
				}
			}
			if(styleRule) {
				//update and add background class list
				styleRule.style['background-image'] = 'url(' + backgroundImage + ')';
				let background = document.getElementById('contentBackground');
				if(background) background.classList.add('groupOverride');
				
			} else {
				//remove background class list
				let background = document.getElementById('contentBackground');
				if(background) background.classList.remove('groupOverride');
			}
		} else {
			//remove background class list
			let background = document.getElementById('contentBackground');
			if(background) background.classList.remove('groupOverride');
		}
	}
}());
