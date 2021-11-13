(function () {
	angular.module('App')
		.controller('HomePageCtrl', HomePageCtrl);

	HomePageCtrl.$inject = ['$scope', '$mdMedia', '$window', '$location', '$timeout', '$interval', 'decoder', 'market'];
	function HomePageCtrl($scope, $mdMedia, $window, $location, $timeout, $interval, decoder, market) {
		var _this = this;
		const slideWidth = 380;
		const slideAutoScrollDelay = 5000;
		_this.marketName = market.getMarketName();
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
			name: 'The Devs',
			title: 'Faces and Icons',
			address: '0x9f2fedfff291314e5a86661e5ed5e6f12e36dd37',
			pixelconIds: [
				'0x9a999999990990999909909999999999907777099400004999477499999aa999','0x8e8888888228822888022088880880888888888888e77e8882777728888ee888','0x9a99999999999099900490999999999994999949994224999998899999988999','0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1','0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400',
				'0x11111110111fffe000010010fdf00e00ffffff200effeee00e2fffe00ee22000','0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000','0x00b3b300000b300000ee28000e8e88800ee88280028288200028820000022000','0x0d777d00677777607767767d767007076d6007070677707d000d776000006770','0x0000000000e777e00ee777ee088eee88008eee800008e8000000e00000000000',
				'0x7600000067600000067600400067d090000d7d900000d9200049928200000028','0x000001dd0992010d42a90d000079000000a49a790074444000a94a90004aa940','0x9444444094444440a9999990412121206161616070707070767676706dddddd0','0x00000000000000000866a66d01d76d10047dd642046dc6420446644200000000','0x00d000d0000d0d00dddddd99d7600844d6000c44d0006d44d0067d44dddddd44',
				'0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0','0x00001000000001000000110000066600d6722270d0d777601ddd6660001d6610','0x000000000cc7c7c00cc677c00cccccc00c7777c00c7777c00d6666d000000000','0x00028000028880000027770004970700004977700002877000028777000d7777','0x00ee00000efa4000eea79900244aa990149aaa9f1199aaf701199fff00114442'
			],
			color: 'e2dad4',
			link: '/creator/0x9f2fedfff291314e5a86661e5ed5e6f12e36dd37',
			marketLink: 'https://opensea.io/collection/pixelcons?search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=Genesis&search[stringTraits][0][values][0]=2018%20Genesis&search[stringTraits][1][name]=Creator&search[stringTraits][1][values][0]=9f2fedfff291314e5a86661e5ed5e6f12e36dd37',
			startIndex: 0,
			count: 84,
			disabled: false
		},{
			name: 'Anonymous',
			title: 'Scenes',
			address: '0x3bf64000788a356d9d7c38a332adbce539fff13d',
			pixelconIds: [
				'0x776ccccc77888ecc788888ecc8777826c8888827cc8882ccbbbd1bbb3336d333','0xccccccc6ccbbb3676b8bb31773bb3816763311ccccc42cccb8b9413b33333333','0xc7cccccccccb3ccccb3b3ccccb3b1b3cc3bb1b3ccc3bb3ccaaab324999999999','0xccc7cccccc8822ccc888222c88882222cd7d616cc777666cb7d76663bbbbbbbb','0xccccccccccc33cccca913ccccc33ccccc447cc6cc47776cccc67777c11111111',
				'0xcc1110ccc111110ccc070dccc9976dcccc8822cc46778644c71786dc677766d6','0xeeeeeeee9aaaaaaed9d9d9cec0c0c0ce8aaaa9aa9009900a10011001dddddddd','0xeeeeeeeeee3333eee36636eee3cc3cee8333333a3003300310011001dddddddd','0x9aa9e888e99eeeeeeeee88888887688eee7766eee333111e33333111bbbbb333','0x88888888899944488cc7112889994448ecc7112ef999444fd9c94141dddddddd',
				'0xccc77cccccc66cccc76a976cc769476cccc773ccccc66c3ccccccc3c44444434','0xcccccccccc8722ccc7e8826cc888722cccc94ccccccf9ccc3bbb333313bbbb31','0xccccccccc44cc99ccffc9ff9ddddeeeefdd99eeffd9ff9efb1f88feb31188223','0xccccccccc44cc99ccffc9ff9ddddeeeefdd44eeffddffeefb1fccfeb311cc223','0x3333bbb3333bb89b33101a8b316101bb301000b3310001334410144444444444',
				'0x7e7d644447e7644444707e44447777441dd11000400000044110000421d10002','0xccccccc6ccbbb3676b8bb31773bb3816763311ccccc42cccb8b9413b33333333','0xcc1110ccc111110ccc070dccc9976dcccc8822cc46778644c71786dc677766d6','0x88888888899944488cc7112889994448ecc7112ef999444fd9c94141dddddddd','0xcccccccccc8722ccc7e8826cc888722cccc94ccccccf9ccc3bbb333313bbbb31'
			],
			color: 'd4e2e2',
			link: '/creator/0x3bf64000788a356d9d7c38a332adbce539fff13d',
			marketLink: 'https://opensea.io/collection/pixelcons?search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=Genesis&search[stringTraits][0][values][0]=2018%20Genesis&search[stringTraits][1][name]=Creator&search[stringTraits][1][values][0]=3bf64000788a356d9d7c38a332adbce539fff13d',
			startIndex: 84,
			count: 16,
			disabled: false
		},{
			name: 'AndHeGames',
			title: 'Cave Story',
			address: '0x0507873482d57637e8d975640316b0a6b2ebbfc1',
			pixelconIds: [
				'0x0877770088888888b1616160b371716b00777700075500000788700000110000','0x0aaaaaa09aaaaaa0b911611a39c77c909977779097ee99a00744700000220000','0x0000000007677760777171707771717677677776000cc000007cc50000076000','0x0bbbbbb033b9bbb33355b55b339f77f0039fff000076700000f7690000442000','0x000000001747747066466466677667766716671646466466264664620dd00110',
				'0x0dd11110d111661d165575501617717016777770110300110067b7000300d100','0x001cccc0001c82c0001c22c000977c700694fff0686f44006772600055001100','0x0bbbbbb033b9bbb33355b55b339272f0339fff300376733000f7690000dd5000','0x0077770007776770671e61e077777770775772600755500000ddd70000766000','0x0066700009ffff009f7ff7f0678778709f7ff7f009ffff006777700055005500',
				'0x00677770067577576775775777e7777e7077777670033b0600763b0000776670','0x00444440022444440224494403b73b73707b77b7703777700033300000776600','0x03bb03bb3b1bbb1b3b1bbb1b3b1bbb1b37bbbbb76b11111b67777770033b033b','0x0677600067777600757757507577575077577750077774570044456007676770','0x077777707557755777777777676767670776767033bbbbbb77bbbbb607766770',
				'0x0066665066644442066404026654444200dd422000dd1d0004dd1d0000440220','0xe0dddd500ed0dd050dd0d505ddd77776d0d78760d001100500ddc0000dd55d50','0x600000d06d6666606d686860dd666660dd600060dd6666600055000000606000','0x007700000887600000677700069ffff043977f77f3977f774bb9fff040b33300','0x00499990049899740499944403976764777b8b76679bbb74067b8b7600990440'
			],
			color: 'e2d4e1',
			link: '/creator/0x0507873482d57637e8d975640316b0a6b2ebbfc1',
			marketLink: 'https://opensea.io/collection/pixelcons?search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=Genesis&search[stringTraits][0][values][0]=2018%20Genesis&search[stringTraits][1][name]=Creator&search[stringTraits][1][values][0]=0507873482d57637e8d975640316b0a6b2ebbfc1',
			startIndex: 100,
			count: 25,
			disabled: false
		},{
			name: 'Crypto8',
			title: '100 Characters',
			address: '0xf88e77f202db096e75596b468eef7c16282156b1',
			pixelconIds: [
				'0x0008887000088888004f40f0004ff44f0004fff0088acc9070cccc1d00400020','0x000bbb70000bbbbb00444ff0004f40f0000ff44f0bbafff070cccc1d00400020','0x008b3b0008b0bbbb0077bbbb0877bbbb008677703833663003b3663300880220','0x0099449000997700000ffff00088fffd6702801d700220000099004400660ddd','0x000aaa9000aa0a0900aa0a090aaaaaa999aa8809990aaa920088022008880222',
				'0x000bbb3001cc0c0000bbbbb304bbbeb3443444004b3a9a3004b9990000b00300','0x000bbb300499090000b77bb304b777b3443444004b3a9a3004b9990000b00300','0x0000000000ccc1000ccccc10cc07c061cc77c661cccccc11cccccc11c0cc0c11','0x00a9a9a000aaaaa000aa0a0000aaaaa000aaaa000888882090cccc1900cc0110','0x00a0a0000aaaaa00aaa0a0a00aaaaa0000aa90000a882900a888229000994000',
				'0x00700060007777700070ff00bb7ffff03cbcccc0f3ccccc40011111000f00040','0x0000000000999990094799470994909404944944999999909099999400900040','0x0004442208288820ff7ff0f0ff7ffff0fff4fff00ff4fd240777ddd40f000040','0x077444d0077ff440004f0f00cc1fff10ff1c111004f1f204004cc400070cc0d0','0x0000444400044f40004f40f0024fffff2242f44442448fff21449920f4ff8840',
				'0x000000000200880020088888200f40f0020fffff0448fffff02982040ff04400','0x00bbaa9007bafaa937fa0f00070ffff007bbf306ccc4943d0f0bb30d00040200','0x00011000000110000111f140011f0f010000ff4010011100017182d000990440','0x0ccccc00cccfccc00cccc0c0cccdfff401cc44000c1cff1d070c010000870d20','0x0110000100a90009000aaaa9990a0aa09908aaa9090a999009a9a9a000a94490'
			],
			color: 'e2ded4',
			link: '/creator/0xf88e77f202db096e75596b468eef7c16282156b1',
			marketLink: 'https://opensea.io/collection/pixelcons?search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=Genesis&search[stringTraits][0][values][0]=2018%20Genesis&search[stringTraits][1][name]=Creator&search[stringTraits][1][values][0]=f88e77f202db096e75596b468eef7c16282156b1',
			startIndex: 125,
			count: 100,
			disabled: false
		},{
			name: 'Inaki Diaz',
			title: 'Comics',
			address: '0x4ff81761e0e8d3d311163b1b17607165c2d4955f',
			pixelconIds: [
				'0x1555555111ccc1c11011cc111001110117700771100000011ff77ff151ffff15','0x5000775700557c7505ffccc50fffc00cf0ff0aacffff444cfff7794c5fff44c5','0x5e855e85588e788502288220088888800a2882a0028888200880088000000000','0x1555555105aaaa50c0aaa90cc10a901c070a9071100a900114f77f415ffffff5','0x500000050000000003030030300b300337bbbb733bb77bb33bb00bb353bbbb35',
				'0x50000005711111177011110777100177777007771660066110077001510ee015','0x58eeee858888e788008888000118811007000070000000000058850058888885','0x5cccccc57cc77cc771711717117c17111f1cc1f111cffc1114f77f415ffffff5','0x5855558588888888882222888211112887211278822888888ff77ff85ffffff5','0x5eeeeee588888888802882082702207227700772277007728002200858888885',
				'0x5055550501011010001001000111111007111170000000000000000050000005','0x511151111cc11c111fffff1f27eeee722eeffee2affffffa9ff88ff95ffffff5','0x5888888588882285001cc00804f11f4117ffff711ffffff11ffeeff15cffffc5','0x50000500000000000111111011cccc111a0cc0a1c001100c5c0770c55cc11cc5','0x5667766567777776786776877887788776855867656666566050050656000065',
				'0x5888eee52888887e288888820444404007fff0700ffff0f00ff88ff005ffff50','0x5544445554477945944444949224422997f44f799f4444f9944ff44944422444','0x5333333533bbbb333b0053333066760335576553306776033065560353333335','0x5444444544444444404ccc100f4ffff0080ff0811ffffff116f77f61516ff615','0x5011110501a11a10001aa100880aa088870880780866668084f77f485ffffff5'
			],
			color: 'dae2d4',
			link: '/creator/0x4ff81761e0e8d3d311163b1b17607165c2d4955f',
			marketLink: 'https://opensea.io/collection/pixelcons?search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=Genesis&search[stringTraits][0][values][0]=2018%20Genesis&search[stringTraits][1][name]=Creator&search[stringTraits][1][values][0]=4ff81761e0e8d3d311163b1b17607165c2d4955f',
			imageBackground: '#5F574F',
			startIndex: 225,
			count: 100,
			disabled: false
		},{
			name: 'Anonymous',
			title: 'Status Unknown',
			address: '0xd99f18ecc67d0b4011fd6ac8425422bf733b05fc',
			pixelconIds: [
				'0x00ccc0000c1c1c000e1c1e000cc7cc0000ccc060076767000776700000707000','0x00500500009889000087780060511506508ee005055665500849940008558550','0x000000000bbbbb00bb7bbbb0bbb0b0b0bbb0b0b00bbbbb00b00000b000000000','0x06c66c6000c22c0000cffcc00867768c0f5665f0006776000080080000700700','0x01cc1cc11c7ccc7c1c0c4c0c11c444c10111111f00f383f00f09a90000c0c000',
				'0x00555500055fff5005f1f1f00ff1f1f000ffff000076670000f4490000011000','0x0078880007888880088008800000780000078000000880000000000000078000','0x1189900008988800001c1c00819999809899c990801991899080080000980980','0x0077700007262000072999000079900007655550474467000976000009099000','0x99999fff99440f7f47f702ff4fff08004444200028280000f111000004040000',
				'0x0cccccc0c11cc11cccc11cccc1cccc1cc171171ccccccccc0001100000c00c00','0x0bbbabb0bbbabbbbb07bb77bb77bb70bbb3333bbbbbaabbb0003300000b00b00','0x0888888088828888888828888788887882822828888888880002200000800800','0x40444400044fff4004f4f40004f4f40000ffff0000c88c000f0890f000500500','0x0011100007799700070333330333737331333333311881000311113000303000',
				'0x00ccc0000cc7c7000c99f9000c9ff940cdcccd00cd3c3000c4d3d00000404400','0x000000000000000090099700a9997170a9ff979090fff555044fff0000000000','0x09088000808878080888888005757700445665504222ee22442ee20000500550','0x00b303b000333b000003b3000004390000449490004949400044949000044400','0x0000000000999900099aa99009a99a9009a99a90099aa9900099990000000000'
			],
			color: 'e2ded4',
			link: '/creator/0xd99f18ecc67d0b4011fd6ac8425422bf733b05fc',
			marketLink: 'https://opensea.io/collection/pixelcons?search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=Genesis&search[stringTraits][0][values][0]=2018%20Genesis&search[stringTraits][1][name]=Creator&search[stringTraits][1][values][0]=d99f18ecc67d0b4011fd6ac8425422bf733b05fc',
			startIndex: 325,
			count: 48,
			disabled: true
		},{
			name: 'Anonymous',
			title: 'Status Unknown',
			address: '0x2c755a1231bcabb363598277c52be7865d365257',
			pixelconIds: [
				'0x0000000000000800000388200b3b3223bdbb33300b0bb3b0bbbdbbd0030b30b0','0x00000000000000000999900000909000099990a00044908000aa940009a94000','0x6ccc1007ccc0c476ccccc4604aaadc402c999c202ca9a121019a9c1071000700','0x6050576075d5767668d857660dcd56767655576067dd567606c0c76700000000','0x505670670595967608a897670a9996700054456005059656705a507670a59070',
				'0x00000000000000d0dd0dd00dfdddfd0dd0d0d00d0fff2dd00d72ddd0040f40f0','0x00040400044440000040440008844004004488240266288202dd622000800800','0x005005500a00aa000aaaa00000a0a00a0aaa80aa009aa0a90099a490099a9000','0x00000000000d066000dd6cc606666c60006066d006666d6d0076666600606d06','0xd0000000dd20dddd0dddd33d00d0d3d00dddd20007872dd00022d22d0062727d',
				'0x0000000000000000040ef04000efff00000e0f000ef8fff000efffef07fe7f2e','0x00000a0a00949aaa09494a8a4949aaaa9494499a494aaaaa09a99a0990aa9a09','0x00c00c0010cccc01210c0c1222707c2222000c2202000c2000cccc0000100c00','0x082942808f8498f88828f288028f8820002222000d82822000ddd20000d00d00','0x000000000000000008a08a800a4498a009994940979794904999494994009049',
				'0x004440000004040000284400044242440040204004842484f442f444efefefef','0x000000000559055005f9fe50000f0f0400fff004000eefe0000fef0004f00e40','0x0010c0c000c8cc00000c0c000aaacc0000011c0c000c17c000010c0000710c70','0x00000990000aaa0030aaaaa0337a7a90039aa9b008899bbb080890bb00880000','0x008cc80008dcd88008c8cc80cc0dc0cc00700700024cd420240c004220400420'
			],
			color: 'd4e2da',
			link: '/creator/0x2c755a1231bcabb363598277c52be7865d365257',
			marketLink: 'https://opensea.io/collection/pixelcons?search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=Genesis&search[stringTraits][0][values][0]=2018%20Genesis&search[stringTraits][1][name]=Creator&search[stringTraits][1][values][0]=2c755a1231bcabb363598277c52be7865d365257',
			startIndex: 373,
			count: 78,
			disabled: true
		},{
			name: 'Anonymous',
			title: 'Status Unknown',
			address: '0x421ec412e458c9c57cbdb3fe8510b8b08a02af2a',
			pixelconIds: [
				'0x000043b0000bb03b00babb0000babb000babbb300babbb3003bbb33000333300','0x00000aa00000009a00000949aaaaaa4a9aaaa4aa49944aaa9aaaaaa009aaaa00','0x0000bbb0000b0b0000b00b0000b0088008808878887808888888088008800000','0x0088bb0009993b809aa999889aa99988999999889a9999880999988000888800','0x00000000000000d076666d670768b67000733700000770000007700000777700',
				'0x0cc00cc0cc7ccc7ccccdcc7dcccdcccdcccdcccdcccccccc044004400ff00ff0','0x0000033000099aa30b9994a3ba444ab3baaaab333bbbb3300333330000333000','0x009919000c199990911a911999a9911949999994044444400949494002494920','0x0078e066077887607f777ff777fff47707444470007227000007700000777700','0x0444444049f949f44f49949404929940049929400449944004f49f4004444440',
				'0x04000040042004e004424ee004444440204404404044044424e4444002044200','0x0000000000774220027404227774042200744422727777220e2077220ee67777','0x0007a0000009900007a44aa07887a88aa887a88a922aa229092992909aa7aaa9','0x000b3000003b310000b3330003bb33100b3333303bbb33310004200000242200','0x00ccc0000ccc0c000ccc0c00aacccc000ccccccc0ccc1cc000ccc10000a00a00',
				'0x0474440047447440644447446244444422244477222247240222622200226222','0x0099490009949990949499492222224992929922429299240542445000525200','0x0088880088288288889aa98888288288008888000000b0000b30b0b000b3b300','0x880000888880088802222220fff82fff099829900ff82ff00ff82ff00ff82ff0','0x0088066000888860088886200888876288886770068870700666707000067000'
			],
			color: 'd7d4e2',
			link: '/creator/0x421ec412e458c9c57cbdb3fe8510b8b08a02af2a',
			marketLink: 'https://opensea.io/collection/pixelcons?search[sortAscending]=true&search[sortBy]=PRICE&search[stringTraits][0][name]=Genesis&search[stringTraits][0][values][0]=2018%20Genesis&search[stringTraits][1][name]=Creator&search[stringTraits][1][values][0]=421ec412e458c9c57cbdb3fe8510b8b08a02af2a',
			startIndex: 451,
			count: 200,
			disabled: true
		}];
		for(let i=0; i<_this.showcaseList.length; i++) {
			_this.showcaseList[i].image = decoder.generateTiledImage(_this.showcaseList[i].pixelconIds, 5, 4, 8, _this.showcaseList[i].imageBackground, false, false, false);
			_this.showcaseList[i].addressIcon = blockies.create({
				seed: _this.showcaseList[i].address.toLowerCase(),
				size: 8,
				scale: 6
			}).toDataURL();
		}
		
		// Slider Logic
		const slideScrollerContainer = document.querySelector('.slider');
		const slideScroller = document.querySelector('.slides');
		var slideShowCount = 1;
		var slideMoved = false;
		var slideMoveDistance = 0;
		var slideMoveProcessTimeout = null;
		var slideAutoScrollDelayInterval = $interval(sliderAutoScroll, slideAutoScrollDelay);
		var slidesGrabbing = false;
		var slidesHovering = false;
		function recalcSliderDotHighlight() {
			let highlightIndex = Math.floor((slideScroller.scrollLeft+(slideWidth/2))/slideWidth);
			if(_this.sliderDotHighlight != highlightIndex) {
				_this.sliderDotHighlight = highlightIndex;
				$timeout(function() { $scope.$apply(); });
			}
		}
		function recalcSliderSize(innerWidth) {
			if(innerWidth < 800 || _this.showcaseList.length <= 1) {
				_this.sliderClass = { "single": true };
				_this.sliderDots = [];
				slideShowCount = 1;
				for(let i=0; i<_this.showcaseList.length-0; i++) _this.sliderDots.push(i);
				
			} else if(innerWidth < 1180 || _this.showcaseList.length <= 2) {
				_this.sliderClass = { "double": true };
				_this.sliderDots = [];
				slideShowCount = 2;
				for(let i=0; i<_this.showcaseList.length-1; i++) _this.sliderDots.push(i);
				
			} else if(innerWidth < 1580 || _this.showcaseList.length <= 3) {
				_this.sliderClass = { "triple": true };
				_this.sliderDots = [];
				slideShowCount = 3;
				for(let i=0; i<_this.showcaseList.length-2; i++) _this.sliderDots.push(i);
				
			} else {
				_this.sliderClass = { "quadruple": true };
				_this.sliderDots = [];
				slideShowCount = 4;
				for(let i=0; i<_this.showcaseList.length-3; i++) _this.sliderDots.push(i);
				
			}
			recalcSliderDotHighlight();
		}
		function sliderDotClick(index) {
			if(index > -1 && index < _this.sliderDots.length) {
				slideScroller.scrollLeft = index*slideWidth;
			}
		}
		function sliderAutoScroll() {
			let nonDisabledCount = 0;
			for(let i=0; i<_this.showcaseList.length; i++) if(!_this.showcaseList[i].disabled) nonDisabledCount++;
			let maxAutoPaging = (nonDisabledCount - slideShowCount) + Math.floor((_this.showcaseList.length - nonDisabledCount)/2) + 1;
			if(maxAutoPaging > 0) {
				let highlightIndex = Math.floor((slideScroller.scrollLeft+(slideWidth/2))/slideWidth);
				sliderDotClick((highlightIndex + 1) % maxAutoPaging);
			}
		}
		function sliderMouseEnter(ev) {
			if(slideAutoScrollDelayInterval) $interval.cancel(slideAutoScrollDelayInterval);
			slideAutoScrollDelayInterval = null;
			slidesHovering = true;
		}
		function sliderMouseDown(ev) {
			slidesGrabbing = true;
		}
		function sliderMouseMove(ev) {
			if(slidesGrabbing) {
				slideMoveDistance += ev.movementX;
				if(Math.abs(slideMoveDistance) > 10) slideMoved = true;
				
				if(slideMoveProcessTimeout) $timeout.cancel(slideMoveProcessTimeout);
				slideMoveProcessTimeout = $timeout(function() {
					let steps = 0;
					while(slideMoveDistance > slideWidth) {
						steps--;
						slideMoveDistance -= slideWidth;
					}
					while(slideMoveDistance < -(slideWidth)) {
						steps++;
						slideMoveDistance += slideWidth;
					}
					while(slideMoveDistance > slideWidth/2) {
						steps--;
						slideMoveDistance -= slideWidth/2;
					}
					while(slideMoveDistance < -(slideWidth/2)) {
						steps++;
						slideMoveDistance += slideWidth/2;
					}
					if(steps < 0) {
						let highlightIndex = Math.floor((slideScroller.scrollLeft+(slideWidth/2))/slideWidth);
						sliderDotClick(Math.max(highlightIndex + steps, 0));
					}
					if(steps > 0) {
						let highlightIndex = Math.floor((slideScroller.scrollLeft+(slideWidth/2))/slideWidth);
						sliderDotClick(Math.min(highlightIndex + steps, _this.sliderDots.length - 1));
					}
					slideMoveProcessTimeout = null;
				}, 30);
			}
		}
		function sliderMouseUp(ev) {
			if(!slideMoved) {
				let link = null;
				let el = ev.srcElement;
				while(el) {
					if(el.attributes && el.attributes.index && el.attributes.index.value) {
						link = _this.showcaseList[parseInt(el.attributes.index.value)].link;
						break;
					}
					el = el.parentElement;
				}
				if(link) $location.path(link);
			}
			slideMoved = false;
			slideMoveDistance = 0;
			slidesGrabbing = false;
		}
		function sliderMouseLeave(ev) {
			if(slideAutoScrollDelayInterval) $interval.cancel(slideAutoScrollDelayInterval);
			slideAutoScrollDelayInterval = $interval(sliderAutoScroll, slideAutoScrollDelay);
			slideMoved = false;
			slideMoveDistance = 0;
			slidesGrabbing = false;
			slidesHovering = false;
		}
				
		$scope.$watch(function () { return $window.innerWidth }, recalcSliderSize);
		angular.element(slideScroller).bind('scroll', recalcSliderDotHighlight);
		angular.element(slideScrollerContainer).bind('mouseenter', sliderMouseEnter);
		angular.element(slideScrollerContainer).bind('touchstart', sliderMouseEnter);
		angular.element(slideScroller).bind('mousedown', sliderMouseDown);
		angular.element(slideScroller).bind('mousemove', sliderMouseMove);
		angular.element(slideScroller).bind('mouseup', sliderMouseUp);
		angular.element(slideScrollerContainer).bind('mouseleave', sliderMouseLeave);
		angular.element(slideScrollerContainer).bind('touchend', sliderMouseLeave);
		angular.element(slideScrollerContainer).bind('touchcancel', sliderMouseLeave);
		
		recalcSliderSize($window.innerWidth);
	}
}());
