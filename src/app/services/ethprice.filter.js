(function () {
	angular.module('App')
		.filter('ethprice', ethprice);
		
	ethprice.$inject = [];
	function ethprice() {
		return function(number) {
			number = parseFloat(number);		
			if(isNaN(number) || number < 0) return '---';
			
			// determine num digits to the left and right of decimal
			var digits = (""+number).split('.');
			var upperDigits = parseInt(digits[0]);
			var lowerDigits = digits[1]?parseFloat('0.'+digits[1]):null;
			
			// start with a max of 5 digits (then subtract upper digits count)
			var maxDigits = 5;
			maxDigits -= digits[0].length;
			
			// round lower digits to however many digits are left
			if(lowerDigits) {
				if(maxDigits > 0) {
					var factor = Math.pow(10, maxDigits);
					lowerDigits = Math.round(lowerDigits*factor)/factor;
				} else {
					lowerDigits = null;
				}
			}
			
			//construct the number
			return 'Ξ' + upperDigits + (lowerDigits?('.'+(''+lowerDigits).split('.')[1]):'');
		}
	}
}());