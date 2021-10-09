(function () {
	angular.module('App')
		.directive('pixelcon', pixelcon)
		.controller('PixelConCtrl', PixelConCtrl);

	PixelConCtrl.$inject = ['$scope', 'decoder'];
	function PixelConCtrl($scope, decoder) {
		var _this = this;

		// Watch for id changes to keep pixel data up to date
		$scope.$watch('ctrl.id', function(id) {
			generateImage();
		});

		// Standardize large flag [boolean]
		$scope.$watch('ctrl.large', function () {
			generateImage();
		});
		
		// Generates the image
		function generateImage() {
			_this.large = (_this.large === true || _this.large == 'true');
			_this.pixelconImage = decoder.encodePNG(_this.id, _this.large);
		}
	}

	function pixelcon() {
		return {
			restrict: 'E',
			scope: {
				id: '=',
				large: '@'
			},
			bindToController: true,
			controller: 'PixelConCtrl',
			controllerAs: 'ctrl',
			templateUrl: HTMLTemplates['shared.pixelcon']
		};
	}
}());
