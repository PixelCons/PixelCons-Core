(function () {
	angular.module('App')
		.controller('PrintsDialogCtrl', PrintsDialogCtrl);

	PrintsDialogCtrl.$inject = ['$scope', '$route', '$mdMedia', '$mdDialog', '$mdToast', '$timeout', '$sce', 'coreContract', 'decoder'];
	function PrintsDialogCtrl($scope, $route, $mdMedia, $mdDialog, $mdToast, $timeout, $sce, coreContract, decoder) {
		var _this = this;
		_this.updatePreview = updatePreview;
		_this.expandPreview = expandPreview;
		_this.downloadImage = downloadImage;
		_this.closeDialog = closeDialog;

		// Watch for screen size changes
		_this.screenSize = {};
		$scope.$watch(function () { return $mdMedia('gt-md'); }, function (lg) { _this.screenSize['lg'] = lg; });
		$scope.$watch(function () { return $mdMedia('gt-xs') && !$mdMedia('gt-md'); }, function (md) { _this.screenSize['md'] = md; });
		$scope.$watch(function () { return $mdMedia('xs'); }, function (sm) { _this.screenSize['sm'] = sm; });

		// Start Image Generaion
		if(_this.pixelcon) {
			//plain generator
			_this.imageConfig = {
				backgroundColor: getDefaultBackgroundColor(_this.pixelcon.id),
				orientation: 'horizontal',
				ratio: 1.5,
				margin: 50,
				detailsSize: 'medium',
				includeQr: true,
				includeDetails: true,
				texture: 'none',
				intensity: 50
			}
			
			setPixelcon(_this.pixelcon);
		}
		
		// Updates the preview image
		var updatePreviewTimeount = null;
		function updatePreview() {
			if(!_this.imageConfig.margin) _this.imageConfig.margin = 0;
			
			_this.previewImage = null;
			if(updatePreviewTimeount) $timeout.cancel(updatePreviewTimeount);
			updatePreviewTimeount = $timeout(async function () {
				_this.previewImage = await decoder.generateDisplayImage(_this.pixelcon, _this.imageConfig.orientation, _this.imageConfig.ratio, _this.imageConfig.backgroundColor, 
					_this.imageConfig.margin, _this.imageConfig.includeQr, _this.imageConfig.includeDetails, _this.imageConfig.detailsSize, _this.imageConfig.texture, _this.imageConfig.intensity);
				$scope.$apply();
			}, 250);
		}
		
		// Expands the image preview
		function expandPreview() {
			if(_this.previewImage) {
				let d = document.createElement('div');
				d.className = 'imageExpandContainer';
				let d2 = document.createElement('div');
				d2.className = 'imageExpandImageDiv';
				d2.style = 'background-image: url(' + _this.previewImage + ');';
				let i1 = document.createElement('img');
				i1.className = 'imageExpandImage';
				i1.src = _this.previewImage;
				let d3 = document.createElement('div');
				d3.className = 'imageExpandClose';
				d3.onclick = function() {
					d.remove();
				}
		
				d.appendChild(d2);
				d.appendChild(d3);
				d2.appendChild(i1);
				document.body.appendChild(d);
			}
		}
		
		// Download image
		async function downloadImage(imageType) {
			let d = document.createElement('div');
			d.className = 'imageExpandContainer';
			let d2 = document.createElement('div');
			d2.className = 'imageExpandMessageDiv';
			d2.innerText = 'Generating Image...';
			d.appendChild(d2);
			document.body.appendChild(d);
			
			let downloadImage = await decoder.generateDisplayImage(_this.pixelcon, _this.imageConfig.orientation, _this.imageConfig.ratio, _this.imageConfig.backgroundColor, 
					_this.imageConfig.margin, _this.imageConfig.includeQr, _this.imageConfig.includeDetails, _this.imageConfig.detailsSize, _this.imageConfig.texture, _this.imageConfig.intensity, true, imageType);
			let a = document.createElement('a');
			a.href = downloadImage;
			a.download = "pixelcon" + _this.pixelcon.index + "_print." + imageType;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			
			d.remove();
		}
		
		// Fills in additional details about a pixelcon
		async function setPixelcon(pixelcon) {
			if(!pixelcon.dateMillis) {
				pixelcon = await coreContract.fetchPixelcon(pixelcon.id);
			}
			_this.pixelcon = pixelcon;
			updatePreview();
		}
		
		// Gets default background colorDepth
		function getDefaultBackgroundColor(id) {
			let grayBackground = JSON.parse('["0x1555555111ccc1c11011cc111001110117700771100000011ff77ff151ffff15","0x54444445444444f44477fff40000000007700770000ff000fff77fff5ffffff5","0xde5555edddeeeeddd1dddd1d1f1111f117b11b71111111111ff88ff155ffff55","0x53b33b353b3bb3b3b773377b7377773770377307777777777800008757888875","0x5000775700557c7505ffccc50fffc00cf0ff0aacffff444cfff7794c5fff44c5","0x5e855e85588e788502288220088888800a2882a0028888200880088000000000","0x1555555105aaaa50c0aaa90cc10a901c070a9071100a900114f77f415ffffff5","0x500000050000000003030030300b300337bbbb733bb77bb33bb00bb353bbbb35","0x500000050701107077100177756116577b3113b7777117770710017050000005","0x5ccaacc5a1a99a1aaa9999aa900000099710017990dddd099d7777d95dddddd5","0x5777777577777777700770077777777770077007e777777e7707707757700775","0x50000005711111177011110777100177777007771660066110077001510ee015","0x5000000500011000044004400544444068544404054444400400004004044040","0x58eeee858888e788008888000118811007000070000000000058850058888885","0x588888858828828889a22a78899aa97827799772299aaa7299a55a7959aaaa95","0x5cccccc57cc77cc771711717117c17111f1cc1f111cffc1114f77f415ffffff5","0x5333333533bbbb333b0053333066760335576553306776033065560353333335","0x5cccccc5c111111c10000001aaaaaaaaa888888a0111111014f77f415ffffff5","0x5e8888e5e828828e8dd22dd88d1dd1d88d7117d88dffffd882dffd2858dffd85","0x5999797599999747499994944444444407000070494994944990099459944995","0x5888888588888888a888888aaf4884fa8ff88ff8888ff8888ff77ff858ffff85","0x588888e588eaa88e82e1188e822cc28e81acca1881cccc1881c88c18821cc128","0x533bbb353033b30302033020088ee88000a88a0002288220028ee82052888825","0x5eeeeee588888888802882082702207227700772277007728002200858888885","0x500000050011010001f0ff100fff0ff0fcffffcffffffffffff77fff5ffffff5","0xd555555dd521125dd122221dd121121dd71ee17d211ff11221f77f1252ffff25","0x5770077570000007044774400004400007744770044444400448844070444407","0x800000080000000077f0ff777fff0ff7f0ffff0ffff00fffff0440ff8f0ff0f8","0x51111115100aa0011aa88aa11ffffff11cffffc10ffffff00ff88ff010ffff01","0x5855558588888888882222888211112887211278822888888ff77ff85ffffff5","0x5544445554477945944444949224422997f44f799f4444f9944ff44944422444","0x55cccc555c1111c5c1faaf1ccffffffcc7ffff7ccffaaffccfaffafc5caaaac5","0x5444444544444444404ccc100f4ffff0080ff0811ffffff116f77f61516ff615","0x785555075588005558880005877777708000000080c00c005777777555777755","0x511151111cc11c111fffff1f27eeee722eeffee2affffffa9ff88ff95ffffff5","0x5e8888e5e88eee8ee888888ee2eeee2e0728827020822802528aa82552e88e25","0x5cccccc5c666666cc777777ccc6776ccca6776acc677776cc676676c56777765","0x54444445444444444f44f4f4cccccccc77c11c77cccffcccfff77fff5ffffff5","0x54444445444444444f44fff4333ff3330703307000333300fff77fff5ffffff5","0x5aaaaa5aaa99a99a8088a8088088880887088078808888088088880858888885","0x544444454444444470ff44777f0ffff7fcf00000fffff00f6ff77ff656ffff65","0x5333333533bbbbb33333b3b3a033330a07000070a00ff00aafa44afa5faaaaf5","0x544444454444444477f44f777ffffff7f0ffff0ffffffffffff77fff5ffffff5","0x5011110501a11a10001aa100880aa088870880780866668084f77f485ffffff5","0x7755557757666675776666776ffaaff66cffffc66ffffff6a6f77f6aa6ffff6a","0x5bbbbbb5bbaaaabbb3a33a3b30b33b0b3a0bb0a33dddddd33ddbbdd353bbbb35","0x8544445888444488888488888f7477f884f77f488ffffff848f88f8448ffff84","0x50000005333333334ffffff4ddddddddd711117d11ffff11fff77fff5ffffff5","0x5888eee52888887e288888820444404007fff0700ffff0f00ff88ff005ffff50","0x5ffffff5ffffffff000ff000f40ff04ff7ffff7ffffffffffff77fff5ffffff5","0x5777774574477774400407074ff4f7f440ffff044ffffff44ff88ff445ffff54","0x52eeee25222ee222b232232bba0330abbaa00aabb3b33b3b53b77b35553bb355","0x5aaaaaa5aaaaaaaaa9a99a9aa4a4444a07f44f7000ffff004f7777f4a47ff74a","0x5055550501011010001001000111111007111170000000000000000050000005","0x5a5aaa5aa989a8aaa89a9a8aa888988a0a8888a0008888000887788050888805","0x000000000500005077ffff77700ff007f4ffff4ffff00ffffff77fff5ffffff5","0x5777777570600607700660070006600060000006670770766007700656077065","0x5888888588882285001cc00804f11f4117ffff711ffffff11ffeeff15cffffc5","0x5000000501111110044aa440776aa67774466447777447777744447757444475","0x5777777577ff667760ffff066f0000f667f00f76600ff0066ffeeff665ffff56","0x0000000006500560077557700077770008077080006776000600006056066065","0x55567555566676656657756665555556650ff05665ffff5666f77f6666666666","0x522222252222222220000002200ee0022eeeeee220e00e022007700222222222","0x5000000500077000000770000f0000f007f00f70000ff00000f77f0050ffff05","0x56666665677777766555575666555566655555566655556626666662e266662e","0x50000500000000000111111011cccc111a0cc0a1c001100c5c0770c55cc11cc5","0x57222275276006722076670220077002222442222ffffff22ff77ff252ffff25","0x5bbbbbb5bb0000bbb003300bb7f00f7bb0ffff0bbffffffbbff33ffbb5ffff5b","0x59a90a050a00009000000009000000000a0000a000000000000aa00090000009","0x59999aa59999999a94449449888898ee8ff88ffe888ff88e28f77f8218ffff81","0x8e5555e88ea99ae888a99a88988aa8899a8888a9898888985887788588ffff88","0x5553b5555bb3bbb5bbb3bbbb00bbbb00370330733bbbbbb33bb77bb353beeb35","0x5178e7151878e78111888e1188888888177887781144441118ffff8158788785","0x1555555111555511c111111cc11cc11c1a0cc0a110cccc011cc77cc151cccc15","0x5444444544444444494949944099490443099034499999944994499445999954","0xa55aa55aa3aaaa3a9aaaaaa9599aa9955ffaaff59aaaaaa9aaf77faaa3ffff3a","0x5dddddd5dddddddddffddffd000ff00007700770400ff004fff77fff5ffffff5","0x7765767756666676111111111111077717010767100107771111077750000775","0x5aaaaaa5aaaaaaaaa09aa90a009aa900070aa070a0aaaa0aaffffffa5ffffff5","0x50000005001111000ffffff088888888888ff888fffffffffff77fff5ffffff5","0x5667766567777776786776877887788776855867656666566050050656000065","0x50000005011111009a9aa9a999a99a9907444470044444400440044004444440","0x5c1771c5c116711c671671766716617618866881c166661cc111111c61cccc16","0x5558e5555ff8eff58ff88ff8888ff88e2f8888fe288ff88e28f77f8852ffff85","0x5888888588844888888ff4888989998880b99b08880990888998899885999958","0x5000000500000000666777660446744040444404444444444447744454444445","0x577777757777777777777777767777677a6776a7777777777ffffff75ffffff5","0x00000000050000500f7777f000077000f0ffff0ffff00fffff0770ff5f0000f5","0x5bbbbbb5bbbbbbbb33bbbb33003bb300380330833b0000b333b77b3353bbbb35","0x5aaaaaa5aa9aa9aaaaa99aaaaffaaffaa0ffff0a9af44fa99a4774a99a4444a9","0x5000000500000000ffff40ff7777777770077007777ff777ffffffff5ffffff5","0x5bb33bb5bb3333bb5bb33bb5370bb0733aa00aa3b44ff44bb4f77f4b533bb335","0x5cccccc5cc7777cccccc7cccc1cccc1c177cc77111cccc111cc77cc151cccc15","0x5aaaaaa5aaaaaaaaa111a11aa1ccac1aa7f11f7aa111111aaff88ffaa5ffff5a","0x5cccccc5ccccccccc01cc10c1a711a711aa11aa1111ff1111ff77ff15ffffff5","0x5000000501111110066666600766667085766758655665566577775606777760","0x0111111000011000066116606778877608777780007777006775577656777765","0x588aa8e5888aa88e88aaaa8e002aa80007788770808888088882288858888885","0x5000000507000070700000077707707778777787088778800077770050777705","0x555aa5555aaa7aa5aaaa7aa999a77a9997aa7a7996aa7a699aaa7aa95aaaaaa5"]');
			if(grayBackground.indexOf(id) > -1) return '#5F574F';
			
			return '#000000';
		}

		// Closes the dialog window
		function closeDialog() {
			$mdDialog.cancel();
		}
		
		// Close the dialog if page/account changes
		$scope.$on("$locationChangeSuccess", $mdDialog.cancel);
	}
}());
