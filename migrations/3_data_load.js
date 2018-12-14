var PixelCons = artifacts.require("./PixelCons.sol");
var PixelConMarket = artifacts.require("./PixelConMarket.sol");

// Settings
var enabled = false;
	
	
module.exports = function(deployer) {
	var pixelconsContract;
	var marketContract;
	var migratorAddress = web3.eth.accounts[0];
	var primaryAddress = '0xfE643f001caC62a5f513Af517765146d331261C8';
	var secondaryAddress = '0x9f2fedFfF291314E5a86661e5ED5E6f12e36dd37';
	
	// Example Pixelcons
	var pixelconSet1 = [
		{id:'0x9a999999990990999909909999999999907777099400004999477499999aa999', name:'Smile'},
		{id:'0x9a9999999949949994944949ee9999eee499994e99400499999aa99999999999', name:'Blush'},
		{id:'0x9a9999999999909990049099999999999499994999400499999aa99999999999', name:'Wink'},
		{id:'0x9a99999999499499949449499999999991777719901dd10994777749999aa999', name:'Laugh'},
		{id:'0x9a9999999949949c9494494c99999999907777099022220999088099999aa999', name:'Grin'},
		{id:'0x9a99944999994999944490999909909999999999999900999999aa9999999999', name:'Sceptic'},
		{id:'0x9a99999999099099990990999999999999477499947447499449944999999999', name:'Scared'},
		{id:'0x9a9999999999999997099709977997799999999999422499999aa99999999999', name:'EyeRoll'},
		{id:'0x9a9999999999999999099099990990999999999999422499949aa94999999999', name:'Frown'},
		{id:'0x9a99999999999099900490999999999994999949994224999998899999988999', name:'Joke'},
		{id:'0x9a99999994099049990990999999999992eeee29992882999997e99999999999', name:'LSmile'},
		{id:'0x9a9999999949949994944949c999999c927777299428824999477499999aa999', name:'Laugh'},
		{id:'0x9a99999999499499949449499999999994999949994224999998899999988999', name:'Joke'},
		{id:'0x9a9999999909909999099099999999999999a499999909999999a49999999999', name:'Kiss'},
		{id:'0x9a9999999949949994944949ee9999eeee99a4ee999909999999a49999999999', name:'Kiss'},
		{id:'0x9a99999999099099990990999c9999999c944999994aa4999999999999999999', name:'Sad'},
		{id:'0x9a499499949999499909909999099099999999999990099999900999999aa999', name:'Shocked'},
		{id:'0x9a9999999449944999999999900990099999999999900999999009999999c999', name:'Drool'},
		{id:'0x9a9999999449944999044099990990999999999999422499949aa94999999999', name:'Upset'},
		{id:'0x8e8888888228822888022088880880888888888888e77e8882777728888ee888', name:'Angry'},
		{id:'0x9a4994999499994999999999920990299cc99cc99cc77cc99cc00cc99cc9acc9', name:'Cry'},
		{id:'0xcc1cc1ccc1cccc1cc77cc77c97099079977997799990099999900999999aa999', name:'Fear'},
		{id:'0xcc1cc1ccc1cccc1ccc0cc0cc990990999c9999999c99999999900999999aa999', name:'Anxious'},
		{id:'0x3b1331333133331333033033330330333331333333b303333333133333333333', name:'Nausea'},
		{id:'0x9a99999999999999944994499999999994000049903bb30994bbbb4999bbbb99', name:'Vomit'},
		{id:'0x9a99999999999999977997099079977999999999990099099099009999999999', name:'Crazy'},
		{id:'0x0d0000d00dd00de00dddddd00d0d0dd0117e71100d777dd0001edd1001ddddd1', name:'Cat'},
		{id:'0x00999900099999909949090499499f229909ffff0044ffff049940e0499ff400', name:'Dog'},
		{id:'0x00028000028880000027770004970700004977700002877000028777000d7777', name:'Chicken'},
		{id:'0x11111110111fffe000010010fdf00e00ffffff200effeee00e2fffe00ee22000', name:'CoolDude'},
		{id:'0x03bbbb303b7bbbb3b3bbbb3bb70bb70bb30bb03b0bbbbbb000b33b00000bb000', name:'Alien'},
		{id:'0x0dccccd0dc7ccccdcdccccdcc70cc70ccd0cc0dc0cccccc000cddc00000cc000', name:'Alien'},
		{id:'0x00088270008822000777666006eeeed0f72fe26ef7f76e6e067e26d000676d00', name:'Santa'},
		{id:'0xff4444fff467764f46b33b64673703766730037647b33b7efe7777efffffffff', name:'Eye'},
		{id:'0xff4444fff467764f46dccd6467c70c7667c00c7647dccd7efe7777efffffffff', name:'Eye'},
		{id:'0x00b3b300000b300000ee28000e8e88800ee88280028288200028820000022000', name:'Raspbry'},
		{id:'0x00000000070000700cd66dc006d77d600d622dd001688d1000d6d10000000000', name:'SpsceShp'},
		{id:'0x001282100128a811128a988228aaaaa88aaaaa822889a821118a821001282100', name:'Lightng'},
		{id:'0x11112121212112921191112129a9211111911212112129212111121111121112', name:'Stars'},
		{id:'0x00110000019a100019a100001aa100101aa911a119aaaa91019aa91000111100', name:'Moon'},
		{id:'0x2119111219299291129aa92119aaaa9999aaaa91129aa9211929929121119112', name:'Sun'},
		{id:'0x000008880008899900899aaa089aabbb089abccc89abccdd89abcd0089abcd00', name:'Rainbow'},
		{id:'0x0008800000878800000880000071160007100160070000600070060000066000', name:'Ring'},
		{id:'0x000cc00000c7cc00000cc0000071160007100160070000600070060000066000', name:'Ring'},
		{id:'0x00000000000000000a0aa0900cabba80099999400aaaaa900000000000000000', name:'Crown'},
		{id:'0x0000000000e777e00ee777ee088eee88008eee800008e8000000e00000000000', name:'Jewel'},
		{id:'0x0000000000c777c00cc777cc066ccc66006ccc600006c6000000c00000000000', name:'Jewel'},
		{id:'0x0000000000a777a00aa777aa099aaa99009aaa900009a9000000a00000000000', name:'Jewel'},
		{id:'0x0000000000b777b00bb777bb033bbb33003bbb300003b3000000b00000000000', name:'Jewel'},
		{id:'0x00000000077777a00a100a900a400a900a747a900aa40a900aa77a9000000000', name:'Locked'},
		{id:'0x0128218101298221122898101828982112899921289aa98229aaaa9212888821', name:'Fire'},
		{id:'0x0d777d00677777607767767d767007076d6007070677707d000d776000006770', name:'Skull'},
		{id:'0x0000000000770000066700000776d990000d6999000444990002444400002442', name:'Meat'},
		{id:'0x000000000e808e00e7e8e8e08e8888e008888e000088e000000e000000000000', name:'Heart'},
		{id:'0x000000000e807600e7e767608e87776008877600008760000006000000000000', name:'HfHeart'},
		{id:'0x0000000006707600666767607677776007777600007760000006000000000000', name:'EmHeart'},
		{id:'0x7600000067600000067600400067d090000d7d900000d9200049928200000028', name:'RSword'},
		{id:'0x7600000067600000067600400067d090000d7d900000d9d000499dcd000000dc', name:'BSword'},
		{id:'0x7600000067600000067600400067d090000d7d900000d940004994a40000004a', name:'YSword'},
		{id:'0x7600000067600000067600400067d090000d7d900000d930004993b30000003b', name:'GSword'},
		{id:'0x0188881018e77e818e7887e887877878878778788e7887e818e77e8101888810', name:'Target'},
		{id:'0x0000000000aaa900aa99949aa0aaa90a90aaa909099aa49000094000009aa400', name:'Trophy'},
		{id:'0x0000000000822200082002800800008002800820002aa200000aa00000000000', name:'Medal'},
		{id:'0x0000000000c111000c1001c00c0000c001c00c10001aa100000aa00000000000', name:'Medal'},
		{id:'0x000001dd0992010d42a90d000079000000a49a790074444000a94a90004aa940', name:'Sax'},
		{id:'0x9444444094444440a9999990412121206161616070707070767676706dddddd0', name:'Piano'},
		{id:'0x0000000000ddd6000d100d700d100d60811108e8810108822111022200000000', name:'Headphns'},
		{id:'0x0000000000ddd6000d100d700d100d60b1110b7bb1010bb33111033300000000', name:'Headphns'},
		{id:'0x00000000000000000866a66d01d76d10047dd642046dc6420446644200000000', name:'Camera'},
		{id:'0x00d000d0000d0d00dddddd99d7600844d6000c44d0006d44d0067d44dddddd44', name:'TV'},
		{id:'0x0777776007bbb7d0073337d007bbb7d0077777d0078787d0077777d0067776d0', name:'GameBoy'},
		{id:'0x1ac128829cc967761ca128829cc1677628822882677667762882288267766776', name:'Flag'},
		{id:'0x00001000000001000000110000066600d6722270d0d777601ddd6660001d6610', name:'Coffee'},
		{id:'0x000000000777600007776dd0099940600aaa90d00aaa9d1009aa400000000000', name:'Beer'},
		{id:'0x00000000004994000097a900009aa9000099990009a7aa900009400000000000', name:'Alarm'},
		{id:'0x000000000cc7c7c00cc677c00cccccc00c7777c00c7777c00d6666d000000000', name:'Floppy'},
		{id:'0x0000000008878780088677800888888008777780087777800266662000000000', name:'Floppy'},
		{id:'0x00f6aa000fec9970feec977777e0077777700e777779ceef0799cef000aa6f00', name:'CD'},
		{id:'0x6000000dd70000dd06700dd00067dd0000067000022d68802020080822100288', name:'Scissors'},
		{id:'0x6000000dd70000dd06700dd00067dd0000067000011d6cc010100c0c111006cc', name:'Scissors'},
		{id:'0x00ee00000efa9000eea7ee0089988ee0142888ef112288f701122fff00114442', name:'RPencil'},
		{id:'0x00ee00000efa9000eea7dd00299ccdd014dcccdf11ddccf7011ddfff00114442', name:'BPencil'},
		{id:'0x00ee00000efa4000eea79900244aa990149aaa9f1199aaf701199fff00114442', name:'YPencil'},
		{id:'0x00ee00000efa9000eea73300299bb330143bbb3f1133bbf701133fff00114442', name:'GPencil'},
		{id:'0x776ccccc77888ecc788888ecc8777826c8888827cc8882ccbbbd1bbb3336d333', name:'Sign'},
		{id:'0xccccccc6ccbbb3676b8bb31773bb3816763311ccccc42cccb8b9413b33333333', name:'AplTree'},
		{id:'0xc7cccccccccb3ccccb3b3ccccb3b1b3cc3bb1b3ccc3bb3ccaaab324999999999', name:'Cactus'},
		{id:'0xccc7cccccc8822ccc888222c88882222cd7d616cc777666cb7d76663bbbbbbbb', name:'House'},
		{id:'0xccccccccccc33cccca913ccccc33ccccc447cc6cc47776cccc67777c11111111', name:'Duck'},
		{id:'0xcc1110ccc111110ccc070dccc9976dcccc8822cc46778644c71786dc677766d6', name:'SnowMan'},
		{id:'0xeeeeeeee9aaaaaaed9d9d9cec0c0c0ce8aaaa9aa9009900a10011001dddddddd', name:'Bus'},
		{id:'0xeeeeeeeeee3333eee36636eee3cc3cee8333333a3003300310011001dddddddd', name:'Car'},
		{id:'0x9aa9e888e99eeeeeeeee88888887688eee7766eee333111e33333111bbbbb333', name:'Mountain'},
		{id:'0x88888888899944488cc7112889994448ecc7112ef999444fd9c94141dddddddd', name:'Building'},
		{id:'0xccc77cccccc66cccc76a976cc769476cccc773ccccc66c3ccccccc3c44444434', name:'Flower'},
		{id:'0xcccccccccc8722ccc7e8826cc888722cccc94ccccccf9ccc3bbb333313bbbb31', name:'Mushroom'},
		{id:'0xccccccccc44cc99ccffc9ff9ddddeeeefdd99eeffd9ff9efb1f88feb31188223', name:'Family'},
		{id:'0xccccccccc44cc99ccffc9ff9ddddeeeefdd44eeffddffeefb1fccfeb311cc223', name:'Family'},
		{id:'0x3333bbb3333bb89b33101a8b316101bb301000b3310001334410144444444444', name:'Bomb'},
		{id:'0x7e7d644447e7644444707e44447777441dd11000400000044110000421d10002', name:'Rabbit'}
	];
		
	// Load pixelcon example data
	function loadPixelconData(callback) {
		var count = pixelconSet1.length;
		for(var i=0; i<pixelconSet1.length; i++) {
			var toOwn = migratorAddress;			
			pixelconsContract.create(toOwn, pixelconSet1[i].id, web3.fromUtf8(pixelconSet1[i].name), {from: migratorAddress, gas: 3000000}).then(function() {
				if(--count == 0 && callback) callback();
			});
		}		
	}
	
	// Load pixelcon collection example data
	function loadPixelconCollectionData(callback) {
		//pixelconsContract.createCollection(web3.fromUtf8('Grp1'), [0,1,2,3], {from: migratorAddress, gas: 3000000});
		//pixelconsContract.createCollection(web3.fromUtf8('Grp2'), [8,9], {from: migratorAddress, gas: 3000000});
		var count = 3;
		pixelconsContract.createCollection([0,1,2,3,4,5,6,7,8,9,10,11,12], web3.fromUtf8('Grp1'), {from: migratorAddress, gas: 3000000}).then(function() {
			if(--count == 0 && callback) callback();
		});
		pixelconsContract.createCollection([24,25,26,27,28,29], web3.fromUtf8('Grp2'), {from: migratorAddress, gas: 3000000}).then(function() {
			if(--count == 0 && callback) callback();
		});
		pixelconsContract.createCollection([30,31,32,33,34,35,36,37,38,39], web3.fromUtf8('Grp3'), {from: migratorAddress, gas: 3000000}).then(function() {
			if(--count == 0 && callback) callback();
		});
	}
	
	// Load pixelcon listings data
	function loadPixelconMarketData() {
		console.log('Start Market Listings');
		marketContract.adminChange(primaryAddress, {from: migratorAddress, gas: 3000000});
		for(var i=0; i<10; i++) {
			var days = 10*24*60*60;
			var price = web3.toHex(web3.toWei(1.0 + (i/10) + (i/200)));
			var bytes = '0x' + hexToBytes(price) + hexToBytes(price) + hexToBytes(web3.toHex(days));
			if(i==1 || i==2 || i==6 || i==7 || i==9) {
				pixelconsContract.contract.safeTransferFrom['address,address,uint256,bytes'](migratorAddress, marketContract.address, pixelconSet1[i].id, bytes, {from: migratorAddress, gas: 3000000});
			}
		}
	}
	
	// Get contracts and load data
	if(enabled) {
		PixelCons.deployed().then(function(contract) {
			pixelconsContract = contract;
			PixelConMarket.deployed().then(function(contract) {
				marketContract = contract;
			
				//pixelcons
				loadPixelconData(function(){
					
					//groups
					loadPixelconCollectionData(function(){
						
						//listings
						loadPixelconMarketData();
					});
				});
			});
		});
	}
	
};

function hexToBytes(hex) {
	hex = hex.substring(2,hex.length);
	if(hex.length%2 == 1) hex = '0' + hex;
	
	var bytes = '';
	for(var i=0; i<32-(hex.length/2); i++) bytes += '00';
	for(var i=0; i<hex.length; i+=2) bytes += hex[i]+hex[i+1];
	return bytes;
}
