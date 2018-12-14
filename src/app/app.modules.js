(function () {
	var app = angular.module('App', ['ngMaterial', 'ngRoute']);
	
	// Configuration
	app.config(['$mdThemingProvider', function($mdThemingProvider) {
		$mdThemingProvider.theme('default')
			.primaryPalette('blue')
			.accentPalette('blue');
	}]);
	app.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider) {
		$routeProvider.when("/", {
			templateUrl: 'app/pages/home/home.view.html',
			controller: 'HomePageCtrl',
			controllerAs: 'ctrl'
		})
		.when("/details/:id", {
			templateUrl: 'app/pages/details/details.view.html',
			controller: 'DetailsPageCtrl',
			controllerAs: 'ctrl'
		})
		.when("/collection/:index", {
			templateUrl: 'app/pages/collection/collection.view.html',
			controller: 'CollectionPageCtrl',
			controllerAs: 'ctrl'
		})
		.when("/creator/:address", {
			templateUrl: 'app/pages/creator/creator.view.html',
			controller: 'CreatorPageCtrl',
			controllerAs: 'ctrl'
		})
		.when("/search", {
			templateUrl: 'app/pages/search/search.view.html',
			controller: 'SearchPageCtrl',
			controllerAs: 'ctrl',
			reloadOnSearch: false
		})
		.when("/account", {
			templateUrl: 'app/pages/account/account.view.html',
			controller: 'AccountPageCtrl',
			controllerAs: 'ctrl',
			reloadOnSearch: false
		})
		.when("/create", {
			templateUrl: 'app/pages/create/create.view.html',
			controller: 'CreatePageCtrl',
			controllerAs: 'ctrl'
		})
		.when("/start", {
			templateUrl: 'app/pages/start/start.view.html',
			controller: 'StartPageCtrl',
			controllerAs: 'ctrl'
		})
		.when("/terms", {
			templateUrl: 'app/pages/terms/terms.view.html',
			controller: 'TermsPageCtrl',
			controllerAs: 'ctrl'
		})
		.otherwise({
			redirectTo: '/'
		});
		
		// use the HTML5 History API
        $locationProvider.html5Mode(true);
	}]);
	app.run(['$rootScope', '$location', '$timeout', function($rootScope, $location, $timeout){
		var lastPage = $location.path();
		
		// always scroll to top on page load
		$rootScope.$on("$locationChangeSuccess", function(data){
			var currPage = $location.path();
			if(lastPage != currPage) { 
				$('#view')[0].style.display = 'none'
				$timeout(function() { $('#scrollTarget').scrollTop(0); });
			}
			lastPage = currPage;
		});
	}]);
	
	
	// Main controller
	app.controller('AppCtrl', AppCtrl);
	
	AppCtrl.$inject = ['$scope'];
	function AppCtrl($scope) {
		
		//nothing...
		
	}
}());
