(function () {
	angular.module('App')
		.controller('PrintsDialogCtrl', PrintsDialogCtrl);

	PrintsDialogCtrl.$inject = ['$scope', '$route', '$mdMedia', '$mdDialog', '$mdToast', '$timeout', '$sce', 'coreContract', 'decoder'];
	function PrintsDialogCtrl($scope, $route, $mdMedia, $mdDialog, $mdToast, $timeout, $sce, coreContract, decoder) {
		var _this = this;
		_this.updatePreview = updatePreview;
		_this.expandPreview = expandPreview;
		_this.downloadImage = downloadImage;
		_this.closeDialog = closeDialog;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Start Image Generaion
		if(_this.pixelcon) {
			//plain generator
			_this.imageConfig = {
				backgroundColor: '#000000',
				orientation: 'horizontal',
				ratio: 1.5,
				margin: 50,
				detailsSize: 'medium',
				includeQr: true,
				includeDetails: true,
				texture: 'none',
				intensity: 50
			}
			
			setPixelcon(_this.pixelcon);
		}
		
		// Updates the preview image
		var updatePreviewTimeount = null;
		function updatePreview() {
			if(!_this.imageConfig.margin) _this.imageConfig.margin = 0;
			
			_this.previewImage = null;
			if(updatePreviewTimeount) $timeout.cancel(updatePreviewTimeount);
			updatePreviewTimeount = $timeout(async function () {
				_this.previewImage = await decoder.generateDisplayImage(_this.pixelcon, _this.imageConfig.orientation, _this.imageConfig.ratio, _this.imageConfig.backgroundColor, 
					_this.imageConfig.margin, _this.imageConfig.includeQr, _this.imageConfig.includeDetails, _this.imageConfig.detailsSize, _this.imageConfig.texture, _this.imageConfig.intensity);
				$scope.$apply();
			}, 250);
		}
		
		// Expands the image preview
		function expandPreview() {
			if(_this.previewImage) {
				let d = document.createElement('div');
				d.className = 'imageExpandContainer';
				let d2 = document.createElement('div');
				d2.className = 'imageExpandImageDiv';
				d2.style = 'background-image: url(' + _this.previewImage + ');';
				let i1 = document.createElement('img');
				i1.className = 'imageExpandImage';
				i1.src = _this.previewImage;
				let d3 = document.createElement('div');
				d3.className = 'imageExpandClose';
				d3.onclick = function() {
					d.remove();
				}
		
				d.appendChild(d2);
				d.appendChild(d3);
				d2.appendChild(i1);
				document.body.appendChild(d);
			}
		}
		
		// Download image
		async function downloadImage(imageType) {
			let d = document.createElement('div');
			d.className = 'imageExpandContainer';
			let d2 = document.createElement('div');
			d2.className = 'imageExpandMessageDiv';
			d2.innerText = 'Generating Image...';
			d.appendChild(d2);
			document.body.appendChild(d);
			
			let downloadImage = await decoder.generateDisplayImage(_this.pixelcon, _this.imageConfig.orientation, _this.imageConfig.ratio, _this.imageConfig.backgroundColor, 
					_this.imageConfig.margin, _this.imageConfig.includeQr, _this.imageConfig.includeDetails, _this.imageConfig.detailsSize, _this.imageConfig.texture, _this.imageConfig.intensity, true, imageType);
			let a = document.createElement('a');
			a.href = downloadImage;
			a.download = "pixelcon" + _this.pixelcon.index + "_print." + imageType;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			
			d.remove();
		}
		
		// Fills in additional details about a pixelcon
		async function setPixelcon(pixelcon) {
			if(!pixelcon.dateMillis) {
				pixelcon = await coreContract.fetchPixelcon(pixelcon.id);
			}
			_this.pixelcon = pixelcon;
			updatePreview();
		}

		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
		}
		
		// Close the dialog if page/account changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);
	}
}());
