(function () {
	angular.module('App')
		.controller('StartPageCtrl', StartPageCtrl);

	StartPageCtrl.$inject = ['$scope', '$mdMedia', '$timeout', 'web3Service'];
	function StartPageCtrl($scope, $mdMedia, $timeout, web3Service) {
		var _this = this;
		_this.setStepTab = setStepTab;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Check web3 status
		updateWeb3Status();
		function updateWeb3Status() {
			var state = web3Service.getState();
			var activeAccount = web3Service.getActiveAccount();
			if (activeAccount) {
				_this.activeAccount = activeAccount;
				_this.addressIcon = blockies.create({
					seed: activeAccount.toLowerCase(),
					size: 8,
					scale: 6
				}).toDataURL();
			}

			var hasWeb3 = state != "not_enabled" && !web3Service.isReadOnly();
			var isMobileOrTablet = checkMobileOrTablet();
			var isUsingMetaMask = web3Service.getProviderName() == "MetaMask";
			var isFirefox = typeof InstallTrigger !== 'undefined';
			var isEdge = window.navigator.userAgent.indexOf('Edg/') > -1;
			var isChrome = !isEdge && !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime) && !navigator.brave;
			var isBrave = !isEdge && !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime) && !!navigator.brave;

			_this.browserCheck = hasWeb3 || (!isMobileOrTablet && (isChrome || isFirefox || isBrave || isEdge));
			_this.linkCheck = hasWeb3;
			_this.accountCheck = _this.activeAccount != undefined;
			_this.recommendMetaMask = !hasWeb3 || isUsingMetaMask;

			_this.stepTab = 1;
			if (_this.browserCheck) _this.stepTab++;
			if (_this.linkCheck) _this.stepTab++;

			_this.hideSetup = _this.accountCheck;
		};

		// Set the step tab
		function setStepTab(tab) {
			if (tab < 1) tab = 1;
			if (tab > 3) tab = 3;
			_this.stepTab = tab;
		}
		// Check if browser is mobile or tablet
		function checkMobileOrTablet() {
			var check = false;
			(function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || window.opera);
			return check;
		}

		// Collapse all how to topics
		checkHideAllTopic();
		function checkHideAllTopic() {
			if ($mdMedia('xs')) {
				_this.hideSearchByName = true;
				_this.hideSearchForSale = true;
				_this.hideSearchPixelconDetails = true;
				_this.hideViewPixelcon = true;
				_this.hideEditPixelcon = true;
				_this.hideViewCollection = true;
				_this.hideEditCollection = true;
				_this.hideViewCreator = true;
				_this.hideCreatePixelcon = true;
				_this.hideAccountActivity = true;
				_this.hideViewWallet = true;
				_this.hideSellPixelcon = true;
				_this.hideSendPixelcon = true;
				_this.hideCreateCollection = true;
			}
		}

		// Set flag the directive as loaded
		$timeout(function () {
			_this.loaded = true;
		});

		// Listen for account data changes and waiting transactions
		web3Service.onStateChange(function () {
			updateWeb3Status();
		}, $scope);
		web3Service.onAccountDataChange(function () {
			updateWeb3Status();
		}, $scope);
	}
}());
