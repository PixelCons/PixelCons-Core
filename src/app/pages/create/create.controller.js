(function () {
	angular.module('App')
		.controller('CreatePageCtrl', CreatePageCtrl);

	CreatePageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', 'web3Service', 'coreContract'];
	function CreatePageCtrl($scope, $mdMedia, $mdDialog, web3Service, coreContract) {
		var _this = this;
		_this.setPixel = setPixel;
		_this.setColor = setColor;
		_this.clear = clear;
		_this.create = create;
		_this.pixelconId = '';
		_this.selectedColor = 0;
		_this.colorPalette = {
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
			'10': '#FFFF27',
			'11': '#00E756',
			'12': '#29ADFF',
			'13': '#83769C',
			'14': '#FF77A8',
			'15': '#FFCCAA'
		}

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function() { return $mdMedia('gt-md'); }, function(lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function() { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function(md) { _this.screenSize['md'] = md; });
		$scope.$watch(function() { return $mdMedia('xs'); }, function(sm) { _this.screenSize['sm'] = sm; });

		// Start with blank canvas
		_this.canvasPixels = [];
		for(var i=0; i<64; i++) _this.canvasPixels[i] = 0;
		generatePixelconId();

		// Check if create is supported
		checkCreateSupported();
		function checkCreateSupported() {
			var web3state = web3Service.getState();
			if(web3state=="ready") {
				if(web3Service.getActiveAccount()) {
					_this.showButtons = true;
				} else {
					if(web3Service.isReadOnly()) {
						_this.infoText = 'You need an Ethereum Account to create PixelCons';
						_this.showStartButton = true;
					} else if(web3Service.isPrivacyMode()) {
						_this.infoText = 'Please connect your Ethereum Account';
					} else {
						_this.infoText = 'Please log into ' + web3Service.getProviderName();
					}
					_this.showButtons = false;
				}
			} else if(web3state=="not_enabled") {
				_this.infoText = 'You need an Ethereum Account to create PixelCons';
				_this.showStartButton = true;
				_this.showButtons = false;
			} else {
				_this.infoText = 'Unkown Network Error';
				_this.showButtons = false;
			}
		}

		// Set pixel to the selected color
		function setPixel(index, $event) {
			if($event && $event.buttons != 1) return;
			_this.canvasPixels[index] = _this.selectedColor;
			generatePixelconId();
		}

		// Set color
		function setColor(index) {
			_this.selectedColor = index;
		}

		// Create the pixelcon
		function create(ev) {
			$mdDialog.show({
				controller: 'PixelconDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.pixelcon'],
				parent: angular.element(document.body),
				locals:{pixelconId: _this.pixelconId},
				bindToController: true,
				clickOutsideToClose: true
			});
		}

		// Clear the canvas
		function clear(ev) {
			for(var i=0; i<64; i++) _this.canvasPixels[i] = 0;
			generatePixelconId();
		}

		// Generate the pixelcon id from canvas
		function generatePixelconId() {
			_this.pixelconId = '0x';
			var hexDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
			for(var i=0; i<64; i++) _this.pixelconId += hexDigits[_this.canvasPixels[i]];
		}

		// Listen for account data changes
		web3Service.onAccountDataChange(checkCreateSupported, $scope);
	}
}());
