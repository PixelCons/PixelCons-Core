(function () {
	angular.module('App')
		.controller('SellPixelconDialogCtrl', SellPixelconDialogCtrl);

	SellPixelconDialogCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', 'web3Service', 'coreContract', 'marketContract'];
	function SellPixelconDialogCtrl($scope, $mdMedia, $mdDialog, web3Service, coreContract, marketContract) {
		var _this = this;
		_this.sell = {};
		_this.closeDialog = closeDialog;
		_this.checkValidation = checkValidation;
		_this.confirmSale = confirmSale;
		
		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function() { return $mdMedia('gt-md'); }, function(lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function() { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function(md) { _this.screenSize['md'] = md; });
		$scope.$watch(function() { return $mdMedia('xs'); }, function(sm) { _this.screenSize['sm'] = sm; });
		
		// Get contract details
		var contractDetails;
		marketContract.getMarketDetails()
			.then(function(data) {
				contractDetails = data;
				_this.detailsKnown = true;
			});
			
		// Estimate gas cost
		coreContract.verifyTransferPixelconToMarket(_this.pixelconId, _this.sell.startPrice, _this.sell.endPrice, _this.sell.duration).then(function(data) {
			_this.cost = data.estCost;
		});
		
		// Checks if the input data is valid
		function checkValidation() {
			_this.errorText1 = '';
			_this.errorText2 = '';
			
			//start more than max price
			if(_this.sell.startPrice!==undefined && _this.sell.startPrice > contractDetails.maxPrice) {
				_this.sell.startPrice = undefined;
				_this.errorText1 = 'Start price cannot be';
				_this.errorText2 = 'more than ' + contractDetails.maxPrice + ' Ether';
			}
			
			//start less than min price
			else if(_this.sell.startPrice!==undefined && _this.sell.startPrice < contractDetails.minPrice) {
				_this.sell.startPrice = undefined;
				_this.errorText1 = 'Start price cannot be';
				_this.errorText2 = 'less than ' + contractDetails.minPrice + ' Ether';
			}
			
			//end more than max price
			else if(_this.sell.endPrice!==undefined && _this.sell.endPrice > contractDetails.maxPrice) {
				_this.sell.endPrice = undefined;
				_this.errorText1 = 'End price cannot be';
				_this.errorText2 = 'more than ' + contractDetails.maxPrice + ' Ether';
			}
			
			//end less than min price
			else if(_this.sell.endPrice!==undefined && _this.sell.endPrice < contractDetails.minPrice) {
				_this.sell.endPrice = undefined;
				_this.errorText1 = 'End price cannot be';
				_this.errorText2 = 'less than ' + contractDetails.minPrice + ' Ether';
			}
			
			//start price is less than end price
			else if(_this.sell.endPrice!==undefined && _this.sell.startPrice!==undefined && _this.sell.startPrice < _this.sell.endPrice) {
				_this.sell.endPrice = undefined;
				_this.errorText1 = 'End price cannot be more';
				_this.errorText2 = 'than the start price';
			}
			
			//more than max duration
			else if(_this.sell.duration!==undefined && _this.sell.duration > contractDetails.maxDuration) {
				_this.sell.duration = undefined;
				_this.errorText1 = 'Duration cannot be more';
				_this.errorText2 = 'than ' + contractDetails.maxDuration + ' days';
			}
			
			//less than min duration
			else if(_this.sell.duration!==undefined && _this.sell.duration < 1) {
				_this.sell.duration = undefined;
				_this.errorText1 = 'Duration cannot be less';
				_this.errorText2 = 'than 1 day';
			}
			
			//submit form
			_this.form.$setSubmitted();
			if(!_this.errorText1 && _this.form.$valid) _this.currView = 'confirm';
		}
			
		// Publishes the sale listing
		function confirmSale() {
			var transaction = coreContract.transferPixelconToMarket(_this.pixelconId, _this.sell.startPrice, _this.sell.endPrice, _this.sell.duration*24*60*60);
			$mdDialog.hide(transaction);
		}
			
		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
		}
		
		// Close the dialog if page/account changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);
		web3Service.onAccountDataChange($mdDialog.cancel, $scope);
	}
}());
