(function () {
	angular.module('App')
		.controller('HomePageCtrl', HomePageCtrl);

	HomePageCtrl.$inject = ['$scope', '$mdMedia'];
	function HomePageCtrl($scope, $mdMedia) {
		var _this = this;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		//curated collections
		_this.facesCollection = [
			'0x9a4994999499994999999999920990299cc99cc99cc77cc99cc00cc99cc9acc9',
			'0x9a99999994099049990990999999999992eeee29992882999997e99999999999',
			'0x8e8888888228822888022088880880888888888888e77e8882777728888ee888',
			'0x3b1331333133331333033033330330333331333333b303333333133333333333',
			'0x9a999999990990999909909999999999907777099400004999477499999aa999',
			'0x9a9999999949949994944949ee9999eeee99a4ee999909999999a49999999999',
			'0x9a99999999999099900490999999999994999949994224999998899999988999',
			'0xcc1cc1ccc1cccc1cc77cc77c97099079977997799990099999900999999aa999',
			'0x9a99999999999999944994499999999994000049903bb30994bbbb4999bbbb99'
		];
		_this.calcShowcaseStyle = function (curation) {
			var itemWidth = (_this.screenSize.sm) ? 56 : 80;
			var columns = curation.width;
			return {
				width: columns * itemWidth + 'px'
			};
		}

	}
}());
