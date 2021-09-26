(function () {
	angular.module('App')
		.controller('DetailsPageCtrl', DetailsPageCtrl);

	DetailsPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$timeout', '$routeParams', '$sce', '$location', 'web3Service', 'coreContract', 'market'];
	function DetailsPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $timeout, $routeParams, $sce, $location, web3Service, coreContract, market) {
		var _this = this;
		var pixelconDetails;
		_this.rename = rename;
		_this.create = create;
		_this.send = send;
		_this.copyLink = copyLink;
		_this.shareOnTwitter = shareOnTwitter;
		_this.shareOnFacebook = shareOnFacebook;
		_this.marketEnabled = market.isEnabled();
		_this.marketLink = market.getItemLink();

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Format id (set to null if invalid)
		_this.pixelconId = coreContract.formatPixelconId($routeParams.id);
		_this.pixelconIndex = getIndexFromQRCode($routeParams.qrcode);
		
		// Redirect if invalid qrcode
		if(!!$routeParams.qrcode && _this.pixelconIndex === null) {
			$location.path('/');
			return;
		}

		// Get details for the pixelcon id
		loadPixelconDetails();
		function loadPixelconDetails(pixelcon) {
			_this.marketData = null;
			_this.details = null;
			_this.unclaimed = false;

			if (pixelcon) {
				setPixelconDetails(pixelcon);
			} else {
				_this.loading = true;
				_this.error = null;
				coreContract.fetchPixelcon((!!$routeParams.qrcode) ? _this.pixelconIndex : _this.pixelconId).then(function (pixelcon) {
					if (pixelcon && Array.isArray(pixelcon)) pixelcon = pixelcon[0];			
					_this.loading = false;
					if (pixelcon) {
						//correct to more standard url if from qr link
						if(!!$routeParams.qrcode) {
							$location.path('/details/' + pixelcon.id, false);
							$location.replace();
						}
						setPixelconDetails(pixelcon);
					} else {
						if (_this.pixelconId) {
							if (web3Service.isReadOnly()) _this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + 'This PixelCon does not exist yet...');
							else _this.unclaimed = true;
						} else {
							if(!!$routeParams.qrcode) _this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + 'This PixelCon does not exist yet...');
							else _this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + 'Invalid ID');
						}
					}
				}, function (reason) {
					_this.loading = false;
					_this.error = $sce.trustAsHtml('<b>Network Error:</b><br/>' + reason);
				});
			}
		}

		// Update from transaction
		function updateFromTransaction(transactionData) {
			if (transactionData && transactionData.success && transactionData.pixelcons) {
				let pixelcon = findInList(transactionData.pixelcons);
				if (pixelcon) {
					pixelcon = angular.extend({}, pixelconDetails, pixelcon);
					loadPixelconDetails(pixelcon);
				}
			}
		}

		// Sets page details to the given pixelcon data
		function setPixelconDetails(pixelcon) {
			pixelconDetails = pixelcon;
			_this.marketLink = market.getItemLink(pixelcon.id);
			_this.pixelconId = pixelcon.id;
			_this.pixelconIndex = pixelcon.index;			
			_this.details = {
				id: pixelcon.id,
				index: pixelcon.index,
				owner: pixelcon.owner,
				creator: pixelcon.creator,
				name: pixelcon.name,
				number: 'Number ' + pixelcon.index,
				date: 'Created ' + (new Date(pixelcon.date)).toLocaleDateString(),
				collection: pixelcon.collection
			}
			
			//scramble the collection pixelconIds
			if(pixelcon.collection) {
				_this.scrambledCollectionPixelconIds = web3Service.scrambleList(pixelcon.collection.pixelconIds, pixelcon.id);
			} else {
				_this.scrambledCollectionPixelconIds = null;
			}
			
			checkPermissions();
		}

		// Checks permissions for the action buttons
		function checkPermissions() {
			let account = web3Service.getActiveAccount();
			_this.isOwner = false;
			_this.isCreator = false;
			if (_this.details && account) {
				_this.isOwner = (account == _this.details.owner);
				_this.isCreator = (account == _this.details.creator);
			}
		}

		// Rename the pixelcon
		function rename(ev) {
			$mdDialog.show({
				controller: 'PixelconDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.pixelcon'],
				parent: angular.element(document.body),
				locals: { pixelconId: _this.pixelconId, editMode: true },
				bindToController: true,
				clickOutsideToClose: true
			});
		}

		// Create the pixelcon
		function create(ev) {
			$mdDialog.show({
				controller: 'PixelconDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.pixelcon'],
				parent: angular.element(document.body),
				locals: { pixelconId: _this.pixelconId },
				bindToController: true,
				clickOutsideToClose: true
			});
		}

		// Send pixelcon
		function send(ev) {
			$mdDialog.show({
				controller: 'SendDialogCtrl',
				controllerAs: 'ctrl',
				templateUrl: HTMLTemplates['dialog.send'],
				parent: angular.element(document.body),
				locals: { pixelconId: _this.pixelconId },
				bindToController: true,
				clickOutsideToClose: true
			});
		}

		// Gets page relevant pixelcon from list
		function findInList(list) {
			let pixelcon = null;
			if (list) {
				for (let i = 0; i < list.length; i++) {
					if (list[i].id == _this.pixelconId) {
						pixelcon = list[i];
						break;
					}
				}
			}
			return pixelcon;
		}
		
		// Gets the encoded index from the qrcode
		function getIndexFromQRCode(qrcode) {
			if(qrcode) {
				if(qrcode.indexOf('_') === 0 || qrcode.indexOf('~') === 0) {
					let index = modifiedBase64ToInt(qrcode.substr(1, qrcode.length));
					return index;
				}
			}
			return null;
		}

		// Copies share link to the clipboard
		function copyLink() {
			let copyText = document.getElementById("copyToClipboard");
			copyText.value = document.URL;
			copyText.select();
			document.execCommand("copy");
		}

		// Share this page on twitter
		function shareOnTwitter() {
			let url = "https://twitter.com/intent/tweet?url=";
			url += encodeURI(document.URL);
			url += '&text=' + encodeURI("Check out this PixelCon!");
			return url;
		}

		// Share this page on facebook
		function shareOnFacebook() {
			let url = "https://www.facebook.com/sharer/sharer.php?u="
			url += encodeURI(document.URL);
			return url;
		}
		
		// Base64 util functions
		function modifiedBase64ToInt(base64) {
			const modifiedBase64Digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-";
			let digits = modifiedBase64Digits.split('');
			let digitsMap = {};
			for (let i = 0; i < digits.length; i++) digitsMap[digits[i]] = i;
			
			let result = 0;
			let inputDigits = ("" + base64).split('');
			for (let i = 0; i < inputDigits.length; i++) {
				let digitVal = digitsMap[inputDigits[i]];
				if(digitVal === undefined) return null;
				result = (result << 6) + digitVal;
			}
			return result;
		}

		// Set flag the directive as loaded
		$timeout(function () {
			_this.loaded = true;
		});

		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			checkPermissions();
		}, $scope);

		// Listen for network data changes
		web3Service.onNetworkChange(function () {
			if(_this.error) loadPixelconDetails();
		}, $scope);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(updateFromTransaction, $scope);
	}
}());
