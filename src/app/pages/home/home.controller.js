(function () {
	angular.module('App')
		.controller('HomePageCtrl', HomePageCtrl);

	HomePageCtrl.$inject = ['$scope', '$mdMedia', '$window', '$timeout'];
	function HomePageCtrl($scope, $mdMedia, $window, $timeout) {
		var _this = this;
		_this.sliderDotClick = sliderDotClick;

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
		_this.showcaseList = [{
			name: 'Developers',
		},{
			name: 'Dev2',
		},{
			name: 'AndHeGames',
		},{
			name: 'Pico8',
		},{
			name: 'Inaki Diaz',
		},{
			name: 'Anonymous',
		},{
			name: 'Anonymous',
		},{
			name: 'Anonymous',
		}];
		
		// Slider Logic
		const slideScroller = document.querySelector('.slides');
		function recalcSliderDotHighlight() {
			const slideWidth = 380;
			let highlightIndex = Math.floor((slideScroller.scrollLeft+(slideWidth/2))/slideWidth);
			if(_this.sliderDotHighlight != highlightIndex) {
				_this.sliderDotHighlight = highlightIndex;
				$timeout(function() { $scope.$apply(); });
			}
		}
		function recalcSliderSize(innerWidth) {
			if(innerWidth < 800) {
				_this.sliderClass = { "single": true };
				_this.sliderDots = [];
				for(let i=0; i<_this.showcaseList.length-0; i++) _this.sliderDots.push(i);
				
			} else if(innerWidth < 1180) {
				_this.sliderClass = { "double": true };
				_this.sliderDots = [];
				for(let i=0; i<_this.showcaseList.length-1; i++) _this.sliderDots.push(i);
				
			} else {
				_this.sliderClass = { "triple": true };
				_this.sliderDots = [];
				for(let i=0; i<_this.showcaseList.length-2; i++) _this.sliderDots.push(i);
				
			}
			recalcSliderDotHighlight();
		}
		function sliderDotClick(index) {
			if(index > -1 && index < _this.sliderDots.length) {
				document.querySelector('#slide-' + index).scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
			}
		}
		$scope.$watch(function () { return $window.innerWidth }, recalcSliderSize);
		angular.element(slideScroller).bind('scroll', recalcSliderDotHighlight);
		
		recalcSliderSize($window.innerWidth);
		
		
		/*
		_this.curationList = [{
			name: 'Genesis Collection',
			width: 5,
			items: [
				{ type: 'pxcn', link: '/details/', id: '0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0' },
				{ type: 'pxcn', link: '/details/', id: '0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000' },
				{ type: 'pxcn', link: '/details/', id: '0x00b3b300000b300000ee28000e8e88800ee88280028288200028820000022000' },
				{ type: 'pxcn', link: '/details/', id: '0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1' },
				{ type: 'pxcn', link: '/details/', id: '0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400' },
				{ type: 'pxcn', link: '/details/', id: '0x000000000e807600e7e767608e87776008877600008760000006000000000000' },
				{ type: 'pxcn', link: '/details/', id: '0x7600000067600000067600400067d090000d7d900000d930004993b30000003b' },
				{ type: 'pxcn', link: '/details/', id: '0x0d777d00677777607767767d767007076d6007070677707d000d776000006770' },
				{ type: 'pxcn', link: '/details/', id: '0x0000000000c777c00cc777cc066ccc66006ccc600006c6000000c00000000000' },
				{ type: 'link', text: 'View All Genesis', link: '/creator/', id: '0x9f2fedfff291314e5a86661e5ed5e6f12e36dd37' }]
		}, {
			name: 'Video Games',
			width: 5,
			items: [
				{ type: 'pxcn', link: '/details/', id: '0x0ccccc00cccfccc00cccc0c0cccdfff401cc44000c1cff1d070c010000870d20' },
				{ type: 'pxcn', link: '/details/', id: '0x09999990097999090099090000977771d409dd000494664dd2740400000862d0' },
				{ type: 'pxcn', link: '/details/', id: '0x000ff00000fcfc004444822204449220888a892271161d160011110000100100' },
				{ type: 'blank', link: '', id: '' },
				{ type: 'pxcn', link: '/details/', id: '0x0110000100a90009000aaaa9990a0aa09908aaa9090a999009a9a9a000a94490' },
				{ type: 'pxcn', link: '/details/', id: '0x0000444400044f40004f40f0024fffff2242f44442448fff21449920f4ff8840' },
				{ type: 'pxcn', link: '/details/', id: '0x000000000200880020088888200f40f0020fffff0448fffff02982040ff04400' },
				{ type: 'link', text: 'More By Creator', link: '/creator/', id: '0xf88e77f202db096e75596b468eef7c16282156b1' },
				{ type: 'pxcn', link: '/details/', id: '0x000aaa9000aa0a0900aa0a090aaaaaa999aa8809990aaa920088022008880222' },
				{ type: 'pxcn', link: '/details/', id: '0x0000000000ccc1000ccccc10cc07c061cc77c661cccccc11cccccc11c0cc0c11' },
				{ type: 'pxcn', link: '/details/', id: '0x009040000699f00006619100099fff100782200077382d00903a34000070d000' },
				{ type: 'blank', link: '', id: '' },
				{ type: 'pxcn', link: '/details/', id: '0x00bbaa9007bafaa937fa0f00070ffff007bbf306ccc4943d0f0bb30d00040200' },
				{ type: 'pxcn', link: '/details/', id: '0x00a998400aaaaf900afa0f000aaffff0afee8800a74ee8407499a96000eec800' },
				{ type: 'pxcn', link: '/details/', id: '0x0094994004b930331149bb3341193330411199901101122044244dd001111220' }]
		}, {
			name: 'Cave Story',
			width: 5,
			items: [
				{ type: 'pxcn', link: '/details/', id: '0x0877770088888888b1616160b371716b00777700075500000788700000110000' },
				{ type: 'pxcn', link: '/details/', id: '0x0aaaaaa09aaaaaa0b911611a39c77c909977779097ee99a00744700000220000' },
				{ type: 'pxcn', link: '/details/', id: '0x0000000007677760777171707771717677677776000cc000007cc50000076000' },
				{ type: 'pxcn', link: '/details/', id: '0x0bbbbbb033b9bbb33355b55b339f77f0039fff000076700000f7690000442000' },
				{ type: 'blank', link: '', id: '' },
				{ type: 'link', text: 'View Full Collection', link: '/collection/', id: '2' },
				{ type: 'pxcn', link: '/details/', id: '0x000000001747747066466466677667766716671646466466264664620dd00110' },
				{ type: 'pxcn', link: '/details/', id: '0x0dd11110d111661d165575501617717016777770110300110067b7000300d100' },
				{ type: 'pxcn', link: '/details/', id: '0x001cccc0001c82c0001c22c000977c700694fff0686f44006772600055001100' },
				{ type: 'pxcn', link: '/details/', id: '0x0bbbbbb033b9bbb33355b55b339272f0339fff300376733000f7690000dd5000' }]
		}, {
			name: 'Street Fighter',
			width: 5,
			items: [
				{ type: 'pxcn', link: '/details/', id: '0x0004442208288820ff7ff0f0ff7ffff0fff4fff00ff4fd240777ddd40f000040' },
				{ type: 'pxcn', link: '/details/', id: '0x00aaaa99000a9ff0cfb9f0f08f3ffff0ffff4ff20fff43420bb3033004000020' },
				{ type: 'pxcn', link: '/details/', id: '0x077444d0077ff440004f0f00cc1fff10ff1c111004f1f204004cc400070cc0d0' },
				{ type: 'link', text: 'View Full Collection', link: '/collection/', id: '3' },
				{ type: 'pxcn', link: '/details/', id: '0x00044440000ffff0fff4f040ff2444f0ff9ff4420f9f4400ff88224088000220' },
				{ type: 'pxcn', link: '/details/', id: '0x0004442000446762004f6062ffa77777ffa22dd0408882000ad019dd04000200' },
				{ type: 'pxcn', link: '/details/', id: '0x000028920008881166d1f0f088fffff286ff1ff206d2114f88821210600000d0' },
				{ type: 'pxcn', link: '/details/', id: '0x0008800055128880f5588ff0ff5ff0f0fff22ff20ff2f124055511100f000040' },
				{ type: 'pxcn', link: '/details/', id: '0x0000ff400ff4f0f0fff40ff0ff477ffdff77740d0f788200008c111000f00040' }]
		}, {
			name: 'Mario Bros.',
			width: 5,
			items: [
				{ type: 'pxcn', link: '/details/', id: '0x0008887000088888004f40f0004ff44f0004fff0088acc9070cccc1d00400020' },
				{ type: 'pxcn', link: '/details/', id: '0x000bbb70000bbbbb00444ff0004f40f0000ff44f0bbafff070cccc1d00400020' },
				{ type: 'pxcn', link: '/details/', id: '0x077888007778887088777780887fff8077f0f06000ffff00fcc7714004402200' },
				{ type: 'pxcn', link: '/details/', id: '0x00090900000c98000aafaaa0aaff0f090acffff1aaee8890ae877d6008888880' },
				{ type: 'pxcn', link: '/details/', id: '0x008b3b0008b0bbbb0077bbbb0877bbbb008677703833663003b3663300880220' },
				{ type: 'pxcn', link: '/details/', id: '0x00788020037b0fff734fffff394ffee0790afff9340a69090996649009a00490' },
				{ type: 'pxcn', link: '/details/', id: '0x0000a09000090a00000aaaaa0b7a9aaab7a669903a4676040369764000bb0330' },
				{ type: 'pxcn', link: '/details/', id: '0x70d0a09077d90a0077daaaaa087a9aaa87a669902a4676040269764000880220' },
				{ type: 'pxcn', link: '/details/', id: '0x0000000000044000004444000440402044722227444444420029900000442200' },
				{ type: 'blank', link: '', id: '' },
				{ type: 'pxcn', link: '/details/', id: '0x00aaa79000aaaaaa0f4f0ee00ff00ee000ffffff0a97ee6070eeee2d00d00010' },
				{ type: 'pxcn', link: '/details/', id: '0x00022700002222200f4f0f0000f000e0021f77002292ff2d7111110009000400' },
				{ type: 'blank', link: '', id: '' },
				{ type: 'link', text: 'View Full Collection', link: '/collection/', id: '6' },
				{ type: 'pxcn', link: '/details/', id: '0x000878000078888002887766028772260b222220b002d2000b000000bbb33300' }]
		}, {
			name: 'Super Heroes',
			width: 5,
			items: [
				{ type: 'link', text: 'More By Creator', link: '/creator/', id: '0x4ff81761e0e8d3d311163b1b17607165c2d4955f' },
				{ type: 'pxcn', link: '/details/', id: '0x1555555105aaaa50c0aaa90cc10a901c070a9071100a900114f77f415ffffff5' },
				{ type: 'pxcn', link: '/details/', id: '0x500000050000000003030030300b300337bbbb733bb77bb33bb00bb353bbbb35' },
				{ type: 'pxcn', link: '/details/', id: '0x50000005711111177011110777100177777007771660066110077001510ee015' },
				{ type: 'pxcn', link: '/details/', id: '0x5eeeeee588888888802882082702207227700772277007728002200858888885' },
				{ type: 'pxcn', link: '/details/', id: '0x5855558588888888882222888211112887211278822888888ff77ff85ffffff5' },
				{ type: 'pxcn', link: '/details/', id: '0x5ccaacc5a1a99a1aaa9999aa900000099710017990dddd099d7777d95dddddd5' },
				{ type: 'pxcn', link: '/details/', id: '0x588888858828828889a22a78899aa97827799772299aaa7299a55a7959aaaa95' },
				{ type: 'pxcn', link: '/details/', id: '0x58eeee858888e788008888000118811007000070000000000058850058888885' },
				{ type: 'pxcn', link: '/details/', id: '0x5333333533bbbb333b0053333066760335576553306776033065560353333335' }]
		}, {
			name: 'Disney',
			width: 5,
			items: [
				{ type: 'pxcn', link: '/details/', id: '0x00011000000110000111f140011f0f010000ff4010011100017182d000990440' },
				{ type: 'pxcn', link: '/details/', id: '0x00011000000810000181f140011f0f010700ff4010111116011ee80000990440' },
				{ type: 'link', text: 'View Full Collection', link: '/collection/', id: '8' },
				{ type: 'pxcn', link: '/details/', id: '0x00047999f00717100ff9999904499ee0404299927004220d00ff444005500011' },
				{ type: 'pxcn', link: '/details/', id: '0x000d1100000822000011111000d71700607999908cc8212d76c7d00298042402' },
				{ type: 'pxcn', link: '/details/', id: '0x000ccd0000177700000717000009999000cc800077c7d1d00776600099044400' },
				{ type: 'pxcn', link: '/details/', id: '0x0000000000088000008772000071700000999900688200000786000099044000' },
				{ type: 'pxcn', link: '/details/', id: '0x00000000000cc00000c77d0000717000009999006ccd000007c6000099044000' },
				{ type: 'pxcn', link: '/details/', id: '0x00000000000bb00000b7730000717000009999006bb3000007b6000099044000' }]
		}, {
			name: 'Food',
			width: 5,
			items: [
				{ type: 'pxcn', link: '/details/', id: '0x000043b0000bb03b00babb0000babb000babbb300babbb3003bbb33000333300' },
				{ type: 'pxcn', link: '/details/', id: '0x00000aa00000009a00000949aaaaaa4a9aaaa4aa49944aaa9aaaaaa009aaaa00' },
				{ type: 'pxcn', link: '/details/', id: '0x00b0b0b0000bbb000093b4000949494004949440094949400494944000444400' },
				{ type: 'link', text: 'More By Creator', link: '/creator/', id: '0x421ec412e458c9c57cbdb3fe8510b8b08a02af2a' },
				{ type: 'pxcn', link: '/details/', id: '0x0088bb0009993b809aa999889aa99988999999889a9999880999988000888800' },
				{ type: 'pxcn', link: '/details/', id: '0x000bb0bb0000b3bb00009b30000999bb009f990b09a990000999000099000000' },
				{ type: 'pxcn', link: '/details/', id: '0x0cc00cc0cc7ccc7ccccdcc7dcccdcccdcccdcccdcccccccc044004400ff00ff0' },
				{ type: 'pxcn', link: '/details/', id: '0x00000000003333000303b33033333b333b3333330bbb33300bab3333babbb333' },
				{ type: 'pxcn', link: '/details/', id: '0x009919000c199990911a911999a9911949999994044444400949494002494920' },
				{ type: 'pxcn', link: '/details/', id: '0x0078e066077887607f777ff777fff47707444470007227000007700000777700' }]
		}, {
			name: 'TMNT',
			width: 5,
			items: [
				{ type: 'pxcn', link: '/details/', id: '0x000bbb3001cc0c0000bbbbb304bbbeb3443444004b3a9a3004b9990000b00300' },
				{ type: 'pxcn', link: '/details/', id: '0x000bbb300288080000bbbbb304bb33b3443444004b3a9a3004b9990000b00300' },
				{ type: 'pxcn', link: '/details/', id: '0x000bbb3002ee0e0000bbbbb304bbb3b3443444004b3a9a3004b9990000b00300' },
				{ type: 'pxcn', link: '/details/', id: '0x000bbb300499090000b77bb304b777b3443444004b3a9a3004b9990000b00300' },
				{ type: 'pxcn', link: '/details/', id: '0x0400200004442200444040204444441102244411828222004228822004000200' },
				{ type: 'blank', link: '', id: '' },
				{ type: 'link', text: 'View Full Collection', link: '/collection/', id: '4' },
				{ type: 'pxcn', link: '/details/', id: '0x00066d000066ddd0066d0e0d066d6ddd021222202d55225d2f00550e216055d2' },
				{ type: 'pxcn', link: '/details/', id: '0x0994424000ee1e100299744d23899440338d4620998844249055555400800020' },
				{ type: 'pxcn', link: '/details/', id: '0x00d0010f00ddddff02dd0dff0ddddddddd9dddd042999942dd44442000400020' }]
		}, {
			name: 'Pokemon',
			width: 5,
			items: [
				{ type: 'pxcn', link: '/details/', id: '0x00000000000000000000033000b3b3330bdbb33300b0bb3b0bbbdbbd0030b30b' },
				{ type: 'pxcn', link: '/details/', id: '0x0060007000ccc7600c0c06000ccccc4000111c2700ca9c2600c9a16000100c00' },
				{ type: 'pxcn', link: '/details/', id: '0x009990909990949099999dd900449dd909aa49d809aa498a049a949879407900' },
				{ type: 'blank', link: '', id: '' },
				{ type: 'pxcn', link: '/details/', id: '0x005005500a00aa000aaaa00000a0a00a0aaa80aa009aa0a90099a490099a9000' },
				{ type: 'pxcn', link: '/details/', id: '0x00000000000000d0dd0dd00dfdddfd0dd0d0d00d0fff2dd00d72ddd0040f40f0' },
				{ type: 'pxcn', link: '/details/', id: '0x440442004444209004042009fff2400907ff42090fff429090f9240004400400' },
				{ type: 'pxcn', link: '/details/', id: '0x000000000000000000066000007676000d6e6660d06e6606dd066066dd000066' },
				{ type: 'pxcn', link: '/details/', id: '0x0dd000660dd00066dd666606d67676660d666d6006d6d66000666d000dd00660' },
				{ type: 'blank', link: '', id: '' },
				{ type: 'pxcn', link: '/details/', id: '0x0000000000700000097900000090900009894007004490090089849400089840' },
				{ type: 'pxcn', link: '/details/', id: '0x0000000000aa90000a0a09000aa99900044444000a4a490004a4940000494000' },
				{ type: 'pxcn', link: '/details/', id: '0x505670670595967608a897670a9996700054456005059656705a507670a59070' },
				{ type: 'link', text: 'More By Creator', link: '/creator/', id: '0x2c755a1231bcabb363598277c52be7865d365257' },
				{ type: 'pxcn', link: '/details/', id: '0x008cc80008dcd88008c8cc80cc0dc0cc00700700024cd420240c004220400420' }]
		}];
		_this.calcShowcaseStyle = function (curation) {
			let itemWidth = (_this.screenSize.sm) ? 56 : 80;
			let columns = curation.width;
			return {
				width: columns * itemWidth + 'px'
			};
		}
		*/

	}
}());
