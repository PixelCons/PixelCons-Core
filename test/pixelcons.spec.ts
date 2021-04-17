import { expect } from './setup'

import { ethers } from 'hardhat'
import { Contract, Signer, BigNumber } from 'ethers'

describe('PixelCons', () => {
	//return;/////////////////////////////////////////////Uncomment this line to skip test//////////////////////////////////////////////////////////////
	let createdTokens = [];
	let createdCollections = [];
	let randomNames = ['Carmelita','Mciver','Alexandria','Cotta','Fawn','Erne','Pamela','Vansant','Annemarie','Durrell','Paulette','Casarez','Alphonse','Foret','Leila','Lindner','Claudette','Yamanaka','Meggan','Jenkinson','Franklin','Cropp','Eleanore','Bach','Shelton','Reineck','Brianne','Murrieta','Leslie','Pintor','Roselee','Barrio','Altagracia','Alaimo','Britta','Yeaton','Georgianna','Colley','Chana','Tiemann','Tamekia','Wortman','Dreama','Luhman','Kimberlee','Gagliano','Bob','Kostelnik','Carrol','Stromain','Arlyne','Hoops','Lavada','Puryear','Lasandra','Pinkham','Cornelia','Lipps','Summer','Stennett','Jerome','Bucholtz','Belen','Winningham','Stephaine','Krause','Joel','Slaugh','Ricardo','Hassel','Mirta','Zynda','Emmitt','Bahr','Vesta','Mazzola','Neda','Moscoso','Elinor','Wageman','Darby','Heiner','Romana','Sparacino','Kathleen','Volkert','Betty','Mccawley','Ellen','Lovvorn','Karyl','Hakes','Pa','Perras','Sheri','Macdonald','Pam','Pitcock','Cecille','Coderre'];
	let emptyID: string = "0x0000000000000000000000000000000000000000000000000000000000000000";
	let emptyAddress: string = "0x0000000000000000000000000000000000000000";
	let pixelconsContract: Contract = null;
	let notReceiverContract: Contract = null;
	let deployer: Signer = null;
	let accounts: Signer[] = [];
	let deployerAddress: string = null;
	let accountAddresses: string[] = [];
	let errorText: string = null;
	before(async () => {
		[deployer, accounts[0], accounts[1], accounts[2]] = await ethers.getSigners();
		pixelconsContract = await (await ethers.getContractFactory('PixelCons')).connect(deployer).deploy();
		notReceiverContract = await (await ethers.getContractFactory('NotReceiver')).connect(deployer).deploy();
		deployerAddress = await deployer.getAddress();
		accountAddresses[0] = await accounts[0].getAddress();
		accountAddresses[1] = await accounts[1].getAddress();
		accountAddresses[2] = await accounts[2].getAddress();
	});

	//Check Create Tokens
	describe('creating tokens', () => {
		it('should allow creating tokens', async () => {
			let dataloadCount = 10;
			for(let i=0; i<dataloadCount; i++) {
				let creator = (i==2) ? accounts[1] : deployer;
				let creatorAddress = (i==2) ? accountAddresses[1] : deployerAddress;
				let ownerAddress = (i==0) ? accountAddresses[0] : deployerAddress;
				let name = toBytes8((i==0) ? '' : randomNames[Math.floor(Math.random()*randomNames.length)].substr(0,8));
				let id = randomID();
				createdTokens.push({
					id: id,
					name: name,
					owner: ownerAddress,
					creator: creatorAddress
				});
				
				errorText = "Failed to create token";
				expect(pixelconsContract.connect(creator).create(ownerAddress, id, name), str(errorText)).to.not.be.reverted;
			}
		});
		
		it('should not allow creating bad tokens', async () => {
			let name = toBytes8(randomNames[Math.floor(Math.random()*randomNames.length)].substr(0,8));
			
			errorText = "Was able to create with invalid owner address of 0";
			await expect(pixelconsContract.connect(deployer).create(emptyAddress, randomID(), name), str(errorText)).to.be.revertedWith('Invalid address');
			
			errorText = "Was able to create with invalid id of 0";
			await expect(pixelconsContract.connect(deployer).create(accountAddresses[1], emptyID, name), str(errorText)).to.be.revertedWith('Invalid ID');
			
			errorText = "Was able to create id already in existence";
			await expect(pixelconsContract.connect(deployer).create(accountAddresses[1], createdTokens[0].id, name), str(errorText)).to.be.revertedWith('PixelCon already exists');
		});
	});

	// Check Create Collections
	describe('creating collections', () => {
		it('should allow creating collections', async () => {
			var indexes = [8,9];
			for(var i=0; i<20 && i+10<createdTokens.length; i++) indexes.push(i+10);
			var name = toBytes8(randomNames[Math.floor(Math.random()*randomNames.length)].substr(0,8));
			createdCollections.push({});
			createdCollections.push({ indexes:[6,4,3], name:toBytes8('') });
			createdCollections.push({ indexes:indexes, name:name });
			
			errorText = "Failed to create collection";
			await expect(pixelconsContract.connect(deployer).createCollection(createdCollections[1].indexes, createdCollections[1].name), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(deployer).createCollection(createdCollections[2].indexes, createdCollections[2].name), str(errorText)).to.not.be.reverted;
		});
		
		it('should not allow creating bad collections', async () => {
			errorText = "Was able to create collection of less than 2";
			await expect(pixelconsContract.connect(deployer).createCollection([1], toBytes8('')), str(errorText)).to.be.revertedWith('Collection must contain more than one PixelCon');
			
			errorText = "Was able to create collection of nothing";
			await expect(pixelconsContract.connect(deployer).createCollection([], toBytes8('')), str(errorText)).to.be.revertedWith('Collection must contain more than one PixelCon');
			
			errorText = "Was able to create collection with duplicate index";
			await expect(pixelconsContract.connect(deployer).createCollection([1,5,1], toBytes8('')), str(errorText)).to.be.revertedWith('PixelCon is already in a collection');
			
			errorText = "Was able to create collection containing token token thats already in a collection";
			await expect(pixelconsContract.connect(deployer).createCollection([7,1,5,4], toBytes8('')), str(errorText)).to.be.revertedWith('PixelCon is already in a collection');
			
			errorText = "Was able to create collection containing token that wasn't owned by creator"
			await expect(pixelconsContract.connect(deployer).createCollection([5,7,0], toBytes8('')), str(errorText)).to.be.revertedWith('Sender is not the creator and owner of the PixelCons');
			
			errorText = "Was able to create collection containing token that wasn't created by creator";
			await expect(pixelconsContract.connect(deployer).createCollection([5,7,2], toBytes8('')), str(errorText)).to.be.revertedWith('Sender is not the creator and owner of the PixelCons');
			
			errorText = "Was able to create collection with invalid index";
			await expect(pixelconsContract.connect(deployer).createCollection([5,7,createdTokens.length], toBytes8('')), str(errorText)).to.be.revertedWith('PixelCon index is out of bounds');
		});
	});
	
	// Check Edit Token/Collections
	describe('edit token/collections', () => {
		it('should allow clearing a collection', async () => {
			errorText = "Failed to clear collection";
			await expect(pixelconsContract.connect(deployer).clearCollection(1), str(errorText)).to.not.be.reverted;
		});
		
		it('should allow creating a collection', async () => {
			createdCollections.push({
				indexes: [1,6,4,3],
				name: toBytes8(randomNames[Math.floor(Math.random()*randomNames.length)].substr(0,8))
			});
			
			errorText = "Failed to create collection";
			await expect(pixelconsContract.connect(deployer).createCollection(createdCollections[3].indexes, createdCollections[3].name), str(errorText)).to.not.be.reverted;
		});
		
		it('should allow renaming a token', async () => {
			createdTokens[1].name = toBytes8(randomNames[Math.floor(Math.random()*randomNames.length)].substr(0,8));
			createdTokens[6].name = toBytes8('');
			
			errorText = "Failed to rename token";
			await expect(pixelconsContract.connect(deployer).rename(createdTokens[1].id, createdTokens[1].name), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(deployer).rename(createdTokens[6].id, createdTokens[6].name), str(errorText)).to.not.be.reverted;
			
			errorText = "Token name was not as expected";
			expect((await pixelconsContract.getTokenData(createdTokens[1].id))[5], str(errorText)).to.equal(createdTokens[1].name);
			expect((await pixelconsContract.getTokenData(createdTokens[6].id))[5], str(errorText)).to.equal(createdTokens[6].name);		
		});
		
		it('should allow renaming a collection', async () => {
			createdCollections[3].name = toBytes8(randomNames[Math.floor(Math.random()*randomNames.length)].substr(0,8));
			
			errorText = "Failed to rename collection";
			await expect(pixelconsContract.connect(deployer).renameCollection(3, createdCollections[3].name), str(errorText)).to.not.be.reverted;
			
			errorText = "Collection name was not as expected";
			expect(await pixelconsContract.getCollectionName(3), str(errorText)).to.equal(createdCollections[3].name);
		});
		
		it('should allow token transfer', async () => {
			errorText = "Failed to transfer token";
			await expect(pixelconsContract.connect(deployer).transferFrom(deployerAddress, accountAddresses[1], createdTokens[6].id), str(errorText)).to.not.be.reverted;
		});		
		
		it('should not allow bad clearing a collection', async () => {
			errorText = "Was able to clear collection with invalid index";
			await expect(pixelconsContract.connect(deployer).clearCollection(0), str(errorText)).to.be.revertedWith('Invalid index');
			
			errorText = "Was able to clear collection with invalid index (out of bounds)";
			await expect(pixelconsContract.connect(deployer).clearCollection(createdCollections.length), str(errorText)).to.be.revertedWith('Collection does not exist');
			
			errorText = "Was able to clear collection thats already been cleared";
			await expect(pixelconsContract.connect(deployer).clearCollection(1), str(errorText)).to.be.revertedWith('Collection is already cleared');
			
			errorText = "Was able to clear collection without being creator of all tokens in it";
			await expect(pixelconsContract.connect(accounts[1]).clearCollection(createdCollections.length-1), str(errorText)).to.be.revertedWith('Sender is not the creator and owner of the PixelCons');
			
			errorText = "Was able to clear collection without being owner of all tokens in it";
			await expect(pixelconsContract.connect(deployer).clearCollection(createdCollections.length-1), str(errorText)).to.be.revertedWith('Sender is not the creator and owner of the PixelCons');
		});
		
		it('should not allow bad renaming a token', async () => {
			errorText = "Was able to rename token with invalid id";
			await expect(pixelconsContract.connect(deployer).rename(emptyID, toBytes8('')), str(errorText)).to.be.revertedWith('Invalid ID');
			
			errorText = "Was able to rename token with id that doesnt exist";
			await expect(pixelconsContract.connect(deployer).rename(randomID(), toBytes8('')), str(errorText)).to.be.revertedWith('Sender is not the creator and owner');
			
			errorText = "Was able to rename token with id without being creator";
			await expect(pixelconsContract.connect(deployer).rename(createdTokens[2].id, toBytes8('')), str(errorText)).to.be.revertedWith('Sender is not the creator and owner');
			
			errorText = "Was able to rename token with id without being owner";
			await expect(pixelconsContract.connect(deployer).rename(createdTokens[0].id, toBytes8('')), str(errorText)).to.be.revertedWith('Sender is not the creator and owner');			
		});
		
		it('should not allow bad renaming a collection', async () => {
			errorText = "Was able to rename collection with invalid index";
			await expect(pixelconsContract.connect(deployer).renameCollection(0, toBytes8('')), str(errorText)).to.be.revertedWith('Invalid index');
			
			errorText = "Was able to rename collection with invalid index (out of bounds)";
			await expect(pixelconsContract.connect(deployer).renameCollection(createdCollections.length, toBytes8('')), str(errorText)).to.be.revertedWith('Collection does not exist');
			
			errorText = "Was able to rename collection thats been cleared";
			await expect(pixelconsContract.connect(deployer).renameCollection(1, toBytes8('')), str(errorText)).to.be.revertedWith('Collection has been cleared');
			
			errorText = "Was able to rename collection without being creator of all tokens in it";
			await expect(pixelconsContract.connect(accounts[1]).renameCollection(createdCollections.length-1, toBytes8('')), str(errorText)).to.be.revertedWith('Sender is not the creator and owner of the PixelCons');
			
			errorText = "Was able to rename collection without being owner of all tokens in it";
			await expect(pixelconsContract.connect(deployer).renameCollection(createdCollections.length-1, toBytes8('')), str(errorText)).to.be.revertedWith('Sender is not the creator and owner of the PixelCons');
		});
	});

	// Check Token Enumeration
	describe('token enumeration', () => {
		it('should report total supply', async () => {
			errorText = "Total supply was not as expected";
			expect(await pixelconsContract.totalSupply(), str(errorText)).to.equal(createdTokens.length);
		});
		
		it('should report token by index', async () => {
			errorText = "Token ID by index was not as expected";
			expect(await pixelconsContract.tokenByIndex(0), str(errorText)).to.equal(createdTokens[0].id);
			expect(await pixelconsContract.tokenByIndex(createdTokens.length/2), str(errorText)).to.equal(createdTokens[createdTokens.length/2].id);
			expect(await pixelconsContract.tokenByIndex(createdTokens.length-1), str(errorText)).to.equal(createdTokens[createdTokens.length-1].id);
		});
		
		it('should report token exists', async () => {
			errorText = "Token exists was not as expected";
			expect(await pixelconsContract.exists(createdTokens[1].id), str(errorText)).to.equal(true);
			expect(await pixelconsContract.exists(randomID()), str(errorText)).to.equal(false);
		});
		
		it('should report token data', async () => {
			errorText = "Token data was not as expected";
			expect((await pixelconsContract.getTokenData(createdTokens[1].id))[0], str(errorText)).to.equal(createdTokens[1].id);
			expect((await pixelconsContract.getTokenData(createdTokens[1].id))[1], str(errorText)).to.equal(1);
			expect((await pixelconsContract.getTokenData(createdTokens[1].id))[3], str(errorText)).to.equal(createdTokens[1].owner);
			expect((await pixelconsContract.getTokenData(createdTokens[1].id))[4], str(errorText)).to.equal(createdTokens[1].creator);
			expect((await pixelconsContract.getTokenData(createdTokens[1].id))[5], str(errorText)).to.equal(createdTokens[1].name);
		});
		
		it('should report token data by index', async () => {
			errorText = "Token data by index was not as expected";
			expect((await pixelconsContract.getTokenDataByIndex(1))[0], str(errorText)).to.equal(createdTokens[1].id);
			expect((await pixelconsContract.getTokenDataByIndex(1))[1], str(errorText)).to.equal(1);
			expect((await pixelconsContract.getTokenDataByIndex(1))[3], str(errorText)).to.equal(createdTokens[1].owner);
			expect((await pixelconsContract.getTokenDataByIndex(1))[4], str(errorText)).to.equal(createdTokens[1].creator);
			expect((await pixelconsContract.getTokenDataByIndex(1))[5], str(errorText)).to.equal(createdTokens[1].name);
		});
		
		it('should report token index', async () => {
			errorText = "Token index was not as expected";
			expect(await pixelconsContract.getTokenIndex(createdTokens[0].id), str(errorText)).to.equal(0);
			expect(await pixelconsContract.getTokenIndex(createdTokens[createdTokens.length-1].id), str(errorText)).to.equal(createdTokens.length-1);
		});
		
		it('should not report bad token by index', async () => {
			errorText = "Was able to get token id from invalid index";
			await expect(pixelconsContract.tokenByIndex(createdTokens.length), str(errorText)).to.be.revertedWith('PixelCon index is out of bounds');
		});
		
		it('should not report bad exists', async () => {
			errorText = "Was able to check existence of invalid id";
			await expect(pixelconsContract.exists(emptyID), str(errorText)).to.be.revertedWith('Invalid ID');
		});
		
		it('should not report bad token data', async () => {
			errorText = "Was able to get token data with id of 0";
			await expect(pixelconsContract.getTokenData(emptyID), str(errorText)).to.be.revertedWith('Invalid ID');
			
			errorText = "Was able to get token data with id that doesnt exist";
			await expect(pixelconsContract.getTokenData(randomID()), str(errorText)).to.be.revertedWith('PixelCon does not exist');
		});
		
		it('should not report bad token data by index', async () => {
			errorText = "Was able to get token data with invalid index";
			await expect(pixelconsContract.getTokenDataByIndex(createdTokens.length), str(errorText)).to.be.revertedWith('PixelCon index is out of bounds');
		});
		
		it('should not report bad token index', async () => {
			errorText = "Was able to get token index with invalid id";
			await expect(pixelconsContract.getTokenIndex(emptyID), str(errorText)).to.be.revertedWith('Invalid ID');
			
			errorText = "Was able to get token index with id that doesnt exist";
			await expect(pixelconsContract.getTokenIndex(randomID()), str(errorText)).to.be.revertedWith('PixelCon does not exist');
		});
	});
	
	// Check Owner Enumeration
	describe('owner enumeration', () => {
		it('should report owner of', async () => {
			errorText = "Owner of was not as expected";
			expect(await pixelconsContract.ownerOf(createdTokens[0].id), str(errorText)).to.equal(createdTokens[0].owner);
			expect(await pixelconsContract.ownerOf(createdTokens[createdTokens.length/2].id), str(errorText)).to.equal(createdTokens[createdTokens.length/2].owner);
			expect(await pixelconsContract.ownerOf(createdTokens[createdTokens.length-1].id), str(errorText)).to.equal(createdTokens[createdTokens.length-1].owner);
		});
		
		it('should report balance of', async () => {
			errorText = "Balance of was not as expected";
			expect(await pixelconsContract.balanceOf(deployerAddress), str(errorText)).to.equal(createdTokens.length-2);
			expect(await pixelconsContract.balanceOf(accountAddresses[0]), str(errorText)).to.equal(1);
			expect(await pixelconsContract.balanceOf(accountAddresses[2]), str(errorText)).to.equal(0);
		});
		
		it('should report token of owner by index', async () => {
			errorText = "Token of owner by index was not as expected";
			expect(await pixelconsContract.tokenOfOwnerByIndex(deployerAddress, 0), str(errorText)).to.equal(createdTokens[1].id);
			expect(await pixelconsContract.tokenOfOwnerByIndex(deployerAddress, 3), str(errorText)).to.equal(createdTokens[4].id);
			expect(await pixelconsContract.tokenOfOwnerByIndex(accountAddresses[0], 0), str(errorText)).to.equal(createdTokens[0].id);
		});
		
		it('should not report bad owner of', async () => {
			errorText = "Was able to get owner of token with invalid id";
			await expect(pixelconsContract.ownerOf(emptyID), str(errorText)).to.be.revertedWith('Invalid ID');
			
			errorText = "Was able to get owner of token with id that doesnt exist";
			await expect(pixelconsContract.ownerOf(randomID()), str(errorText)).to.be.revertedWith('PixelCon does not exist');
		});
		
		it('should not report bad balance of', async () => {
			errorText = "Was able to check balance of an invalid address";
			await expect(pixelconsContract.balanceOf(emptyAddress), str(errorText)).to.be.revertedWith('Invalid address');
		});
		
		it('should not report bad token of owner by index', async () => {
			errorText = "Was able to get token id by index for owner with invalid address";
			await expect(pixelconsContract.tokenOfOwnerByIndex(emptyAddress, 0), str(errorText)).to.be.revertedWith('Invalid address');
			
			errorText = "Was able to get token id by index for owner with invalid index";
			await expect(pixelconsContract.tokenOfOwnerByIndex(deployerAddress, createdTokens.length), str(errorText)).to.be.revertedWith('Index is out of bounds');
		});
	});
	
	// Check Creator Enumeration
	describe('creator enumeration', () => {
		it('should report creator of', async () => {
			errorText = "Creator of was not as expected";
			expect(await pixelconsContract.creatorOf(createdTokens[2].id), str(errorText)).to.equal(createdTokens[2].creator);
			expect(await pixelconsContract.creatorOf(createdTokens[createdTokens.length/2].id), str(errorText)).to.equal(createdTokens[createdTokens.length/2].creator);
			expect(await pixelconsContract.creatorOf(createdTokens[createdTokens.length-1].id), str(errorText)).to.equal(createdTokens[createdTokens.length-1].creator);
		});
		
		it('should report creator total', async () => {
			errorText = "Creator total was not as expected";
			expect(await pixelconsContract.creatorTotal(deployerAddress), str(errorText)).to.equal(createdTokens.length-1);
			expect(await pixelconsContract.creatorTotal(accountAddresses[0]), str(errorText)).to.equal(0);
			expect(await pixelconsContract.creatorTotal(accountAddresses[1]), str(errorText)).to.equal(1);
		});
		
		it('should report token of creator by index', async () => {
			errorText = "Token of creator by index was not as expected";
			expect(await pixelconsContract.tokenOfCreatorByIndex(deployerAddress, 0), str(errorText)).to.equal(createdTokens[0].id);
			expect(await pixelconsContract.tokenOfCreatorByIndex(deployerAddress, 3), str(errorText)).to.equal(createdTokens[4].id);
			expect(await pixelconsContract.tokenOfCreatorByIndex(accountAddresses[1], 0), str(errorText)).to.equal(createdTokens[2].id);
		});
		
		it('should not report bad creator of', async () => {
			errorText = "Was able to get creator of token with invalid id";
			await expect(pixelconsContract.creatorOf(emptyID), str(errorText)).to.be.revertedWith('Invalid ID');
			
			errorText = "Was able to get creator of token with id that doesnt exist";
			await expect(pixelconsContract.creatorOf(randomID()), str(errorText)).to.be.revertedWith('PixelCon does not exist');
		});
		
		it('should not report bad creator total', async () => {
			errorText = "Was able to check creator total of an invalid address";
			await expect(pixelconsContract.creatorTotal(emptyAddress), str(errorText)).to.be.revertedWith('Invalid address');
		});
		
		it('should not report bad token of creator by index', async () => {
			errorText = "Was able to get token id by index for creator with invalid address";
			await expect(pixelconsContract.tokenOfCreatorByIndex(emptyAddress, 0), str(errorText)).to.be.revertedWith('Invalid address');
			
			errorText = "Was able to get token id by index for creator with invalid index";
			await expect(pixelconsContract.tokenOfCreatorByIndex(deployerAddress, createdTokens.length), str(errorText)).to.be.revertedWith('Index is out of bounds');
		});
	});
	
	// Check Collection Enumeration
	describe('collection enumeration', () => {
		it('should report total collections', async () => {
			errorText = "Total collections was not as expected";
			expect(await pixelconsContract.totalCollections(), str(errorText)).to.equal(createdCollections.length);
		});
		
		it('should report collection total', async () => {
			errorText = "Collection total was not as expected";
			expect(await pixelconsContract.collectionTotal(3), str(errorText)).to.equal(createdCollections[3].indexes.length);
			expect(await pixelconsContract.collectionTotal(2), str(errorText)).to.equal(createdCollections[2].indexes.length);
		});
		
		it('should report collection of', async () => {
			errorText = "Collection of was not as expected";
			expect(await pixelconsContract.collectionOf(createdTokens[0].id), str(errorText)).to.equal(0);
			expect(await pixelconsContract.collectionOf(createdTokens[6].id), str(errorText)).to.equal(3);
		});
		
		it('should report token of collection by index', async () => {
			errorText = "Token of collection by index was not as expected";
			expect(await pixelconsContract.tokenOfCollectionByIndex(3, 0), str(errorText)).to.equal(createdTokens[createdCollections[3].indexes[0]].id);
			expect(await pixelconsContract.tokenOfCollectionByIndex(2, 1), str(errorText)).to.equal(createdTokens[createdCollections[2].indexes[1]].id);
		});
		
		it('should report collection exists', async () => {
			errorText = "Collection exists was not as expected";
			expect(await pixelconsContract.collectionExists(3), str(errorText)).to.equal(true);
			expect(await pixelconsContract.collectionExists(createdCollections.length), str(errorText)).to.equal(false);
		});
		
		it('should report collection cleared', async () => {
			errorText = "Collection cleared was not as expected";
			expect(await pixelconsContract.collectionCleared(1), str(errorText)).to.equal(true);
			expect(await pixelconsContract.collectionCleared(3), str(errorText)).to.equal(false);
		});
		
		it('should report collection name', async () => {
			errorText = "Collection total was not as name";
			expect(await pixelconsContract.getCollectionName(2), str(errorText)).to.equal(createdCollections[2].name);
		});
		
		it('should not report bad collection of', async () => {
			errorText = "Was able to get collection of token with invalid id";
			await expect(pixelconsContract.collectionOf(emptyID), str(errorText)).to.be.revertedWith('Invalid ID');
			
			errorText = "Was able to get collection of token with id that doesnt exist";
			await expect(pixelconsContract.collectionOf(randomID()), str(errorText)).to.be.revertedWith('PixelCon does not exist');
		});
		
		it('should not report bad collection total', async () => {
			errorText = "Was able to check collection total of an invalid index";
			await expect(pixelconsContract.collectionTotal(0), str(errorText)).to.be.revertedWith('Invalid index');
			
			errorText = "Was able to check collection total of an invalid index (out of bounds)";
			await expect(pixelconsContract.collectionTotal(createdCollections.length), str(errorText)).to.be.revertedWith('Collection does not exist');
		});
		
		it('should not report bad token of collection by index', async () => {
			errorText = "Was able to token id by index for collection with invalid index";
			await expect(pixelconsContract.tokenOfCollectionByIndex(0, 1), str(errorText)).to.be.revertedWith('Invalid index');
			
			errorText = "Was able to token id by index for collection with invalid index (out of bounds)";
			await expect(pixelconsContract.tokenOfCollectionByIndex(createdCollections.length, 1), str(errorText)).to.be.revertedWith('Collection does not exist');
			
			errorText = "Was able to token id by invalid index (out of bounds) for collection";
			await expect(pixelconsContract.tokenOfCollectionByIndex(3, createdCollections[3].indexes.length), str(errorText)).to.be.revertedWith('Index is out of bounds');
		});
		
		it('should not report bad collection exists', async () => {
			errorText = "Was able to check collection existence of an invalid index";
			await expect(pixelconsContract.collectionExists(0), str(errorText)).to.be.revertedWith('Invalid index');
		});
		
		it('should not report bad collection cleared', async () => {
			errorText = "Was able to check collection cleared state of an invalid index";
			await expect(pixelconsContract.collectionCleared(0), str(errorText)).to.be.revertedWith('Invalid index');
			
			errorText = "Was able to check collection cleared state of an invalid index (out of bounds)";
			await expect(pixelconsContract.collectionCleared(createdCollections.length), str(errorText)).to.be.revertedWith('Collection does not exist');
		});
		
		it('should not report bad collection name', async () => {
			errorText = "Was able to check collection name of an invalid index";
			await expect(pixelconsContract.getCollectionName(0), str(errorText)).to.be.revertedWith('Invalid index');
			
			errorText = "Was able to check collection name of an invalid index (out of bounds)";
			await expect(pixelconsContract.getCollectionName(createdCollections.length), str(errorText)).to.be.revertedWith('Collection does not exist');
		});
	});
	
	// Check Token Transfers
	describe('token transfers', () => {
		it('should allow transfer tokens', async () => {
			errorText = "Failed to transfer token";
			await expect(pixelconsContract.connect(deployer).transferFrom(deployerAddress, accountAddresses[0], createdTokens[2].id), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(deployer)['safeTransferFrom(address,address,uint256)'](deployerAddress, accountAddresses[0], createdTokens[3].id), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(accounts[1]).transferFrom(accountAddresses[1], accountAddresses[2], createdTokens[6].id), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(deployer)['safeTransferFrom(address,address,uint256)'](deployerAddress, accountAddresses[0], createdTokens[8].id), str(errorText)).to.not.be.reverted;
			
			errorText = "Failed check transfer";
			expect(await pixelconsContract.ownerOf(createdTokens[0].id), str(errorText)).to.equal(accountAddresses[0]);
			expect(await pixelconsContract.ownerOf(createdTokens[2].id), str(errorText)).to.equal(accountAddresses[0]);
			expect(await pixelconsContract.ownerOf(createdTokens[3].id), str(errorText)).to.equal(accountAddresses[0]);
			expect(await pixelconsContract.ownerOf(createdTokens[6].id), str(errorText)).to.equal(accountAddresses[2]);
			expect(await pixelconsContract.ownerOf(createdTokens[8].id), str(errorText)).to.equal(accountAddresses[0]);
			expect(await pixelconsContract.balanceOf(accountAddresses[0]), str(errorText)).to.equal(4);
		});
		
		it('should not allow bad transfer tokens', async () => {
			errorText = "Was able to transfer token 3 as deployer";
			await expect(pixelconsContract.connect(deployer).transferFrom(accountAddresses[0], deployerAddress, createdTokens[2].id), str(errorText)).to.be.revertedWith("Sender does not have permission to transfer PixelCon");
			
			errorText = "Was able to transfer token 5 with incorrect from address";
			await expect(pixelconsContract.connect(deployer).transferFrom(accountAddresses[0], accountAddresses[1], createdTokens[4].id), str(errorText)).to.be.revertedWith("Incorrect PixelCon owner");
			
			errorText = "Was able to transfer with invalid token id";
			await expect(pixelconsContract.connect(deployer).transferFrom(deployerAddress, accountAddresses[1], emptyID), str(errorText)).to.be.revertedWith("Invalid ID");
			
			errorText = "Was able to transfer token with id that doesnt exist";
			await expect(pixelconsContract.connect(deployer).transferFrom(deployerAddress, accountAddresses[1], randomID()), str(errorText)).to.be.revertedWith('PixelCon does not exist');
			
			errorText = "Was able to transfer token 5 to an invalid address";
			await expect(pixelconsContract.connect(deployer).transferFrom(deployerAddress, emptyAddress, createdTokens[4].id), str(errorText)).to.be.revertedWith('Invalid address');
			
			errorText = "Was able to transfer token 5 from an invalid address";
			await expect(pixelconsContract.connect(deployer).transferFrom(emptyAddress, accountAddresses[1], createdTokens[4].id), str(errorText)).to.be.revertedWith('Invalid address');
		});
		
		it('should allow approvals', async () => {
			errorText = "Failed to set approval";
			await expect(pixelconsContract.connect(deployer).setApprovalForAll(accountAddresses[1], true), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(accounts[0]).approve(accountAddresses[1], createdTokens[2].id), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(accounts[0]).approve(accountAddresses[2], createdTokens[8].id), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(accounts[1]).approve(accountAddresses[2], createdTokens[4].id), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(accounts[2]).setApprovalForAll(accountAddresses[0], true), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(accounts[2]).setApprovalForAll(deployerAddress, true), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(deployer).setApprovalForAll(accountAddresses[1], true), str(errorText)).to.not.be.reverted;
			
			errorText = "Failed check approvals";
			expect(await pixelconsContract.isApprovedForAll(accountAddresses[2], accountAddresses[0]), str(errorText)).to.equal(true);
			expect(await pixelconsContract.getApproved(createdTokens[4].id), str(errorText)).to.equal(accountAddresses[2]);
		});
		
		it('should allow transfer approved tokens', async () => {
			errorText = "Failed to transfer token";
			await expect(pixelconsContract.connect(accounts[1]).transferFrom(deployerAddress, accountAddresses[0], createdTokens[1].id), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(accounts[1]).transferFrom(accountAddresses[0], accountAddresses[2], createdTokens[2].id), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(deployer).transferFrom(accountAddresses[2], deployerAddress, createdTokens[6].id), str(errorText)).to.not.be.reverted;
			await expect(pixelconsContract.connect(accounts[0]).transferFrom(accountAddresses[0], accountAddresses[1], createdTokens[8].id), str(errorText)).to.not.be.reverted;
			
			errorText = "Failed check transfer";
			expect(await pixelconsContract.ownerOf(createdTokens[0].id), str(errorText)).to.equal(accountAddresses[0]);
			expect(await pixelconsContract.ownerOf(createdTokens[1].id), str(errorText)).to.equal(accountAddresses[0]);
			expect(await pixelconsContract.ownerOf(createdTokens[2].id), str(errorText)).to.equal(accountAddresses[2]);
			expect(await pixelconsContract.ownerOf(createdTokens[6].id), str(errorText)).to.equal(deployerAddress);
			expect(await pixelconsContract.ownerOf(createdTokens[8].id), str(errorText)).to.equal(accountAddresses[1]);
			expect(await pixelconsContract.balanceOf(accountAddresses[0]), str(errorText)).to.equal(3);
			expect(await pixelconsContract.balanceOf(accountAddresses[2]), str(errorText)).to.equal(1);
		});
		
		it('should allow remove approvals', async () => {
			errorText = "Failed to remove approval";
			await expect(pixelconsContract.connect(deployer).setApprovalForAll(accountAddresses[1], false), str(errorText)).to.not.be.reverted;
			
			errorText = "Failed check approvals";
			expect(await pixelconsContract.isApprovedForAll(accountAddresses[2], accountAddresses[1]), str(errorText)).to.equal(false);
		});
		
		it('should not allow bad transfer/approve tokens', async () => {
			errorText = "Account2 was able to transfer on behalf of deployer";
			await expect(pixelconsContract.connect(accounts[1]).transferFrom(deployerAddress, accountAddresses[1], createdTokens[5].id), str(errorText)).to.be.revertedWith("Sender does not have permission to transfer PixelCon");
			
			errorText = "Account3 was able to transfer token 9";
			await expect(pixelconsContract.connect(accounts[2]).transferFrom(accountAddresses[1], accountAddresses[2], createdTokens[8].id), str(errorText)).to.be.revertedWith("Sender does not have permission to transfer PixelCon");
			
			errorText = "Deployer was able to transfer token 1";
			await expect(pixelconsContract.connect(deployer).transferFrom(accountAddresses[0], deployerAddress, createdTokens[8].id), str(errorText)).to.be.revertedWith("Sender does not have permission to transfer PixelCon");
			
			errorText = "Was able to approve for token 3 that account2 doesnt own";
			await expect(pixelconsContract.connect(accounts[1]).approve(accountAddresses[1], createdTokens[2].id), str(errorText)).to.be.revertedWith('Sender does not have permission to approve address');
			
			errorText = "Was able to approve with invalid token id";
			await expect(pixelconsContract.connect(deployer).approve(accountAddresses[1], emptyID), str(errorText)).to.be.revertedWith('Invalid ID');
			
			errorText = "Was able to approve with token id that doesnt exist";
			await expect(pixelconsContract.connect(deployer).approve(accountAddresses[1], randomID()), str(errorText)).to.be.revertedWith('Sender does not have permission to approve address');
			
			errorText = "Was able to get approved with invalid token id";
			await expect(pixelconsContract.connect(deployer).getApproved(emptyID), str(errorText)).to.be.revertedWith('Invalid ID');
			
			errorText = "Was able to get approved with token id that doesnt exist";
			await expect(pixelconsContract.connect(deployer).getApproved(randomID()), str(errorText)).to.be.revertedWith('PixelCon does not exist');
			
			errorText = "Was able to approve for all for invalid address";
			await expect(pixelconsContract.connect(deployer).setApprovalForAll(emptyAddress, true), str(errorText)).to.be.revertedWith('Invalid address');
			
			errorText = "Was able to get approved for all for invalid owner address";
			await expect(pixelconsContract.connect(deployer).isApprovedForAll(emptyAddress, deployerAddress), str(errorText)).to.be.revertedWith('Invalid address');
			
			errorText = "Was able to get approved for all for invalid operator address";
			await expect(pixelconsContract.connect(deployer).isApprovedForAll(accountAddresses[0], emptyAddress), str(errorText)).to.be.revertedWith('Invalid address');
		});
		
		it('should not allow unsafe transfer', async () => {
			errorText = "Was able to safe transfer to a not safe address";
			await expect(pixelconsContract.connect(deployer)['safeTransferFrom(address,address,uint256)'](deployerAddress, notReceiverContract.address, createdTokens[7].id), str(errorText)).to.be.reverted;
		});
	});
	
	// Check Admin Functions
	describe('admin functions', () => {
		let tokenURITemplate: string = '<tokenId>: <name>';
		
		it('should allow update of tokenURI', async () => {
			errorText = "Was able to update token URI template not as admin";
			await expect(pixelconsContract.connect(accounts[2]).adminSetTokenURITemplate(tokenURITemplate), str(errorText)).to.be.revertedWith('Only the admin can call this function');
			
			errorText = "Failed to set token URI template";
			await expect(pixelconsContract.connect(deployer).adminSetTokenURITemplate(tokenURITemplate), str(errorText)).to.not.be.reverted;
		});
		
		it('should allow admin contract withdraw', async () => {
			errorText = "Was able to withdraw not as admin";
			await expect(pixelconsContract.connect(accounts[1]).adminWithdraw(accountAddresses[1]), str(errorText)).to.be.revertedWith('Only the admin can call this function');
			
			errorText = "Failed to withdraw as admin";
			await expect(pixelconsContract.connect(deployer).adminWithdraw(deployerAddress), str(errorText)).to.not.be.reverted;
			
			errorText = "Contract balance not zero after withdraw";
			await expect(await ethers.provider.getBalance(pixelconsContract.address), str(errorText)).to.equal(0);
		});
		
		it('should allow admin change', async () => {
			errorText = "Was able to change admin not as admin";
			await expect(pixelconsContract.connect(accounts[1]).adminChange(accountAddresses[1]), str(errorText)).to.be.revertedWith('Only the admin can call this function');
			
			errorText = "Failed to change admin as admin";
			await expect(pixelconsContract.connect(deployer).adminChange(accountAddresses[1]), str(errorText)).to.not.be.reverted;
		});
		
		it('should report correct data', async () => {
			let expectedURI = tokenURITemplate.replace('<tokenId>', createdTokens[1].id).replace('<name>', createdTokens[1].name);
			
			errorText = "The reported token URI is not what was expected";
			expect(await pixelconsContract.tokenURI(createdTokens[1].id), str(errorText)).to.equal(expectedURI);
			
			errorText = "The reported admin is not what was expected";
			expect(await pixelconsContract.getAdmin(), str(errorText)).to.equal(accountAddresses[1]);
			
		});
	});
});

// Utils
function toBytes8(text) {
	let bytes8 = new Uint8Array(8);
	let textBytes = ethers.utils.toUtf8Bytes(text);
	for(let i=0; i<8 && i<textBytes.length; i++) {
		bytes8[i] = textBytes[i];
	}
	return ethers.utils.hexlify(bytes8);
}
function randomID() {
	return ethers.utils.keccak256(ethers.utils.toUtf8Bytes('Random Token ' + Math.random()*100));
}
function str(text) {
	return (' ' + text).slice(1);
}
