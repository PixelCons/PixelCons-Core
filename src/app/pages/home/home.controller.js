(function () {
	angular.module('App')
		.controller('HomePageCtrl', HomePageCtrl);

	HomePageCtrl.$inject = ['$scope', '$mdMedia', '$window', '$location', '$timeout', '$interval', 'decoder', 'market'];
	function HomePageCtrl($scope, $mdMedia, $window, $location, $timeout, $interval, decoder, market) {
		var _this = this;
		const slideWidth = 380;
		const slideAutoScrollDelay = 5000;
		_this.marketName = market.getMarketName();

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Curated collections
		_this.facesCollection = [
			'0x9a4994999499994999999999920990299cc99cc99cc77cc99cc00cc99cc9acc9',
			'0x9a99999994099049990990999999999992eeee29992882999997e99999999999',
			'0x8e8888888228822888022088880880888888888888e77e8882777728888ee888',
			'0x3b1331333133331333033033330330333331333333b303333333133333333333',
			'0x9a999999990990999909909999999999907777099400004999477499999aa999',
			'0x9a9999999949949994944949ee9999eeee99a4ee999909999999a49999999999',
			'0x9a99999999999099900490999999999994999949994224999998899999988999',
			'0xcc1cc1ccc1cccc1cc77cc77c97099079977997799990099999900999999aa999',
			'0x9a99999999999999944994499999999994000049903bb30994bbbb4999bbbb99'
		];
		
		// Timeline data
		const startMillis = 1527825600000;
		const currentMillis = (new Date()).getTime();
		const endMillis = 1672549200000;
		const years = [{
			text: '2019',
			millis: 1546318800000
		},{
			text: '2020',
			millis: 1577854800000
		},{
			text: '2021',
			millis: 1609477200000
		},{
			text: '2022',
			millis: 1641013200000
		}];
		let markers = [{
			text: 'Development Begins',
			description: 'The PixelCons project begins research and development phase.',
			millis: 1535774400000,
			minor: true,
			fulldate: 'September 1st, 2018'
		},{
			text: 'Contract Launch',
			description: 'The PixelCons contract finishes testing and is deployed to Ethereum mainnet.',
			link: 'https://etherscan.io/tx/0x09c63b0b85caf92142893764a645faa06827819b2d787b331fb0592539ed17d6',
			millis: 1543726800000,
			minor: true,
			fulldate: 'December 2nd, 2018'
		},{
			text: 'App v1.0 Released',
			description: 'Public release of the PixelCons application and website.',
			link: 'https://github.com/PixelCons/PixelCons-Core/releases/tag/v1.0',
			millis: 1544677200000,
			minor: true,
			fulldate: 'December 13th, 2018'
		},{
			text: 'App v1.1 Released',
			description: 'Optimizations, added OpenSea support and improved Metamask compatibility.',
			link: 'https://github.com/PixelCons/PixelCons-Core/releases/tag/v1.1',
			millis: 1546232400000,
			minor: true,
			fulldate: 'December 31st, 2018'
		},{
			text: 'App v1.2 Released',
			description: 'Improved market integration and fixed account bug and typos',
			link: 'https://github.com/PixelCons/PixelCons-Core/releases/tag/v1.2',
			millis: 1564718400000,
			minor: false,
			fulldate: 'August 2nd, 2019'
		},{
			text: 'App v1.3 Released',
			description: 'Improved social media linking, UI updates and modernized web3 framework.',
			link: 'https://github.com/PixelCons/PixelCons-Core/releases/tag/v1.3',
			millis: 1614834000000,
			minor: false,
			fulldate: 'March 4th, 2021'
		},{
			text: 'App v1.5 Released',
			description: 'Added advanced creation, massive visual and performance improvements.',
			link: 'https://github.com/PixelCons/PixelCons-Core/releases/tag/v1.5',
			millis: 1632628800000,
			minor: false,
			fulldate: 'September 26th, 2021'
		},{
			text: 'App v1.6 Released',
			description: 'New print feature, similarities search tool and perfomance updates.',
			link: 'https://github.com/PixelCons/PixelCons-Core/releases/tag/v1.6',
			millis: 1636866000000,
			minor: true,
			fulldate: 'November 14th, 2021'
		},{
			text: 'App v1.7 Released',
			description: 'Added ENS support, account verification, and added roadmap to home page.',
			link: 'https://github.com/PixelCons/PixelCons-Core/releases/tag/v1.7',
			millis: 1646024400000,
			minor: true,
			fulldate: 'February 28th 2022'
		}];
		let series = [{
			text: 'Genesis Series',
			description: 'The PixelCon Genesis series is minted.',
			color: '#FFCA43',
			icon: '/img/series/genesis_icon.png',
			image: '/img/series/genesis_card.png',
			link: 'https://genesis.pixelcons.io',
			millis: 1543730400000,
			minor: false,
			fulldate: 'December 2nd, 2018',
			date: 'Dec 2018'
		},{
			text: 'Invaders Series',
			description: 'The PixelCon Invaders series minting launches.',
			color: '#2A9EB8',
			icon: '/img/series/invaders_icon.png',
			image: '/img/series/invaders_card.png',
			link: 'https://invaders.pixelcons.io',
			millis: 1644987600000,
			minor: false,
			fulldate: 'February 16th 2022',
			date: 'Feb 2022'
		},{
			text: 'PixelConsole Series',
			description: 'The PixelConsole series initial art drop.',
			isWIP: true,
			color: '#F65D31',
			icon: '/img/series/console_icon.png',
			image: '/img/series/console_card.png',
			millis: 1654056000000,
			minor: false,
			fulldate: 'June 2022',
			date: 'Q3 2022'
		},{
			text: 'Series3',
			description: 'Upcoming PixelCon series currently in development.',
			isWIP: true,
			millis: 1667275200000,
			minor: false,
			fulldate: 'Sept/Oct 2022',
			date: 'Q4 2022'
		}];
			
		_this.timeline = {
			solidWidth: ((currentMillis-startMillis)/(endMillis-startMillis))*100 + '%',
			dashedWidth: ((endMillis-currentMillis)/(endMillis-startMillis))*100 + '%',
			years: [],
			markers: [],
			series: []
		}
		for(let i=0; i<years.length; i++) {
			let year = angular.copy(years[i]);
			year.left = 'calc(' + ((years[i].millis-startMillis)/(endMillis-startMillis))*100 + '% - 1px)';
			_this.timeline.years.push(year);
		}
		for(let i=0; i<markers.length; i++) {
			markers[i].left = 'calc(' + ((markers[i].millis-startMillis)/(endMillis-startMillis))*100 + '% - 10px)';
			_this.timeline.markers.push(markers[i]);
		}
		for(let i=0; i<series.length; i++) {
			series[i].left = 'calc(' + ((series[i].millis-startMillis)/(endMillis-startMillis))*100 + '% - 15px)';
			_this.timeline.series.push(series[i]);
		}
		
		_this.roadmapEvents = [];
		for(let i=0; i<markers.length; i++) {
			_this.roadmapEvents.push(markers[i]);
		}
		for(let i=0; i<series.length; i++) {
			_this.roadmapEvents.push(series[i]);
		}
		_this.roadmapEvents.sort(function(a,b) {
			return a.millis - b.millis;
		});
	}
}());
