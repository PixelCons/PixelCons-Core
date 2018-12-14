(function () {
	angular.module('App')
		.controller('CreatorPageCtrl', CreatorPageCtrl);

	CreatorPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$location', 'coreContract'];
	function CreatorPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $location, coreContract) {
		var _this = this;
		_this.creator = $routeParams.address;
		
		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function() { return $mdMedia('gt-md'); }, function(lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function() { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function(md) { _this.screenSize['md'] = md; });
		$scope.$watch(function() { return $mdMedia('xs'); }, function(sm) { _this.screenSize['sm'] = sm; });
		
		// Get details for the pixelcon id
		_this.loading = true;
		coreContract.fetchPixelconsByCreator($routeParams.address)
			.then(function(pixelcons) {
				_this.loading = false;
				
				_this.pixelcons = pixelcons;				
			}, function(reason) {
				_this.loading = false;
				_this.error = reason;
			});
	}
}());
