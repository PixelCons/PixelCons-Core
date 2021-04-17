import { expect } from './setup'

import { ethers } from 'hardhat'
import { Contract, Signer, BigNumber } from 'ethers'

describe('PixelCons Performance', () => {
	return;/////////////////////////////////////////////Uncomment this line to skip test//////////////////////////////////////////////////////////////
	let createdTokens = [];
	let createdCollections = [];
	let randomNames = ['Carmelita','Mciver','Alexandria','Cotta','Fawn','Erne','Pamela','Vansant','Annemarie','Durrell','Paulette','Casarez','Alphonse','Foret','Leila','Lindner','Claudette','Yamanaka','Meggan','Jenkinson','Franklin','Cropp','Eleanore','Bach','Shelton','Reineck','Brianne','Murrieta','Leslie','Pintor','Roselee','Barrio','Altagracia','Alaimo','Britta','Yeaton','Georgianna','Colley','Chana','Tiemann','Tamekia','Wortman','Dreama','Luhman','Kimberlee','Gagliano','Bob','Kostelnik','Carrol','Stromain','Arlyne','Hoops','Lavada','Puryear','Lasandra','Pinkham','Cornelia','Lipps','Summer','Stennett','Jerome','Bucholtz','Belen','Winningham','Stephaine','Krause','Joel','Slaugh','Ricardo','Hassel','Mirta','Zynda','Emmitt','Bahr','Vesta','Mazzola','Neda','Moscoso','Elinor','Wageman','Darby','Heiner','Romana','Sparacino','Kathleen','Volkert','Betty','Mccawley','Ellen','Lovvorn','Karyl','Hakes','Pa','Perras','Sheri','Macdonald','Pam','Pitcock','Cecille','Coderre'];
	let emptyID: string = "0x0000000000000000000000000000000000000000000000000000000000000000";
	let emptyAddress: string = "0x0000000000000000000000000000000000000000";
	let pixelconsContract: Contract = null;
	let pixelconsMigratorContract: Contract = null;
	let deployer: Signer = null;
	let accounts: Signer[] = [];
	let deployerAddress: string = null;
	let accountAddresses: string[] = [];
	let errorText: string = null;
	before(async () => {
		[deployer, accounts[0], accounts[1], accounts[2]] = await ethers.getSigners();
		pixelconsContract = await (await ethers.getContractFactory('PixelCons')).connect(deployer).deploy();
		pixelconsMigratorContract = await (await ethers.getContractFactory('PixelConsMigrator')).connect(deployer).deploy(pixelconsContract.address);
		deployerAddress = await deployer.getAddress();
		accountAddresses[0] = await accounts[0].getAddress();
		accountAddresses[1] = await accounts[1].getAddress();
		accountAddresses[2] = await accounts[2].getAddress();
	});
	
	//System Params
	const gasPrice = 0.00000015; //150 Gwei
	const ethPrice = 2000;
	const dataloadCount = 100;
	const batchDataloadCount = 25;
	const transferCount = 50;
	const batchTransferCount = 25;

	//Check Create Tokens
	describe('creating tokens (naive)', () => {
		it('calc gas for create', async () => {
			let gasTotal = 0;
			for(let i=0; i<dataloadCount; i++) {
				let creator = accounts[1];
				let creatorAddress = accountAddresses[1];
				let ownerAddress = accountAddresses[1];
				let id = randomID();
				createdTokens.push({
					id: id,
					name: null,
					owner: ownerAddress,
					creator: creatorAddress
				});
				
				let result = await (await pixelconsContract.connect(creator).create(ownerAddress, id, '0x0000000000000000')).wait();
				let gas = result.gasUsed.toNumber();
				gasTotal += gas;
			}
			let gas = (gasTotal/dataloadCount);
			console.log("Avg Gas: " + gas + " [$" + (gas*gasPrice*ethPrice).toFixed(2) + "]");
		}).timeout(1*60*60*1000);
	});
	describe('creating tokens (batch)', () => {
		it('calc gas for create batch', async () => {
			let creator = accounts[1];
			let pixelconIds = [];
			for(let i=0; i<batchDataloadCount; i++) pixelconIds.push(randomID());
			
			let result = await (await pixelconsMigratorContract.connect(creator).createBatch(pixelconIds)).wait();
			let gasTotal = result.gasUsed.toNumber();
			let gas = (gasTotal/batchDataloadCount);
			console.log("Total Gas: " + gasTotal + ", Avg Gas: " + gas + " [$" + (gas*gasPrice*ethPrice).toFixed(2) + "]");
		}).timeout(1*60*60*1000);
	});
	
	//Check Transfer Tokens
	describe('transfer tokens (naive)', () => {
		it('calc gas for transfer', async () => {
			let gasTotal = 0;
			for(let i=0; i<transferCount; i++) {
				let owner = accounts[1];
				let ownerAddress = accountAddresses[1];
				let newOwnerAddress = accountAddresses[2];
				
				let result = await (await pixelconsContract.connect(owner).transferFrom(ownerAddress, newOwnerAddress, createdTokens[i].id)).wait();
				let gas = result.gasUsed.toNumber();
				gasTotal += gas;
			}
			let gas = (gasTotal/dataloadCount);
			console.log("Avg Gas: " + gas + " [$" + (gas*gasPrice*ethPrice).toFixed(2) + "]");
		}).timeout(1*60*60*1000);
	});
	describe('safe transfer tokens (naive)', () => {
		it('calc gas for safe transfer', async () => {
			let gasTotal = 0;
			for(let i=0; i<transferCount; i++) {
				let owner = accounts[2];
				let ownerAddress = accountAddresses[2];
				let newOwnerAddress = pixelconsMigratorContract.address;
				
				let result = await (await pixelconsContract.connect(owner)['safeTransferFrom(address,address,uint256)'](ownerAddress, newOwnerAddress, createdTokens[i].id)).wait();
				let gas = result.gasUsed.toNumber();
				gasTotal += gas;
			}
			let gas = (gasTotal/dataloadCount);
			console.log("Avg Gas: " + gas + " [$" + (gas*gasPrice*ethPrice).toFixed(2) + "]");
		}).timeout(1*60*60*1000);
	});
	describe('transfer tokens (batch)', () => {
		it('calc gas for transfer batch', async () => {
			let owner = accounts[1];
			let pixelconIds = [];
			for(let i=0; i<batchTransferCount; i++) pixelconIds.push(createdTokens[i+transferCount].id);
			
			let approvalResult = await (await pixelconsContract.connect(owner).setApprovalForAll(pixelconsMigratorContract.address, true)).wait();
			let approvalGas = approvalResult.gasUsed.toNumber();
			console.log("Approval Gas: " + approvalGas + " [$" + (approvalGas*gasPrice*ethPrice).toFixed(2) + "]");
			
			let result = await (await pixelconsMigratorContract.connect(owner).transferBatch(pixelconIds)).wait();
			let gasTotal = result.gasUsed.toNumber();
			let gas = (gasTotal/batchTransferCount);
			console.log("Total Gas: " + gasTotal + ", Avg Gas: " + gas + " [$" + (gas*gasPrice*ethPrice).toFixed(2) + "]");
		}).timeout(1*60*60*1000);
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
