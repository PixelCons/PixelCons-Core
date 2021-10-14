(function () {
	angular.module('App')
		.service('market', market);

	market.$inject = ['web3Service'];
	function market(web3Service) {
		const _enabled = true;
		const _accountLink = 'https://opensea.io/account';
		const _storeLink = 'https://opensea.io/assets/pixelcons?collectionSlug=pixelcons&search[sortAscending]=false&search[sortBy]=LAST_SALE_PRICE';
		const _itemLink = 'https://opensea.io/assets/0x5536b6aadd29eaf0db112bb28046a5fad3761bd4/<id>';
		const _collectionLink = 'https://opensea.io/collection/pixelcons?collectionSlug=pixelcons&search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=Collection&search[stringTraits][0][values][0]=<collectionProperty>';
		const _creatorLink = 'https://opensea.io/collection/pixelcons?collectionSlug=pixelcons&search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=Creator&search[stringTraits][0][values][0]=<creatorProperty>';
		const _ownerLink = 'https://opensea.io/<ownerProperty>';

		// Setup functions
		this.isEnabled = isEnabled;
		this.getMarketLink = getMarketLink;
		this.getAccountLink = getAccountLink;
		this.getItemLink = getItemLink;
		this.getCollectionLink = getCollectionLink;
		this.getCreatorLink = getCreatorLink;
		this.getOwnerLink = getOwnerLink;


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

			let l = _itemLink.split('<id>').join(web3Service.hexToInt(id));
			return l;
		}

		// Gets link to collection for the market
		function getCollectionLink(index, name) {
			if (!index || !name) return _storeLink;

			let collectionProperty = 'Collection ' + index + ' [' + name + ']';
			let l = _collectionLink.split('<collectionProperty>').join(encodeURIComponent(collectionProperty));
			return l;
		}

		// Gets link to creator for the market
		function getCreatorLink(address) {
			address = formatAddress(address);
			if (!address) return _storeLink;

			let creatorProperty = '' + address;
			let l = _creatorLink.split('<creatorProperty>').join(encodeURIComponent(creatorProperty));
			return l;
		}

		// Gets link to owner for the market
		function getOwnerLink(address) {
			address = formatAddress(address);
			if (!address) return _storeLink;

			let ownerProperty = '0x' + address;
			let l = _ownerLink.split('<ownerProperty>').join(encodeURIComponent(ownerProperty));
			return l;
		}
		
		// Formats an address to 40 character standard
		function formatAddress(address) {
			const hexCharacters = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
			if(address) {
				address = address.toLowerCase();
				if(address.indexOf('0x') == 0) address = address.substr(2,address.length);
				if(address.length < 40) return null;
				if(address.length > 40) address = address.substring(address.length-40, address.length);
				for(let i=0; i<40; i++) if(hexCharacters.indexOf(address[i]) == -1) return null;
				return address;
			}
			return null;
		}

	}
}());
