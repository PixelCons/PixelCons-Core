(function () {
	angular.module('App')
		.directive('pixelcon', pixelcon)
		.controller('PixelConCtrl', PixelConCtrl);

	PixelConCtrl.$inject = ['$scope'];
	function PixelConCtrl($scope) {
		var _this = this;
		var colorPalette = {
			'0': '#000000',
			'1': '#1D2B53',
			'2': '#7E2553',
			'3': '#008751',
			'4': '#AB5236',
			'5': '#5F574F',
			'6': '#C2C3C7',
			'7': '#FFF1E8',
			'8': '#FF004D',
			'9': '#FFA300',
			'a': '#FFFF27',
			'b': '#00E756',
			'c': '#29ADFF',
			'd': '#83769C',
			'e': '#FF77A8',
			'f': '#FFCCAA'
		}
		
		// Watch for id changes to keep pixel data up to date
		$scope.$watch('ctrl.id', idToPixels);
		
		// Function to convert id string into pixels
		function idToPixels(id) {
			var canvas = document.createElement('canvas');
			canvas.width = 24;
			canvas.height = 24;
			var ctx = canvas.getContext("2d");
			ctx.fillStyle = "#000000";
			ctx.fillRect(0,0,24,24);
			
			var idIsValid = false;
			if(id && (typeof id === 'string' || id instanceof String)) {
				id = id.toLowerCase();
				if(id.indexOf('0x') == 0) id = id.substr(2,id.length);
				
				if(id.length == 64) {
					idIsValid = true;
					for(var i=0; i<64; i++) {
						var v = id.charCodeAt(i);
						if(!(v >= 48 && v <= 57) && !(v >= 97 && v <= 102)) {
							idIsValid = false;
							break;
						} 
					}
				}
			}
			
			if(idIsValid) {
				for(var y=0; y<8; y++) {
					for(var x=0; x<8; x++) {
						var index = y*8 + x;
						ctx.fillStyle = colorPalette[id[index]];
						ctx.fillRect(x*3, y*3, (x*3)+3, (y*3)+3);
					}
				}
			}
			
			_this.pixelconImage = canvas.toDataURL('image/png');
		}
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
