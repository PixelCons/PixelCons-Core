(function () {
	angular.module('App')
		.controller('DetailsPageCtrl', DetailsPageCtrl);

	DetailsPageCtrl.$inject = ['$scope', '$mdMedia', '$mdDialog', '$routeParams', '$timeout', '$location', 'web3Service', 'coreContract', 'market'];
	function DetailsPageCtrl($scope, $mdMedia, $mdDialog, $routeParams, $timeout, $location, web3Service, coreContract, market) {
		var _this = this;
		var pixelconDetails;
		_this.rename = rename;
		_this.create = create;
		_this.send = send;
		_this.goPath = goPath;
		_this.generateTimeText = generateTimeText;
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
		var pixelconId = coreContract.formatPixelconId($routeParams.id);
		_this.pixelconId = pixelconId;

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
				coreContract.fetchPixelcon(pixelconId).then(function (pixelcon) {
					_this.loading = false;
					if (pixelcon) {
						setPixelconDetails(pixelcon);
					} else {
						if (web3Service.isReadOnly()) _this.error = 'This PixelCon does not exist yet...';
						else _this.unclaimed = true;
					}
				}, function (reason) {
					_this.loading = false;
					_this.error = reason;
				});
			}
		}

		// Update from transaction
		function updateFromTransaction(transactionData) {
			if (transactionData && transactionData.success && transactionData.pixelcons) {
				var pixelcon = findInList(transactionData.pixelcons);
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
			_this.details = {
				index: pixelcon.index,
				owner: pixelcon.owner,
				creator: pixelcon.creator,
				name: pixelcon.name,
				number: 'Number ' + pixelcon.index,
				date: 'Created ' + (new Date(pixelcon.date)).toLocaleDateString(),
				collection: pixelcon.collection
			}
			checkPermissions();
		}

		// Checks permissions for the action buttons
		function checkPermissions() {
			var account = web3Service.getActiveAccount();
			_this.isOwner = false;
			_this.isCreator = false;
			if (_this.details && account) {
				_this.isOwner = account == _this.details.owner;
				_this.isCreator = account == _this.details.creator;
			}
		}

		// Go to the specified path
		function goPath(path) {
			$location.url(path);
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
			var pixelcon = null;
			if (list) {
				for (var i = 0; i < list.length; i++) {
					if (list[i].id == _this.pixelconId) {
						pixelcon = list[i];
						break;
					}
				}
			}
			return pixelcon;
		}

		// Generates a time text from the given seconds
		function generateTimeText(seconds) {
			if (!seconds) return '???';

			var minutes = Math.floor(seconds / 60);
			var hours = Math.floor(minutes / 60);
			var days = Math.floor(hours / 24);
			if (days > 0) return (days + 1) + ' day' + (days > 1 ? 's' : '');
			else if (hours > 0) return (hours + 1) + ' hour' + (hours > 1 ? 's' : '');
			else if (minutes > 0) return (minutes + 1) + ' minute' + (minutes > 1 ? 's' : '');
			else return (seconds + 1) + ' second' + (seconds > 1 ? 's' : '');
		}

		// Copies share link to the clipboard
		function copyLink() {
			var copyText = document.getElementById("copyToClipboard");
			copyText.value = document.URL;
			copyText.select();
			document.execCommand("copy");
		}

		// Share this page on twitter
		function shareOnTwitter() {
			var url = "https://twitter.com/intent/tweet?url=";
			url += encodeURI(document.URL);
			url += '&text=' + encodeURI("Check out this PixelCon!");
			window.open(url, '_blank');
		}

		// Share this page on facebook
		function shareOnFacebook() {
			var url = "https://www.facebook.com/sharer/sharer.php?u="
			url += encodeURI(document.URL);
			window.open(url, '_blank');
		}

		// Set flag the directive as loaded
		$timeout(function () {
			_this.loaded = true;
		});

		// Listen for account data changes
		web3Service.onAccountDataChange(function () {
			checkPermissions();
		}, $scope);

		// Listen for transactions
		web3Service.onWaitingTransactionsChange(updateFromTransaction, $scope);
	}
}());
