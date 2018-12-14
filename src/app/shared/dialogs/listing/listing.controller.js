(function () {
	angular.module('App')
		.controller('MarketListingDialogCtrl', MarketListingDialogCtrl);

	MarketListingDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$location', 'web3Service', 'marketContract'];
	function MarketListingDialogCtrl($scope, $mdMedia, $mdDialog, $location, web3Service, marketContract) {
		var _this = this;
		_this.closeDialog = closeDialog;
		_this.confirmPurchase = confirmPurchase;
		_this.confirmRemove = confirmRemove;
		_this.goPath = goPath;
		
		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function() { return $mdMedia('gt-md'); }, function(lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function() { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function(md) { _this.screenSize['md'] = md; });
		$scope.$watch(function() { return $mdMedia('xs'); }, function(sm) { _this.screenSize['sm'] = sm; });
		
		// Check account
		if(web3Service.getActiveAccount()) {
			// calculate fee
			var devFee = 0;
			marketContract.getMarketDetails().then(function(data) {
				devFee = data.devFee;
				_this.feePercent = Math.round(devFee*10000)/100;
				_this.fee = _this.price*devFee;
				_this.total = _this.price+_this.fee;
				
				// estimate gas costs
				if(_this.buyMode) {
					var value = _this.price + (_this.price*devFee);
					marketContract.verifyPurchase(_this.pixelconIdx, value).then(function(data) {
						_this.cost = data.estCost;
					});
				} else if(_this.removeMode) {
					marketContract.verifyRemoveListing(_this.pixelconIdx).then(function(data) {
						_this.cost = data.estCost;
					});
				}
			});
		} else {
			_this.error = true;
			_this.readOnly = web3Service.isReadOnly();
			_this.providerName = web3Service.getProviderName();
		}
		
		// Set title
		if(_this.buyMode) _this.title = 'Buy PixelCon';
		else if(_this.removeMode) _this.title = 'Remove Listing';
		
		// Purchases the pixelcon
		function confirmPurchase() {
			var value = _this.price + (_this.price*devFee);
			var transaction = marketContract.purchase(_this.pixelconId, _this.pixelconIdx, value);
			$mdDialog.hide(transaction);
		}
		
		// Removes the market listing
		function confirmRemove() {
			var transaction = marketContract.removeListing(_this.pixelconId, _this.pixelconIdx);
			$mdDialog.hide(transaction);
		}
			
		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
		}

		// Go to the specified path
		function goPath(path) {
			$location.url(path);
			$mdDialog.cancel();
		}
		
		// Close the dialog if page/account changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);
		web3Service.onAccountDataChange($mdDialog.cancel, $scope);
	}
}());
