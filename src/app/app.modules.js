(function () {
	var app = angular.module('App', ['ngMaterial', 'ngRoute']);

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
		}).when("/details/:id", {
			templateUrl: HTMLTemplates['page.details'],
			controller: 'DetailsPageCtrl',
			controllerAs: 'ctrl'
		}).when("/collection/:index", {
			templateUrl: HTMLTemplates['page.collection'],
			controller: 'CollectionPageCtrl',
			controllerAs: 'ctrl'
		}).when("/creator/:address", {
			templateUrl: HTMLTemplates['page.creator'],
			controller: 'CreatorPageCtrl',
			controllerAs: 'ctrl'
		}).when("/search", {
			templateUrl: HTMLTemplates['page.search'],
			controller: 'SearchPageCtrl',
			controllerAs: 'ctrl',
			reloadOnSearch: false
		}).when("/account", {
			templateUrl: HTMLTemplates['page.account'],
			controller: 'AccountPageCtrl',
			controllerAs: 'ctrl',
			reloadOnSearch: false
		}).when("/create", {
			templateUrl: HTMLTemplates['page.create'],
			controller: 'CreatePageCtrl',
			controllerAs: 'ctrl'
		}).when("/start", {
			templateUrl: HTMLTemplates['page.start'],
			controller: 'StartPageCtrl',
			controllerAs: 'ctrl'
		}).when("/terms", {
			templateUrl: HTMLTemplates['page.terms'],
			controller: 'TermsPageCtrl',
			controllerAs: 'ctrl'
		}).otherwise({
			redirectTo: '/'
		});

		// use the HTML5 History API
		$locationProvider.html5Mode(true);
	}]);
	app.run(['$rootScope', '$location', '$timeout', '$templateCache', '$http',
		function ($rootScope, $location, $timeout, $templateCache, $http) {
			var lastPage = $location.path();

			// always scroll to top on page load
			$rootScope.$on("$locationChangeSuccess", function (data) {
				var currPage = $location.path();
				if (lastPage != currPage) {
					$('#view')[0].style.display = 'none'
					$timeout(function () { $('#scrollTarget').scrollTop(0); });
				}
				lastPage = currPage;
			});

			// pre-load dialogs
			$http.get(HTMLTemplates['dialog.collection'], { cache: $templateCache });
			$http.get(HTMLTemplates['dialog.pixelcon'], { cache: $templateCache });
			$http.get(HTMLTemplates['dialog.send'], { cache: $templateCache });
		}]);


	// Main controller
	app.controller('AppCtrl', AppCtrl);

	AppCtrl.$inject = ['$scope'];
	function AppCtrl($scope) {

		//nothing...

	}
}());
