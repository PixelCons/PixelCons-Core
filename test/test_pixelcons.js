var PixelCons = artifacts.require("./PixelCons.sol");
var NotReceiver = artifacts.require("./NotReceiver.sol");

// Settings
var dataloadCount = 10; //(min 10)

contract('PixelCons', function(accounts) {
	var createdTokens = [];
	var createdCollections = [];
	var migratorAddress = web3.eth.accounts[0];
	var testUsers = [web3.eth.accounts[1],web3.eth.accounts[2],web3.eth.accounts[3]];
	var randomNames = ['Carmelita','Mciver','Alexandria','Cotta','Fawn','Erne','Pamela','Vansant','Annemarie','Durrell','Paulette','Casarez','Alphonse','Foret','Leila','Lindner','Claudette','Yamanaka','Meggan','Jenkinson',
		'Franklin','Cropp','Eleanore','Bach','Shelton','Reineck','Brianne','Murrieta','Leslie','Pintor','Roselee','Barrio','Altagracia','Alaimo','Britta','Yeaton','Georgianna','Colley','Chana','Tiemann','Tamekia','Wortman',
		'Dreama','Luhman','Kimberlee','Gagliano','Bob','Kostelnik','Carrol','Stromain','Arlyne','Hoops','Lavada','Puryear','Lasandra','Pinkham','Cornelia','Lipps','Summer','Stennett','Jerome','Bucholtz','Belen','Winningham',
		'Stephaine','Krause','Joel','Slaugh','Ricardo','Hassel','Mirta','Zynda','Emmitt','Bahr','Vesta','Mazzola','Neda','Moscoso','Elinor','Wageman','Darby','Heiner','Romana','Sparacino','Kathleen','Volkert','Betty','Mccawley',
		'Ellen','Lovvorn','Karyl','Hakes','Pa','Perras','Sheri','Macdonald','Pam','Pitcock','Cecille','Coderre'];
			
	
	//Check Create Tokens
	it("should create token data without error", function() {
		var pixelconsContract;
		return new Promise(function(resolve, reject) {
			PixelCons.deployed().then(function(instance) {
				pixelconsContract = instance;
				var count = dataloadCount;
				function finish() { if(--count == 0) resolve(); }
				
				for(var i=0; i<dataloadCount; i++) {
					var owner = (i==0)?testUsers[0]:migratorAddress;
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
		}).then(function() {
			//test cases that should fail
			return new Promise(function(resolve, reject) {
				var count = 3;
				function finish() { if(--count == 0) resolve(); }
				
				var id = web3.sha3('Random Token ' + Math.random()*100);
				pixelconsContract.create(0, id, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to create with invalid owner address of 0");
					finish();
				}, finish);
				pixelconsContract.create(testUsers[1], 0, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to create with invalid id of 0");
					finish();
				}, finish);
				pixelconsContract.create(testUsers[1], createdTokens[0].id, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to create id already in existence");
					finish();
				}, finish);
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
		}).then(function() {
			//test cases that should fail
			return new Promise(function(resolve, reject) {
				var count = 7;
				function finish() { if(--count == 0) resolve(); }
				
				pixelconsContract.createCollection([1], 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to create collection of less than 2");
					finish();
				}, finish);
				pixelconsContract.createCollection([], 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to create collection of nothing");
					finish();
				}, finish);
				pixelconsContract.createCollection([1,5,1], 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to create collection with duplicate index");
					finish();
				}, finish);
				pixelconsContract.createCollection([7,1,5,4], 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to create collection containing token token thats already in a collection");
					finish();
				}, finish);
				pixelconsContract.createCollection([5,7,0], 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to create collection containing token that wasn't owned by creator");
					finish();
				}, finish);
				pixelconsContract.createCollection([5,7,2], 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to create collection containing token that wasn't created by creator");
					finish();
				}, finish);
				pixelconsContract.createCollection([5,7,dataloadCount], 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to create collection with invalid index");
					finish();
				}, finish);
			});
		}, function(reason) {
			assert.isTrue(false, "failed to create collections: " + reason);
		});
	});
	
	
	// Check Edit Token/Collections
	it("should edit token/collection data without error", function() {
		var pixelconsContract;
		createdCollections.push({
			indexes: [1,6,4,3],
			name: web3.fromUtf8(randomNames[Math.floor(Math.random()*randomNames.length)].substr(0,8))
		});
		createdTokens[1].name = web3.fromUtf8(randomNames[Math.floor(Math.random()*randomNames.length)].substr(0,8));
		createdTokens[6].name = 0;
		
		return PixelCons.deployed().then(function(instance) {
			pixelconsContract = instance;
			return pixelconsContract.clearCollection(1, {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to clear collection: " + reason);
			});
		}).then(function() {
			return pixelconsContract.createCollection(createdCollections[3].indexes, createdCollections[3].name, {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to create collection: " + reason);
			});
		}).then(function() {
			return pixelconsContract.rename(createdTokens[1].id, createdTokens[1].name, {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to rename token: " + reason);
			});
		}).then(function() {
			return pixelconsContract.rename(createdTokens[6].id, createdTokens[6].name, {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to rename token: " + reason);
			});
		}).then(function() {
			return pixelconsContract.renameCollection(3, createdCollections[3].name, {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to rename collection: " + reason);
			});
		}).then(function() {
			return pixelconsContract.transferFrom(migratorAddress, testUsers[1], createdTokens[6].id, {from:migratorAddress, gas:3000000}).then(null, function(reason) {
				assert.isTrue(false, "failed to transfer token: " + reason);
			});
		}).then(function() {
			//verify changes
			var collection3Name;
			var token2Name;
			var token7Name;

			return PixelCons.deployed().then(function(instance) {
				pixelconsContract = instance;
				return pixelconsContract.getCollectionName.call(createdCollections.length-1);
			}).then(function(data) {
				collection3Name = data;
				return pixelconsContract.getTokenData.call(createdTokens[1].id);
			}).then(function(data) {
				token2Name = data[5];
				return pixelconsContract.getTokenData.call(createdTokens[6].id);
			}).then(function(data) {
				token7Name = data[5];
			
				assert.equal(to64Hex(createdCollections[createdCollections.length-1].name), collection3Name, "collection " + (createdCollections.length-1) + " name did not update correctly");
				assert.equal(to64Hex(createdTokens[1].name), token2Name, "token 2 name did not update correctly");
				assert.equal(to64Hex(createdTokens[6].name), token7Name, "token 7 name did not update correctly");
			}, function(reason) {
				assert.isTrue(false, "failed to get data: " + reason);
			});
		}).then(function() {
			//test cases that should fail
			return new Promise(function(resolve, reject) {
				var count = 14;
				function finish() { if(--count == 0) resolve(); }
				
				var id = web3.sha3('Random Token ' + Math.random()*100);
				pixelconsContract.rename(0, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to rename token with invalid id");
					finish();
				}, finish);
				pixelconsContract.rename(id, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to rename token with id that doesnt exist");
					finish();
				}, finish);
				pixelconsContract.rename(createdTokens[2].id, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to rename token with id without being creator");
					finish();
				}, finish);
				pixelconsContract.rename(createdTokens[0].id, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to rename token with id without being owner");
					finish();
				}, finish);
				pixelconsContract.renameCollection(0, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to rename collection with invalid index");
					finish();
				}, finish);
				pixelconsContract.renameCollection(createdCollections.length, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to rename collection with invalid index (out of bounds)");
					finish();
				}, finish);
				pixelconsContract.renameCollection(1, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to rename collection thats been cleared");
					finish();
				}, finish);
				pixelconsContract.renameCollection(createdCollections.length-1, 0, {from:testUsers[1], gas:3000000}).then(function() {
					assert.isTrue(false, "was able to rename collection without being creator of all tokens in it");
					finish();
				}, finish);
				pixelconsContract.renameCollection(createdCollections.length-1, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to rename collection without being owner of all tokens in it");
					finish();
				}, finish);
				pixelconsContract.clearCollection(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to clear collection with invalid index");
					finish();
				}, finish);
				pixelconsContract.clearCollection(createdCollections.length, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to clear collection with invalid index (out of bounds)");
					finish();
				}, finish);
				pixelconsContract.clearCollection(1, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to clear collection thats been cleared");
					finish();
				}, finish);
				pixelconsContract.clearCollection(createdCollections.length-1, 0, {from:testUsers[1], gas:3000000}).then(function() {
					assert.isTrue(false, "was able to clear collection without being creator of all tokens in it");
					finish();
				}, finish);
				pixelconsContract.clearCollection(createdCollections.length-1, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to clear collection without being owner of all tokens in it");
					finish();
				}, finish);
			});
		});
	});
	
	
	// Check Token Enumeration
	it("should match expected enumeration", function() {
		var pixelconsContract;
		var totalSupply;
		var firstToken;
		var middleToken;
		var lastToken;
		var shouldExistCheck;
		var shouldNotExistCheck;
		var token2Data;
		var token2DataByIndex;
		var firstTokenIndex;
		var lastTokenIndex;

		return PixelCons.deployed().then(function(instance) {
			pixelconsContract = instance;
			return pixelconsContract.totalSupply.call();
		}).then(function(data) {
			totalSupply = data;
			return pixelconsContract.tokenByIndex.call(0);
		}).then(function(data) {
			firstToken = to256Hex(data);
			return pixelconsContract.tokenByIndex.call(createdTokens.length/2);
		}).then(function(data) {
			middleToken = to256Hex(data);
			return pixelconsContract.tokenByIndex.call(createdTokens.length-1);
		}).then(function(data) {
			lastToken = to256Hex(data);
			return pixelconsContract.exists.call(createdTokens[1].id);
		}).then(function(data) {
			shouldExistCheck = data;
			return pixelconsContract.exists.call(web3.sha3('Random Token ' + Math.random()*100));
		}).then(function(data) {
			shouldNotExistCheck = data;
			return pixelconsContract.getTokenData.call(createdTokens[1].id);
		}).then(function(data) {
			token2Data = data;
			return pixelconsContract.getTokenDataByIndex.call(1);
		}).then(function(data) {
			token2DataByIndex = data;
			return pixelconsContract.getTokenIndex.call(createdTokens[0].id);
		}).then(function(data) {
			firstTokenIndex = data;
			return pixelconsContract.getTokenIndex.call(createdTokens[createdTokens.length-1].id);
		}).then(function(data) {
			lastTokenIndex = data;
			
			//test data
			assert.equal(dataloadCount, totalSupply, "total supply is incorrect");
			assert.equal(createdTokens[0].id, firstToken, "first token index returns wrong id");
			assert.equal(createdTokens[createdTokens.length/2].id, middleToken, "middle token index returns wrong id");
			assert.equal(createdTokens[createdTokens.length-1].id, lastToken, "last token index returns wrong id");
			assert.equal(true, shouldExistCheck, "token1 was said to not exist");
			assert.equal(false, shouldNotExistCheck, "random id was flagged as existing");
			assert.equal(0, firstTokenIndex, "the first tokens index is incorrect");
			assert.equal(createdTokens.length-1, lastTokenIndex, "the last tokens index is incorrect");
			assert.equal(createdTokens[1].id, to256Hex(token2Data[0]), "token 2 data has the wrong tokenId");
			assert.equal(1, token2Data[1], "token 2 data has the wrong tokenIndex");
			assert.equal(createdTokens[1].owner, token2Data[3], "token 2 data has the wrong owner");
			assert.equal(createdTokens[1].creator, token2Data[4], "token 2 data has the wrong creator");
			assert.equal(to64Hex(createdTokens[1].name), token2Data[5], "token 2 data has the wrong name");
			assert.equal(to256Hex(token2DataByIndex[0]), to256Hex(token2Data[0]), "token data by index is different than data by id (tokenId)");
			assert.equal(token2DataByIndex[1].toNumber(), token2Data[1].toNumber(), "token data by index is different than data by id (tokenIndex)");
			assert.equal(token2DataByIndex[2].toNumber(), token2Data[2].toNumber(), "token data by index is different than data by id (collectionIndex)");
			assert.equal(token2DataByIndex[3], token2Data[3], "token data by index is different than data by id (owner)");
			assert.equal(token2DataByIndex[4], token2Data[4], "token data by index is different than data by id (creator)");
			assert.equal(to64Hex(token2DataByIndex[5]), to64Hex(token2Data[5]), "token data by index is different than data by id (name)");
			assert.equal(to256Hex(token2DataByIndex[6]), to256Hex(token2Data[6]), "token data by index is different than data by id (dateCreated)");
			
			
			//test cases that should fail
			return new Promise(function(resolve, reject) {
				var count = 7;
				function finish() { if(--count == 0) resolve(); }
				
				var id = web3.sha3('Random Token ' + Math.random()*100);
				pixelconsContract.tokenByIndex(dataloadCount, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get token id from invalid index");
					finish();
				}, finish);
				pixelconsContract.exists(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to check existence of invalid id");
					finish();
				}, finish);
				pixelconsContract.getTokenData(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get token data with id of 0");
					finish();
				}, finish);
				pixelconsContract.getTokenData(id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get token data with id that doesnt exist");
					finish();
				}, finish);
				pixelconsContract.getTokenDataByIndex(dataloadCount, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get token data with invalid index");
					finish();
				}, finish);
				pixelconsContract.getTokenIndex(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get token index with invalid id");
					finish();
				}, finish);
				pixelconsContract.getTokenIndex(id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get token index with id that doesnt exist");
					finish();
				}, finish);
			});
		}, function(reason) {
			assert.isTrue(false, "failed to get data: " + reason);
		});
	});
	
	
	// Check Ownership Enumeration
	it("should match expected ownership state", function() {
		var pixelconsContract;
		var firstTokenOwner;
		var middleTokenOwner;
		var lastTokenOwner;
		var migratorBalance;
		var user1Balance;
		var user3Balance;
		var migratorToken0;
		var migratorToken3;
		var user1Token0;

		return PixelCons.deployed().then(function(instance) {
			pixelconsContract = instance;
			return pixelconsContract.ownerOf.call(createdTokens[0].id);
		}).then(function(data) {
			firstTokenOwner = data;
			return pixelconsContract.ownerOf.call(createdTokens[createdTokens.length/2].id);
		}).then(function(data) {
			middleTokenOwner = data;
			return pixelconsContract.ownerOf.call(createdTokens[createdTokens.length-1].id);
		}).then(function(data) {
			lastTokenOwner = data;
			return pixelconsContract.balanceOf.call(migratorAddress);
		}).then(function(data) {
			migratorBalance = data;
			return pixelconsContract.balanceOf.call(testUsers[0]);
		}).then(function(data) {
			user1Balance = data;
			return pixelconsContract.balanceOf.call(testUsers[2]);
		}).then(function(data) {
			user3Balance = data;
			return pixelconsContract.tokenOfOwnerByIndex.call(migratorAddress, 0);
		}).then(function(data) {
			migratorToken0 = to256Hex(data);
			return pixelconsContract.tokenOfOwnerByIndex.call(migratorAddress, 3);
		}).then(function(data) {
			migratorToken3 = to256Hex(data);
			return pixelconsContract.tokenOfOwnerByIndex.call(testUsers[0], 0);
		}).then(function(data) {
			user1Token0 = to256Hex(data);
			
			//test data
			assert.equal(testUsers[0], firstTokenOwner, "first token owner was not testUser1");
			assert.equal(migratorAddress, middleTokenOwner, "middle token owner was not migrator");
			assert.equal(migratorAddress, lastTokenOwner, "last token owner was not migrator");
			assert.equal(dataloadCount-2, migratorBalance, "migrator balance was not " + (dataloadCount-2));
			assert.equal(1, user1Balance, "testUser1 balance was not 1");
			assert.equal(0, user3Balance, "testUser3 balance was not 0");
			assert.equal(createdTokens[1].id, migratorToken0, "migrator owned token 0 was not " + createdTokens[1].id);
			assert.equal(createdTokens[4].id, migratorToken3, "migrator owned token 3 was not " + createdTokens[4].id);
			assert.equal(createdTokens[0].id, user1Token0, "testUser1 owned token 0 was not " + createdTokens[0].id);
			
			//test cases that should fail
			return new Promise(function(resolve, reject) {
				var count = 5;
				function finish() { if(--count == 0) resolve(); }
				
				var id = web3.sha3('Random Token ' + Math.random()*100);
				pixelconsContract.ownerOf(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get owner of token with invalid id");
					finish();
				}, finish);
				pixelconsContract.ownerOf(id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get owner of token with id that doesnt exist");
					finish();
				}, finish);
				pixelconsContract.balanceOf(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to check balance of an invalid address");
					finish();
				}, finish);
				pixelconsContract.tokenOfOwnerByIndex(0, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get token id by index for owner with invalid address");
					finish();
				}, finish);
				pixelconsContract.tokenOfOwnerByIndex(migratorAddress, dataloadCount, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get token id by index for owner with invalid index");
					finish();
				}, finish);
			});
		}, function(reason) {
			assert.isTrue(false, "failed to get data: " + reason);
		});
	});
	
	
	// Check Creator Enumeration
	it("should match expected creator state", function() {
		var pixelconsContract;
		var thirdTokenCreator;
		var middleTokenCreator;
		var lastTokenCreator;
		var migratorCreatorTotal;
		var user1CreatorTotal;
		var user2CreatorTotal;
		var migratorCreatedToken0;
		var migratorCreatedToken3;
		var user2CreatedToken0;

		return PixelCons.deployed().then(function(instance) {
			pixelconsContract = instance;
			return pixelconsContract.creatorOf.call(createdTokens[2].id);
		}).then(function(data) {
			thirdTokenCreator = data;
			return pixelconsContract.creatorOf.call(createdTokens[createdTokens.length/2].id);
		}).then(function(data) {
			middleTokenCreator = data;
			return pixelconsContract.creatorOf.call(createdTokens[createdTokens.length-1].id);
		}).then(function(data) {
			lastTokenCreator = data;
			return pixelconsContract.creatorTotal.call(migratorAddress);
		}).then(function(data) {
			migratorCreatorTotal = data;
			return pixelconsContract.creatorTotal.call(testUsers[0]);
		}).then(function(data) {
			user1CreatorTotal = data;
			return pixelconsContract.creatorTotal.call(testUsers[1]);
		}).then(function(data) {
			user2CreatorTotal = data;
			return pixelconsContract.tokenOfCreatorByIndex.call(migratorAddress, 0);
		}).then(function(data) {
			migratorCreatedToken0 = to256Hex(data);
			return pixelconsContract.tokenOfCreatorByIndex.call(migratorAddress, 3);
		}).then(function(data) {
			migratorCreatedToken3 = to256Hex(data);
			return pixelconsContract.tokenOfCreatorByIndex.call(testUsers[1], 0);
		}).then(function(data) {
			user2CreatedToken0 = to256Hex(data);
			
			//test data
			assert.equal(testUsers[1], thirdTokenCreator, "third token creator was not testUser1");
			assert.equal(migratorAddress, middleTokenCreator, "middle token creator was not migrator");
			assert.equal(migratorAddress, lastTokenCreator, "last token creator was not migrator");
			assert.equal(dataloadCount-1, migratorCreatorTotal, "migrator created total was not " + (dataloadCount-1));
			assert.equal(0, user1CreatorTotal, "testUser1 created total was not 0");
			assert.equal(1, user2CreatorTotal, "testUser2 created total was not 1");
			assert.equal(createdTokens[0].id, migratorCreatedToken0, "migrator created token 0 was not " + createdTokens[0].id);
			assert.equal(createdTokens[4].id, migratorCreatedToken3, "migrator created token 3 was not " + createdTokens[4].id);
			assert.equal(createdTokens[2].id, user2CreatedToken0, "testUser1 created token 0 was not " + createdTokens[2].id);
			
			//test cases that should fail
			return new Promise(function(resolve, reject) {
				var count = 5;
				function finish() { if(--count == 0) resolve(); }
				
				var id = web3.sha3('Random Token ' + Math.random()*100);
				pixelconsContract.creatorOf(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get creator of token with invalid id");
					finish();
				}, finish);
				pixelconsContract.creatorOf(id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get creator of token with id that doesnt exist");
					finish();
				}, finish);
				pixelconsContract.creatorTotal(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to check creator total of an invalid address");
					finish();
				}, finish);
				pixelconsContract.tokenOfCreatorByIndex(0, 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get token id by index for creator with invalid address");
					finish();
				}, finish);
				pixelconsContract.tokenOfCreatorByIndex(migratorAddress, dataloadCount, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get token id by index for creator with invalid index");
					finish();
				}, finish);
			});
		}, function(reason) {
			assert.isTrue(false, "failed to get data: " + reason);
		});
	});
	
	
	// Check Collection Enumeration
	it("should match expected collection state", function() {
		var pixelconsContract;
		var totalCollections;
		var collection3Total;
		var collection2Total;
		var token1Collection;
		var token7Collection;
		var collection3Token1;
		var collection2Token2;
		var shouldExistCheck;
		var shouldNotExistCheck;
		var clearedCheck;
		var notClearedCheck;
		var collection2Name;

		return PixelCons.deployed().then(function(instance) {
			pixelconsContract = instance;
			return pixelconsContract.totalCollections.call();
		}).then(function(data) {
			totalCollections = data;
			return pixelconsContract.collectionTotal.call(3);
		}).then(function(data) {
			collection3Total = data;
			return pixelconsContract.collectionTotal.call(2);
		}).then(function(data) {
			collection2Total = data;
			return pixelconsContract.collectionOf.call(createdTokens[0].id);
		}).then(function(data) {
			token1Collection = data;
			return pixelconsContract.collectionOf.call(createdTokens[6].id);
		}).then(function(data) {
			token7Collection = data;
			return pixelconsContract.tokenOfCollectionByIndex.call(3, 0);
		}).then(function(data) {
			collection3Token1 = to256Hex(data);
			return pixelconsContract.tokenOfCollectionByIndex.call(2, 1);
		}).then(function(data) {
			collection2Token2 = to256Hex(data);
			return pixelconsContract.collectionExists.call(3);
		}).then(function(data) {
			shouldExistCheck = data;
			return pixelconsContract.collectionExists.call(createdCollections.length);
		}).then(function(data) {
			shouldNotExistCheck = data;
			return pixelconsContract.collectionCleared.call(1);
		}).then(function(data) {
			clearedCheck = data;
			return pixelconsContract.collectionCleared.call(3);
		}).then(function(data) {
			notClearedCheck = data;
			return pixelconsContract.getCollectionName.call(2);
		}).then(function(data) {
			collection2Name = data;
		
			//test data
			assert.equal(createdCollections.length, totalCollections, "collection total is incorrect");
			assert.equal(createdCollections[3].indexes.length, collection3Total.toNumber(), "total for collection 3 is incorrect");
			assert.equal(createdCollections[2].indexes.length, collection2Total.toNumber(), "total for collection 2 is incorrect");
			assert.equal(0, token1Collection.toNumber(), "token 1 shouldnt be in a collection");
			assert.equal(3, token7Collection.toNumber(), "token 7 wasnt in the correct collection");
			assert.equal(createdTokens[createdCollections[3].indexes[0]].id, collection3Token1, "collection 3 token 1 was incorrect");
			assert.equal(createdTokens[createdCollections[2].indexes[1]].id, collection2Token2, "collection 2 token 2 was incorrect");
			assert.equal(true, shouldExistCheck, "collection 3 was reported as not existing");
			assert.equal(false, shouldNotExistCheck, "collection with index out of bounds was reported existing");
			assert.equal(true, clearedCheck, "collection 1 doesnt report as cleared");
			assert.equal(false, notClearedCheck, "collection 1 was incorrectly reported as cleared");
			assert.equal(to64Hex(createdCollections[2].name), collection2Name, "collection 2 name is incorrect");
			
			//test cases that should fail
			return new Promise(function(resolve, reject) {
				var count = 12;
				function finish() { if(--count == 0) resolve(); }
				
				var id = web3.sha3('Random Token ' + Math.random()*100);
				pixelconsContract.collectionOf(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get collection of token with invalid id");
					finish();
				}, finish);
				pixelconsContract.collectionOf(id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get collection of token with id that doesnt exist");
					finish();
				}, finish);
				pixelconsContract.collectionTotal(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to check collection total of an invalid index");
					finish();
				}, finish);
				pixelconsContract.collectionTotal(createdCollections.length, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to check collection total of an invalid index (out of bounds)");
					finish();
				}, finish);
				pixelconsContract.tokenOfCollectionByIndex(0, 1, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to token id by index for collection with invalid index");
					finish();
				}, finish);
				pixelconsContract.tokenOfCollectionByIndex(createdCollections.length, 1, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to token id by index for collection with invalid index (out of bounds)");
					finish();
				}, finish);
				pixelconsContract.tokenOfCollectionByIndex(3, createdCollections[3].indexes.length, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to token id by invalid index (out of bounds) for collection");
					finish();
				}, finish);
				pixelconsContract.collectionExists(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to check collection existence of an invalid index");
					finish();
				}, finish);
				pixelconsContract.collectionCleared(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to check collection cleared state of an invalid index");
					finish();
				}, finish);
				pixelconsContract.collectionCleared(createdCollections.length, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to check collection cleared state of an invalid index (out of bounds)");
					finish();
				}, finish);
				pixelconsContract.getCollectionName(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to check collection name of an invalid index");
					finish();
				}, finish);
				pixelconsContract.getCollectionName(createdCollections.length, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to check collection name of an invalid index (out of bounds)");
					finish();
				}, finish);
			});
		}, function(reason) {
			assert.isTrue(false, "failed to get data: " + reason);
		});
	});
	
	
	// Check Token Transfers
	it("should transfer tokens without error", function() {
		var pixelconsContract;
		return new Promise(function(resolve, reject) {
			//transfer tokens
			PixelCons.deployed().then(function(instance) {
				pixelconsContract = instance;
				var count = 4;
				function finish() { if(--count == 0) resolve(); }
				
				pixelconsContract.transferFrom(migratorAddress, testUsers[0], createdTokens[2].id, {from:migratorAddress, gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to transfer token: " + reason);
					finish();
				});
				pixelconsContract.safeTransferFrom(migratorAddress, testUsers[0], createdTokens[3].id, "", {from:migratorAddress, gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to safe transfer token: " + reason);
					finish();
				});
				pixelconsContract.transferFrom(testUsers[1], testUsers[2], createdTokens[6].id, {from:testUsers[1], gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to transfer token: " + reason);
					finish();
				});
				pixelconsContract.safeTransferFrom(migratorAddress, testUsers[0], createdTokens[8].id, "", {from:migratorAddress, gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to safe transfer token: " + reason);
					finish();
				});
			});
		}).then(function() {
			//check ownership
			var token1Owner;
			var token3Owner;
			var token4Owner;
			var token7Owner;
			var token9Owner;
			var user1Balance;
			
			return PixelCons.deployed().then(function(instance) {
				pixelconsContract = instance;
				return pixelconsContract.ownerOf.call(createdTokens[0].id);
			}).then(function(data) {
				token1Owner = data;
				return pixelconsContract.ownerOf.call(createdTokens[2].id);
			}).then(function(data) {
				token3Owner = data;
				return pixelconsContract.ownerOf.call(createdTokens[3].id);
			}).then(function(data) {
				token4Owner = data;
				return pixelconsContract.ownerOf.call(createdTokens[6].id);
			}).then(function(data) {
				token7Owner = data;
				return pixelconsContract.ownerOf.call(createdTokens[8].id);
			}).then(function(data) {
				token9Owner = data;
				return pixelconsContract.balanceOf.call(testUsers[0]);
			}).then(function(data) {
				user1Balance = data;
			
				assert.equal(testUsers[0], token1Owner, "token 1 owner is incorrect");
				assert.equal(testUsers[0], token3Owner, "token 3 owner is incorrect");
				assert.equal(testUsers[0], token4Owner, "token 4 owner is incorrect");
				assert.equal(testUsers[2], token7Owner, "token 7 owner is incorrect");
				assert.equal(testUsers[0], token9Owner, "token 9 owner is incorrect");
				assert.equal(4, user1Balance, "user1 has incorrect balance");
			});
		}).then(function() {
			//try transfer not approved
			return new Promise(function(resolve, reject) {
				var count = 6;
				function finish() { if(--count == 0) resolve(); }
				
				var id = web3.sha3('Random Token ' + Math.random()*100);
				pixelconsContract.transferFrom(testUsers[0], migratorAddress, createdTokens[2].id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to transfer token 3 as migrator");
					finish();
				}, finish);
				pixelconsContract.transferFrom(testUsers[0], testUsers[1], createdTokens[4].id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to transfer token 5 with incorrect from address");
					finish();
				}, finish);
				pixelconsContract.transferFrom(migratorAddress, testUsers[1], 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to transfer with invalid token id");
					finish();
				}, finish);
				pixelconsContract.transferFrom(migratorAddress, testUsers[1], id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to transfer token with id that doesnt exist");
					finish();
				}, finish);
				pixelconsContract.transferFrom(migratorAddress, 0, createdTokens[4].id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to transfer token 5 to an invalid address");
					finish();
				}, finish);
				pixelconsContract.transferFrom(0, testUsers[1], createdTokens[4].id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to transfer token 5 from an invalid address");
					finish();
				}, finish);
			});
		}).then(function() {
			//do approvals
			return new Promise(function(resolve, reject) {
				var count = 1;
				function finish() { if(--count == 0) resolve(); }
				
				pixelconsContract.setApprovalForAll(testUsers[1], true, {from:migratorAddress, gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to set approval for all for migrator: " + reason);
					finish();
				});
			});
		}).then(function() {
			//do approvals
			return new Promise(function(resolve, reject) {
				var count = 6;
				function finish() { if(--count == 0) resolve(); }
				
				pixelconsContract.approve(testUsers[1], createdTokens[2].id, {from:testUsers[0], gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to approve for token 3: " + reason);
					finish();
				});
				pixelconsContract.approve(testUsers[2], createdTokens[8].id, {from:testUsers[0], gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to approve for token 9: " + reason);
					finish();
				});
				pixelconsContract.approve(testUsers[2], createdTokens[4].id, {from:testUsers[1], gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to approve for token 5: " + reason);
					finish();
				});
				pixelconsContract.setApprovalForAll(testUsers[0], true, {from:testUsers[2], gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to set approval for all for test user 3: " + reason);
					finish();
				});
				pixelconsContract.setApprovalForAll(migratorAddress, true, {from:testUsers[2], gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to set approval for all for test user 3: " + reason);
					finish();
				});
				pixelconsContract.setApprovalForAll(testUsers[1], true, {from:migratorAddress, gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to set approval for all for migrator: " + reason);
					finish();
				});
			});
		}).then(function() {
			//transfer tokens
			return new Promise(function(resolve, reject) {
				var count = 4;
				function finish() { if(--count == 0) resolve(); }
				
				pixelconsContract.transferFrom(migratorAddress, testUsers[0], createdTokens[1].id, {from:testUsers[1], gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to transfer token 2 as test user 2: " + reason);
					finish();
				});
				pixelconsContract.transferFrom(testUsers[0], testUsers[2], createdTokens[2].id, {from:testUsers[1], gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to transfer token 3 as test user 2: " + reason);
					finish();
				});
				pixelconsContract.transferFrom(testUsers[2], migratorAddress, createdTokens[6].id, {from:migratorAddress, gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to transfer token 7 as migrator: " + reason);
					finish();
				});
				pixelconsContract.transferFrom(testUsers[0], testUsers[1], createdTokens[8].id, {from:testUsers[0], gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to transfer token 9 as test user 1: " + reason);
					finish();
				});
			});
		}).then(function() {
			//remove approvals
			return new Promise(function(resolve, reject) {
				var count = 1;
				function finish() { if(--count == 0) resolve(); }
				
				pixelconsContract.setApprovalForAll(testUsers[1], false, {from:migratorAddress, gas:3000000}).then(finish, function(reason) {
					assert.isTrue(false, "failed to set approval for all for migrator: " + reason);
					finish();
				});
			});
		}).then(function() {
			//check ownership
			var token1Owner;
			var token2Owner;
			var token3Owner;
			var token7Owner;
			var token9Owner;
			var user1Balance;
			var user3Balance;
			var user2ApprovedForAll;
			var user1ApprovedForAll;
			var token5Approved;
			
			return PixelCons.deployed().then(function(instance) {
				pixelconsContract = instance;
				return pixelconsContract.ownerOf.call(createdTokens[0].id);
			}).then(function(data) {
				token1Owner = data;
				return pixelconsContract.ownerOf.call(createdTokens[1].id);
			}).then(function(data) {
				token2Owner = data;
				return pixelconsContract.ownerOf.call(createdTokens[2].id);
			}).then(function(data) {
				token3Owner = data;
				return pixelconsContract.ownerOf.call(createdTokens[6].id);
			}).then(function(data) {
				token7Owner = data;
				return pixelconsContract.ownerOf.call(createdTokens[8].id);
			}).then(function(data) {
				token9Owner = data;
				return pixelconsContract.balanceOf.call(testUsers[0]);
			}).then(function(data) {
				user1Balance = data;
				return pixelconsContract.balanceOf.call(testUsers[2]);
			}).then(function(data) {
				user3Balance = data;
				return pixelconsContract.isApprovedForAll.call(testUsers[2], testUsers[1]);
			}).then(function(data) {
				user2ApprovedForAll = data;
				return pixelconsContract.isApprovedForAll.call(testUsers[2], testUsers[0]);
			}).then(function(data) {
				user1ApprovedForAll = data;
				return pixelconsContract.getApproved.call(createdTokens[4].id);
			}).then(function(data) {
				token5Approved = data;
			
				assert.equal(testUsers[0], token1Owner, "token 1 owner is incorrect (second check)");
				assert.equal(testUsers[0], token2Owner, "token 2 owner is incorrect (second check)");
				assert.equal(testUsers[2], token3Owner, "token 3 owner is incorrect (second check)");
				assert.equal(migratorAddress, token7Owner, "token 7 owner is incorrect (second check)");
				assert.equal(testUsers[1], token9Owner, "token 9 owner is incorrect (second check)");
				assert.equal(3, user1Balance, "user1 has incorrect balance (second check)");
				assert.equal(1, user3Balance, "user3 has incorrect balance (second check)");
				assert.equal(false, user2ApprovedForAll, "user2 is incorrectly reported as having approval for all belonging to user3");
				assert.equal(true, user1ApprovedForAll, "user1 is incorrectly reported as not having approval for all belonging to user3");
				assert.equal(testUsers[2], token5Approved, "user3 is incorrectly not approved for token 5)");
			});
		}).then(function() {
			//try transfer not approved
			return new Promise(function(resolve, reject) {
				var count = 11;
				function finish() { if(--count == 0) resolve(); }
				
				var id = web3.sha3('Random Token ' + Math.random()*100);
				pixelconsContract.transferFrom(migratorAddress, testUsers[1], createdTokens[5].id, {from:testUsers[1], gas:3000000}).then(function() {
					assert.isTrue(false, "test user 2 was able to transfer on behalf of migrator");
					finish();
				}, finish);
				pixelconsContract.transferFrom(testUsers[1], testUsers[2], createdTokens[8].id, {from:testUsers[2], gas:3000000}).then(function() {
					assert.isTrue(false, "test user 3 was able to transfer token 9");
					finish();
				}, finish);
				pixelconsContract.transferFrom(testUsers[0], migratorAddress, createdTokens[8].id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "migrator was able to transfer token 1");
					finish();
				}, finish);
				pixelconsContract.approve(testUsers[1], createdTokens[2].id, {from:testUsers[1], gas:3000000}).then(function() {
					assert.isTrue(false, "was able to approve for token 3 that test user 2 doesnt own");
					finish();
				}, finish);
				pixelconsContract.approve(testUsers[1], 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to approve with invalid token id");
					finish();
				}, finish);
				pixelconsContract.approve(testUsers[1], id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to approve with token id that doesnt exist");
					finish();
				}, finish);
				pixelconsContract.getApproved(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get approved with invalid token id");
					finish();
				}, finish);
				pixelconsContract.getApproved(id, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get approved with token id that doesnt exist");
					finish();
				}, finish);
				pixelconsContract.setApprovalForAll(0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to approve for all for invalid address");
					finish();
				}, finish);
				pixelconsContract.isApprovedForAll(0, migratorAddress, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get approved for all for invalid owner address");
					finish();
				}, finish);
				pixelconsContract.isApprovedForAll(testUsers[0], 0, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to get approved for all for invalid operator address");
					finish();
				}, finish);
			});
		}).then(function() {
			//try transfer not safe
			return new Promise(function(resolve, reject) {
				var count = 1;
				function finish() { if(--count == 0) resolve(); }
				
				NotReceiver.deployed().then(function(instance) {
					var notReceiverAddress = instance.address;
					pixelconsContract.safeTransferFrom(migratorAddress, notReceiverAddress, createdTokens[7].id, {from:migratorAddress, gas:3000000}).then(function() {
						assert.isTrue(false, "was able to transfer to a not safe contract");
						finish();
					}, finish);
				})
			});
		});
	});
	
	
	// Check Admin Functions
	it("should perform admin functions without error", function() {
		var pixelconsContract;	
		return PixelCons.deployed().then(function(instance) {
			pixelconsContract = instance;
			//change admin
			return pixelconsContract.adminChange(testUsers[0], {from:migratorAddress, gas:3000000}).then(function(){}, function(reason) {
				assert.isTrue(false, "failed to change admin: " + reason);
			});
		}).then(function() {
			//change uri template
			return pixelconsContract.adminSetTokenURITemplate('pixelcon:<tokenId>, index:<tokenIndex>, name:<name>', {from:testUsers[0], gas:3000000}).then(function(){}, function(reason) {
				assert.isTrue(false, "failed to set uri template: " + reason);
			});
		}).then(function() {
			return web3.eth.getBalance(pixelconsContract.address);
		}).then(function(balance) {
			//withdraw
			assert.isTrue(balance > 0, 'Cannot perform withdraw test with nothing to withdraw');
			return pixelconsContract.adminWithdraw(migratorAddress, {from:testUsers[0], gas:3000000}).then(function(){}, function(reason) {
				assert.isTrue(false, "failed to withdraw funds: " + reason);
			});
		}).then(function() {
			//check data
			var token2URI;
			var currAdmin;
			var contractBalance;
			
			return PixelCons.deployed().then(function(instance) {
				pixelconsContract = instance;
				return pixelconsContract.tokenURI.call(createdTokens[1].id);
			}).then(function(data) {
				token2URI = data;
				return pixelconsContract.getAdmin.call();
			}).then(function(data) {
				currAdmin = data;
				return web3.eth.getBalance(pixelconsContract.address);
			}).then(function(data) {
				contractBalance = data;
				
				assert.equal('pixelcon:'+createdTokens[1].id+', index:0x0000000000000001, name:'+to64Hex(createdTokens[1].name), token2URI, "token 2 URI is incorrect");
				assert.equal(testUsers[0], currAdmin, "reported admin is incorrect");
				assert.equal(0, contractBalance, "funds were not completely withdrawn from the contract");
				
				return pixelconsContract.adminSetTokenURITemplate('name:<name>', {from:testUsers[0], gas:3000000});
			}).then(function() {
				return pixelconsContract.tokenURI.call(createdTokens[1].id);
			}).then(function(data) {
				token2URI = data;
				
				assert.equal('name:'+to64Hex(createdTokens[1].name), token2URI, "token 2 URI is incorrect (second check)");
			});
		}).then(function() {
			//test cases that should fail
			return new Promise(function(resolve, reject) {
				var count = 3;
				function finish() { if(--count == 0) resolve(); }
				
				pixelconsContract.adminChange(migratorAddress, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to change admin without permission");
					finish();
				}, finish);
				pixelconsContract.adminWithdraw(migratorAddress, {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to withdraw funds without permission");
					finish();
				}, finish);
				pixelconsContract.tokenURI('PixelCons123', {from:migratorAddress, gas:3000000}).then(function() {
					assert.isTrue(false, "was able to change token URI without permission");
					finish();
				}, finish);
			});
		});
	});
	
});

function to256Hex(number) {	
	var hex = web3.toHex(number);
	while(hex.length < 66) hex = hex.slice(0, 2) + '0' + hex.slice(2);
	return hex;
}
function to64Hex(number) {	
	var hex = web3.toHex(number);
	while(hex.length < 18) hex += '0';
	return hex;
}
