var PixelCons = artifacts.require("./PixelCons.sol");
var PixelConMarket = artifacts.require("./PixelConMarket.sol");

// Settings
var dataloadCount = 10; //(min 10)

contract('PixelConMarket', function(accounts) {
	var createdTokens = [];
	var createdCollections = [];
	var devFee = 2500;
	var priceUpdateInterval = 1;
	var startDateRoundValue = 60*60;
	var durationRoundValue = 60*60;
	var minDuration = 2*24*60*60; //2 days
	var maxDuration = 11*24*60*60; //11 days
	var minPrice = 123000000000000000; //0.123 eth
	var maxPrice = 15000000000000000000; //15 eth
	var listing1 = [233000000000000000, 133000000000000000, 2*24*60*60];
	var listing2 = [423000000000000000, 323000000000000000, 4*24*60*60];
	var listing3 = [2123000000000000000, 1123000000000000000, 5.5*24*60*60];
	var listing4 = [3323000000000000000, 2323000000000000000, 7*24*60*60];
	var listing5 = [6673000000000000000, 5673000000000000000, 11*24*60*60];
	var migratorAddress = web3.eth.accounts[0];
	var testUsers = [web3.eth.accounts[1],web3.eth.accounts[2],web3.eth.accounts[3]];
	var randomNames = ['Carmelita','Mciver','Alexandria','Cotta','Fawn','Erne','Pamela','Vansant','Annemarie','Durrell','Paulette','Casarez','Alphonse','Foret','Leila','Lindner','Claudette','Yamanaka','Meggan','Jenkinson',
		'Franklin','Cropp','Eleanore','Bach','Shelton','Reineck','Brianne','Murrieta','Leslie','Pintor','Roselee','Barrio','Altagracia','Alaimo','Britta','Yeaton','Georgianna','Colley','Chana','Tiemann','Tamekia','Wortman',
		'Dreama','Luhman','Kimberlee','Gagliano','Bob','Kostelnik','Carrol','Stromain','Arlyne','Hoops','Lavada','Puryear','Lasandra','Pinkham','Cornelia','Lipps','Summer','Stennett','Jerome','Bucholtz','Belen','Winningham',
		'Stephaine','Krause','Joel','Slaugh','Ricardo','Hassel','Mirta','Zynda','Emmitt','Bahr','Vesta','Mazzola','Neda','Moscoso','Elinor','Wageman','Darby','Heiner','Romana','Sparacino','Kathleen','Volkert','Betty','Mccawley',
		'Ellen','Lovvorn','Karyl','Hakes','Pa','Perras','Sheri','Macdonald','Pam','Pitcock','Cecille','Coderre'];
			
	
	//Check Create Tokens
	it("should create token data without error", function() {
		return new Promise(function(resolve, reject) {
			var pixelconsContract;
			PixelCons.deployed().then(function(instance) {
				pixelconsContract = instance;
				var count = dataloadCount;
				function finish() { if(--count == 0) resolve(); }
				
				for(var i=0; i<dataloadCount; i++) {
					var owner = migratorAddress;
					var creator = (i==2)?testUsers[1]:migratorAddress;
					var name = web3.fromUtf8((i==0)?'':randomNames[Math.floor(Math.random()*randomNames.length)].substr(0,8));
					var id = web3.sha3('Random Token ' + Math.random()*100);
					createdTokens.push({
						id: id,
						name: name,
						owner: owner,
						creator: creator
					});
					pixelconsContract.create(owner, id, name, {from:creator, value:1000000000000000, gas:3000000}).then(finish, function(reason) {
						assert.isTrue(false, "failed to create token: " + reason);
					});
				}
			});
		});
	});
	
	
	// Check Create Collections
	it("should create collection data without error", function() {
		var pixelconsContract;
		var indexes = [8,9];
		for(var i=0; i<20 && i+10<dataloadCount; i++) indexes.push(i+10);
		var name = web3.fromUtf8(randomNames[Math.floor(Math.random()*randomNames.length)].substr(0,8));
		createdCollections.push({});
		createdCollections.push({ indexes:[6,4,3], name:0 });
		createdCollections.push({ indexes:indexes, name:name });
			
		return PixelCons.deployed().then(function(instance) {
			pixelconsContract = instance;
			return pixelconsContract.createCollection(createdCollections[1].indexes, createdCollections[1].name, {from: migratorAddress, gas: 3000000});
		}).then(function() {
			return pixelconsContract.createCollection(createdCollections[2].indexes, createdCollections[2].name, {from: migratorAddress, gas: 3000000});
		}).then(function() { }, function(reason) {
			assert.isTrue(false, "failed to create collections: " + reason);
		});
	});
	
	
	// Check Admin Functions
	it("should perform admin functions without error", function() {
		var marketContract;
		return PixelConMarket.deployed().then(function(instance) {
			marketContract = instance;
			return marketContract.adminChange(testUsers[0], {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to change admin: " + reason);
			});
		}).then(function() {
			return marketContract.adminSetDetails(devFee, priceUpdateInterval, startDateRoundValue, durationRoundValue, maxDuration, minDuration, maxPrice, minPrice, 
					{from:testUsers[0], gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to set market details: " + reason);
			});
		}).then(function() {
			//verify changes
			var marketData;
			return marketContract.getMarketDetails.call().then(function(data) {
				marketData = data;
			
				assert.equal(devFee, marketData[0].toNumber(), "dev fee was not set");
				assert.equal(priceUpdateInterval, marketData[1].toNumber(), "price update interval was not set");
				assert.equal(startDateRoundValue, marketData[2].toNumber(), "start date round value was not set");
				assert.equal(durationRoundValue, marketData[3].toNumber(), "duration round value was not set");
				assert.equal(maxDuration, marketData[4].toNumber(), "max duration was not set");
				assert.equal(minDuration, marketData[5].toNumber(), "min duration was not set");
				assert.equal(maxPrice, marketData[6].toNumber(), "max price was not set");
				assert.equal(minPrice, marketData[7].toNumber(), "min price was not set");
			}, function(reason) {
				assert.isTrue(false, "failed to get data: " + reason);
			});
		}).then(function() {
			//test cases that should fail
			return new Promise(function(resolve, reject) {
				var count = 5;
				function finish() { if(--count == 0) resolve(); }
				
				marketContract.adminChange(migratorAddress, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to change admin without permissions");
					finish();
				}, finish);
				marketContract.adminChange(0, {from:testUsers[0], gas:3000000}).then(function() {
					assert.isTrue(false, "was able to change admin to an invalid address");
					finish();
				}, finish);
				marketContract.adminSetLock(true, true, {from:testUsers[1], gas:3000000}).then(function() {
					assert.isTrue(false, "was able to lock market without permissions");
					finish();
				}, finish);
				marketContract.adminWithdraw(migratorAddress, {from:testUsers[2], gas:3000000}).then(function() {
					assert.isTrue(false, "was able to withdraw without permissions");
					finish();
				}, finish);
				marketContract.adminWithdraw(0, {from:testUsers[0], gas:3000000}).then(function() {
					assert.isTrue(false, "was able to withdraw to an invalid address");
					finish();
				}, finish);
			});
		});
	});
	
	
	// Check Market Transfer
	it("should create listings without error", function() {
		var pixelconsContract;
		var marketContract;
		
		return PixelCons.deployed().then(function(instance) {
			pixelconsContract = instance;
			return PixelConMarket.deployed();
		}).then(function(instance) {
			marketContract = instance;
			
			var bytes = generateTransferBytesData(listing1[0], listing1[1], listing1[2]);
			return pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[0].id, bytes, {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to list token 1: " + reason);
			});
		}).then(function() {
			var bytes = generateTransferBytesData(listing2[0], listing2[1], listing2[2]);
			return pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[2].id, bytes, {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to list token 3: " + reason);
			});
		}).then(function() {
			var bytes = generateTransferBytesData(listing3[0], listing3[1], listing3[2]);
			return pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[3].id, bytes, {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to list token 4: " + reason);
			});
		}).then(function() {
			var bytes = generateTransferBytesData(listing4[0], listing4[1], listing4[2]);
			return pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[6].id, bytes, {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to list token 7: " + reason);
			});
		}).then(function() {
			var bytes = generateTransferBytesData(listing5[0], listing5[1], listing5[2]);
			return pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[7].id, bytes, {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to list token 8: " + reason);
			});
		}).then(function() {
			//verify changes
			var shouldExistCheck;
			var shouldNotExistCheck;
			var totalListings;
			var token4ListingDetails;
			
			return marketContract.exists.call(2).then(function(data) {
				shouldExistCheck = data;
				return marketContract.exists.call(9);
			}).then(function(data) {
				shouldNotExistCheck = data;
				return marketContract.totalListings.call();
			}).then(function(data) {
				totalListings = data;
				return marketContract.getListing.call(3);
			}).then(function(data) {
				token4ListingDetails = data;
			
				assert.equal(true, shouldExistCheck, "token3 listing was said to not exist");
				assert.equal(false, shouldNotExistCheck, "token10 listing was flagged as existing");
				assert.equal(5, totalListings, "total number of listings is incorrect");
				assert.equal(migratorAddress, token4ListingDetails[0], "market listing seller was incorrect");
				assert.equal(listing3[0], token4ListingDetails[1], "market listing start price was incorrect");
				assert.equal(listing3[1], token4ListingDetails[2], "market listing end price was incorrect");
				assert.equal(listing3[2], token4ListingDetails[5], "market listing duration was incorrect");
			}, function(reason) {
				assert.isTrue(false, "failed to get data: " + reason);
			});
		}).then(function() {
			//test cases that should fail
			return new Promise(function(resolve, reject) {
				var count = 9;
				function finish() { if(--count == 0) resolve(); }
				
				var bytes = generateTransferBytesData(233000000000000000, 133000000000000000, minDuration-(durationRoundValue+10));
				pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[1].id, bytes, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to make listing with too small duration");
					finish();
				}, finish);
				var bytes = generateTransferBytesData(233000000000000000, 133000000000000000, maxDuration+(durationRoundValue+10));
				pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[1].id, bytes, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to make listing with too large duration");
					finish();
				}, finish);
				var bytes = generateTransferBytesData(minPrice-10, 133000000000000000, 2*24*60*60);
				pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[4].id, bytes, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to make listing with too small start price");
					finish();
				}, finish);
				var bytes = generateTransferBytesData(maxPrice+1000000000, 133000000000000000, 2*24*60*60);
				pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[4].id, bytes, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to make listing with too large start price");
					finish();
				}, finish);
				var bytes = generateTransferBytesData(233000000000000000, minPrice-10, 2*24*60*60);
				pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[5].id, bytes, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to make listing with too small end price");
					finish();
				}, finish);
				var bytes = generateTransferBytesData(233000000000000000, maxPrice+1000000000, 2*24*60*60);
				pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[5].id, bytes, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to make listing with too large end price");
					finish();
				}, finish);
				var bytes = '0x000000000000000000000000000000000000000000000000033bc843f8aa80';
				pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[8].id, bytes, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to make listing bad bytes");
					finish();
				}, finish);
				marketContract.adminClose(testUsers[0], {from:testUsers[0], gas:3000000}).then(function() {
					assert.isTrue(false, "was able to close market with open listings");
					finish();
				}, finish);
				marketContract.getListing(createdTokens[4].id, {from:testUsers[0], gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get listing with index not listed");
					finish();
				}, finish);
			});
		});
	});
	
	
	// Check Remove/Purchase
	it("should purchase/remove without error", function() {
		var pixelconsContract;
		var marketContract;
		
		return PixelCons.deployed().then(function(instance) {
			pixelconsContract = instance;
			return PixelConMarket.deployed();
		}).then(function(instance) {
			marketContract = instance;
			
			return marketContract.purchase(testUsers[0], 0, {from:testUsers[0], value:listing1[0]+listing1[0]*(devFee/100000), gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to purchase token 1: " + reason);
			});
		}).then(function() {
			return marketContract.purchase(testUsers[0], 2, {from:testUsers[2], value:listing2[0]+listing2[0]*(devFee/100000), gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to purchase token 3: " + reason);
			});
		}).then(function() {
			return marketContract.removeListing(7, {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to remove token 8 listing: " + reason);
			});
		}).then(function() {
			//verify changes
			var shouldNotExistCheck;
			var totalListings;
			var testUser1Balance;
			var migratorBalance;
			
			return marketContract.exists.call(2).then(function(data) {
				shouldNotExistCheck = data;
				return marketContract.totalListings.call();
			}).then(function(data) {
				totalListings = data;
				return pixelconsContract.balanceOf.call(testUsers[0]);
			}).then(function(data) {
				testUser1Balance = data;
				return pixelconsContract.balanceOf.call(migratorAddress);
			}).then(function(data) {
				migratorBalance = data;
			
				assert.equal(false, shouldNotExistCheck, "token3 listing was flagged as existing");
				assert.equal(2, totalListings.toNumber(), "total number of listings is incorrect");
				assert.equal(2, testUser1Balance.toNumber(), "testUser1 balance was incorrect");
				assert.equal(createdTokens.length-4, migratorBalance.toNumber(), "migrator balance was incorrect");
			}, function(reason) {
				assert.isTrue(false, "failed to get data: " + reason);
			});
		}).then(function() {
			//test cases that should fail
			return new Promise(function(resolve, reject) {
				var count = 7;
				function finish() { if(--count == 0) resolve(); }
				
				marketContract.removeListing(createdTokens.length, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to remove listing with token index that wasnt listed");
					finish();
				}, finish);
				marketContract.purchase(0, 3, {from:testUsers[2], value:listing3[0]+listing3[0]*(devFee/100000), gas:3000000}).then(function() {
					assert.isTrue(false, "was able to purchase token to an invalid address");
					finish();
				}, finish);
				marketContract.purchase(migratorAddress, 7, {from:testUsers[2], value:listing5[0]+listing5[0]*(devFee/100000), gas:3000000}).then(function() {
					assert.isTrue(false, "was able to purchase token that was removed");
					finish();
				}, finish);
				marketContract.purchase(migratorAddress, 7, {from:testUsers[2], value:listing5[0]+listing5[0]*(devFee/100000), gas:3000000}).then(function() {
					assert.isTrue(false, "was able to purchase token that was already purchased");
					finish();
				}, finish);
				marketContract.purchase(migratorAddress, createdTokens.length, {from:testUsers[2], value:listing3[0]+listing3[0]*(devFee/100000), gas:3000000}).then(function() {
					assert.isTrue(false, "was able to purchase with token index that wasnt listed");
					finish();
				}, finish);
				marketContract.purchase(migratorAddress, 2, {from:testUsers[2], value:(listing2[0]+listing2[0]*(devFee/100000))-1000, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to purchase with insufficient value");
					finish();
				}, finish);
				marketContract.removeListing(3, {from:testUsers[1], gas:3000000}).then(function() {
					assert.isTrue(false, "was able to remove with invalid permission");
					finish();
				}, finish);
			});
		});
	});
	
	
	// Check Lock
	it("should lock system without error", function() {
		var pixelconsContract;
		var marketContract;
		
		return PixelCons.deployed().then(function(instance) {
			pixelconsContract = instance;
			return PixelConMarket.deployed();
		}).then(function(instance) {
			marketContract = instance;
			return marketContract.adminSetLock(true, false, {from:testUsers[0], gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to lock (including purchases): " + reason);
			});
		}).then(function() {
			return marketContract.removeListing(3, {from:testUsers[0], gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to remove listing while locked: " + reason);
			});
		}).then(function() {
			//test case that should fail
			return new Promise(function(resolve, reject) {
				var count = 2;
				function finish() { if(--count == 0) resolve(); }
				
				marketContract.purchase(testUsers[2], 6, {from:testUsers[2], value:(listing4[0]+listing4[0]*(devFee/100000)), gas:3000000}).then(function() {
					assert.isTrue(false, "was able to purchase token 7 while market was locked");
					finish();
				}, finish);
				var bytes = generateTransferBytesData(listing5[0], listing5[1], listing5[2]);
				pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[7].id, bytes, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to list token 8 while the market was locked");
					finish();
				}, finish);
			});
		}).then(function() {
			return marketContract.adminSetLock(true, true, {from:testUsers[0], gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to lock (purchases allowed): " + reason);
			});
		}).then(function() {
			return marketContract.purchase(testUsers[2], 6, {from:testUsers[2], value:(listing4[0]+listing4[0]*(devFee/100000)), gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to purchase token 7 while market was locked: " + reason);
			});
		}).then(function() {
			//test case that should fail
			return new Promise(function(resolve, reject) {
				var count = 1;
				function finish() { if(--count == 0) resolve(); }
				
				var bytes = generateTransferBytesData(listing5[0], listing5[1], listing5[2]);
				pixelconsContract.safeTransferFrom(migratorAddress, marketContract.address, createdTokens[7].id, bytes, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to list token 8 while the market was locked");
					finish();
				}, finish);
			});
		});
	});
	
	
	// Check Withdraw/Close
	it("should lock system without error", function() {
		var marketContract;
		var beforeMarketContractBalance;
		var beforeMigratorBalance;
		
		return PixelConMarket.deployed().then(function(instance) {
			marketContract = instance;
			return web3.eth.getBalance(marketContract.address);
		}).then(function(data) {
			beforeMarketContractBalance = parseInt(data);
			return web3.eth.getBalance(migratorAddress);
		}).then(function(data) {
			beforeMigratorBalance = parseInt(data);
			
			//test case that should fail
			return new Promise(function(resolve, reject) {
				var count = 1;
				function finish() { if(--count == 0) resolve(); }
				
				marketContract.adminClose(0, {from:testUsers[0], gas:3000000}).then(function() {
					assert.isTrue(false, "was able to close with invalid address");
					finish();
				}, finish);
			});
		}).then(function() {
			return marketContract.adminClose(migratorAddress, {from:testUsers[0], gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to close market: " + reason);
			});
		}).then(function() {
			//verify changes
			var marketContractBalance;
			var migratorBalance;
			
			return PixelConMarket.deployed().then(function(instance) {
				marketContract = instance;
				return web3.eth.getBalance(marketContract.address);
			}).then(function(data) {
				marketContractBalance = data;
				return web3.eth.getBalance(migratorAddress);
			}).then(function(data) {
				migratorBalance = data;
			
				assert.equal(0, marketContractBalance, "market still has value after close");
				assert.equal(Math.floor((beforeMarketContractBalance+beforeMigratorBalance)/1000000), Math.floor(migratorBalance.toNumber()/1000000), 
					"market value did not transfer on close");
			});
		});
	});
	
	
});

function generateTransferBytesData(startPrice, endPrice, duration) {
	startPrice = to256Hex(toWei(startPrice));
	endPrice = to256Hex(toWei(endPrice));
	return '0x' + hexToBytes(startPrice) + hexToBytes(endPrice) + hexToBytes(web3.toHex(duration));
}

function to256Hex(number) {
	var hex = web3.toHex(number);
	while(hex.length < 66) hex = hex.slice(0, 2) + '0' + hex.slice(2);
	return hex;
}

function toWei(ether) {
	return web3.toBigNumber(ether);
}
		
function hexToBytes(hex) {
	hex = hex.substring(2,hex.length);
	if(hex.length%2 == 1) hex = '0' + hex;
	
	var bytes = '';
	for(var i=0; i<32-(hex.length/2); i++) bytes += '00';
	for(var i=0; i<hex.length; i+=2) bytes += hex[i]+hex[i+1];
	return bytes;
}
		