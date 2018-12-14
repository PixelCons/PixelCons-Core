(function () {
	angular.module('App')
		.controller('HomePageCtrl', HomePageCtrl);

	HomePageCtrl.$inject = ['$scope', '$mdMedia', '$location'];
	function HomePageCtrl($scope, $mdMedia, $location) {
		var _this = this;
		_this.goPath = goPath;
		
		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function() { return $mdMedia('gt-md'); }, function(lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function() { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function(md) { _this.screenSize['md'] = md; });
		$scope.$watch(function() { return $mdMedia('xs'); }, function(sm) { _this.screenSize['sm'] = sm; });
		
		
		
		
		// Go to the specified path
		function goPath(path) {
			$location.url(path);
		}
	}
}());
