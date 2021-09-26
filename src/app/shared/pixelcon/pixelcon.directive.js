(function () {
	angular.module('App')
		.directive('pixelcon', pixelcon)
		.controller('PixelConCtrl', PixelConCtrl);

	PixelConCtrl.$inject = ['$scope', 'decoder'];
	function PixelConCtrl($scope, decoder) {
		var _this = this;

		// Watch for id changes to keep pixel data up to date
		$scope.$watch('ctrl.id', function(id) {
			_this.pixelconImage = decoder.encodePNG(id);
		});
	}

	function pixelcon() {
		return {
			restrict: 'E',
			scope: {
				id: '='
			},
			bindToController: true,
			controller: 'PixelConCtrl',
			controllerAs: 'ctrl',
			templateUrl: HTMLTemplates['shared.pixelcon']
		};
	}
}());
