(function () {
	angular.module('App')
		.directive('appHeader', appHeader)
		.controller('HeaderCtrl', HeaderCtrl);

	HeaderCtrl.$inject = ['$scope', '$mdMedia', '$mdToast', '$mdMenu', '$timeout', '$location', '$window', 'web3Service', 'market'];
	function HeaderCtrl($scope, $mdMedia, $mdToast, $mdMenu, $timeout, $location, $window, web3Service, market) {
		var _this = this;
		_this.noWeb3 = false;
		_this.loggedIn = false;
		_this.web3error = false;
		_this.waitingTransactions = [];
		_this.accounts = [];
		_this.setAccount = setAccount;
		_this.goPath = goPath;
		_this.goDetails = goDetails;
		_this.closeMenu = $mdMenu.hide;
		_this.showActivityMenu = showActivityMenu;
		_this.cancelActivityMenu = cancelActivityMenu;
		_this.hideActivityMenu = hideActivityMenu;
		_this.connect = connect;
		_this.marketEnabled = market.isEnabled();
		_this.marketLink = market.getMarketLink();
		var showMenuPromise = null;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Watch for path changes
		$scope.$watch(function () { return $location.path(); }, function (value) {
			if (value.indexOf('/search') == 0) _this.page = 'browse';
			else if (value.indexOf('/account') == 0) _this.page = 'account';
			else if (value.indexOf('/create') == 0) _this.page = 'create';
			else if (value.indexOf('/details') == 0) _this.page = 'details';
			else _this.page = 'other';
		});

		// Configure user account icon
		updateUserAccountIcon();
		function updateUserAccountIcon() {
			var web3state = web3Service.getState();
			_this.noWeb3 = (web3state == "not_enabled" || web3Service.isReadOnly());
			_this.loggedIn = (web3state == "ready" && !web3Service.isReadOnly());
			_this.web3error = (web3state != "not_enabled" && web3state != "ready" && !web3Service.isReadOnly());
			_this.web3ProviderName = web3Service.getProviderName();
			_this.privacyMode = web3Service.isPrivacyMode();

			_this.net = web3Service.getExpectedNetwork();
			_this.badNetwork = web3Service.isWrongNetwork();

			var accountStrings = web3Service.getAllAccounts();
			_this.accounts = [];
			if (accountStrings.length > 0) {
				for (var i = 0; i < accountStrings.length; i++) {
					var address = accountStrings[i];
					var icon = blockies.create({
						seed: address.toLowerCase(),
						size: 8,
						scale: 3
					}).toDataURL();
					_this.accounts.push({
						id: address,
						icon: icon
					});
				}
			}

			var address = web3Service.getActiveAccount();
			if (address) {
				_this.userIcon = blockies.create({
					seed: address.toLowerCase(),
					size: 8,
					scale: 6
				}).toDataURL();
			} else {
				_this.userIcon = '';
			}
		};

		// Configure transaction indicator
		updateTransactionIndicator();
		function updateTransactionIndicator(transactionData) {
			var waitingTransactions = web3Service.getWaitingTransactions();
			var activeAccount = web3Service.getActiveAccount();
			if (activeAccount) {
				_this.waitingTransactions = waitingTransactions;
				if (transactionData) {
					if (transactionData.success) {
						$mdToast.show(
							$mdToast.simple()
								.action('Confirmed')
								.highlightAction(true)
								.highlightClass('md-primary headerTransactionEndButton ' + transactionData.txHash)
								.textContent(transactionData.type)
								.position('top right')
								.hideDelay(3000)
						);
					} else {
						$mdToast.show(
							$mdToast.simple()
								.action('Failed')
								.highlightAction(true)
								.highlightClass('md-warn headerTransactionEndButton ' + transactionData.txHash)
								.textContent(transactionData.type)
								.position('top right')
								.hideDelay(3000)
						);
					}
				}
			}
		};
		$(document).on('click', '.headerTransactionEndButton', function (ev) {
			//hook into the button click at the event level to avoid popup being blocked
			var txHash = ev.currentTarget.classList[ev.currentTarget.classList.length - 1];
			if (txHash == 'headerTransactionEndButton') txHash = null;
			$window.open(web3Service.getTransactionLookupUrl(txHash));
		});

		// Set to given user account
		function setAccount(account) {
			web3Service.setActiveAccount(account);
		}

		// Go to the specified path
		function goPath(path) {
			if ($location.path() == path) $('#scrollTarget').scrollTop(0);
		}

		// Go to lookup details page
		function goDetails(txHash) {
			return web3Service.getTransactionLookupUrl(txHash);
		}

		// Show menu
		function showActivityMenu(showFunc) {
			showMenuPromise = $timeout(showFunc, 200);
		}

		// Cancel menu
		function cancelActivityMenu() {
			$timeout.cancel(showMenuPromise);
		}

		// Hide menu
		function hideActivityMenu() {
			$mdMenu.hide();
			$timeout.cancel(showMenuPromise);
		}

		// Connect account
		function connect() {
			web3Service.requestAccess();
		}

		// Listen for account data changes and waiting transactions
		web3Service.onAccountDataChange(updateUserAccountIcon, $scope);
		web3Service.onWaitingTransactionsChange(updateTransactionIndicator, $scope);
	}

	function appHeader() {
		return {
			restrict: 'E',
			scope: {},
			bindToController: true,
			controller: 'HeaderCtrl',
			controllerAs: 'ctrl',
			templateUrl: HTMLTemplates['shared.header']
		};
	}
}());
