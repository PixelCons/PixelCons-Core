(function () {
	angular.module('App')
		.service('market', market);

	market.$inject = ['web3Service'];
	function market(web3Service) {
		var _enabled = true;
		var _accountLink = 'https://opensea.io/account';
		var _storeLink = 'https://opensea.io/assets/pixelcons?toggle%5Bon_sale%5D=true';
		var _itemLink = 'https://opensea.io/assets/0x5536b6aadd29eaf0db112bb28046a5fad3761bd4/';
		var _referral = '0x9f2fedfff291314e5a86661e5ed5e6f12e36dd37';

		// Setup functions
		this.isEnabled = isEnabled;
		this.getMarketLink = getMarketLink;
		this.getAccountLink = getAccountLink;
		this.getItemLink = getItemLink;
		this.getCollectionLink = getCollectionLink;
		this.getCreatorLink = getCreatorLink;


		///////////
		// Utils //
		///////////


		// Gets if the market is enabled
		function isEnabled() {
			return _enabled;
		}

		// Gets link to the market
		function getMarketLink() {
			return _storeLink;
		}

		// Gets link to account for the market
		function getAccountLink(id) {
			return _accountLink;
		}

		// Gets link to item for the market
		function getItemLink(id) {
			if (!id) return _storeLink;

			let l = _itemLink + web3Service.hexToInt(id);
			if (_referral) l += '?ref=' + _referral;
			return l;
		}

		// Gets link to collection for the market
		function getCollectionLink(index) {
			if (!index) return _storeLink;

			//let l = _itemLink + web3Service.hexToInt(index);
			//if (_referral) l += '?ref=' + _referral;
			//return l;
			return _storeLink;
		}

		// Gets link to creator for the market
		function getCreatorLink(id) {
			if (!id) return _storeLink;

			//let l = _itemLink + web3Service.hexToInt(id);
			//if (_referral) l += '?ref=' + _referral;
			//return l;
			return _storeLink;
		}

	}
}());
