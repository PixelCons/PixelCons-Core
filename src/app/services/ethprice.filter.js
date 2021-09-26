(function () {
	angular.module('App')
		.filter('ethprice', ethprice);

	ethprice.$inject = [];
	function ethprice() {
		return function (number, symbol) {
			number = parseFloat(number);
			if (isNaN(number) || number < 0) return '---';

			// determine num digits to the left and right of decimal
			let digits = ("" + number).split('.');
			let upperDigits = parseInt(digits[0]);
			let lowerDigits = digits[1] ? parseFloat('0.' + digits[1]) : null;

			// start with a max of 5 digits (then subtract upper digits count)
			let maxDigits = 5;
			maxDigits -= digits[0].length;

			// round lower digits to however many digits are left
			if (lowerDigits) {
				if (maxDigits > 0) {
					let factor = Math.pow(10, maxDigits);
					lowerDigits = Math.round(lowerDigits * factor) / factor;
				} else {
					lowerDigits = null;
				}
			}

			//determine symbol
			let sign = 'Ξ';
			if (symbol !== undefined) {
				sign = '';
				if (symbol == 'ETH') sign = 'Ξ';
				else if (symbol == 'DAI' || symbol == 'USDC') {
					//dollar format
					let dollarAmount = number.toFixed(2)
					if (dollarAmount.substr(dollarAmount.length - 2, 2) == '00') dollarAmount = '' + parseInt(dollarAmount);
					return '$' + dollarAmount;
				}
			}

			//construct the number
			return sign + upperDigits + (lowerDigits ? ('.' + ('' + lowerDigits).split('.')[1]) : '');
		}
	}
}());
