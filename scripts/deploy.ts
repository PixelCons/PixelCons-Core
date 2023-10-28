import {JsonRpcProvider, ContractFactory, Wallet, Signer} from 'ethers';
import {promises as fs} from 'fs';
import path from 'path';
import 'dotenv/config';

//Data constants
const artifactsDirectory = path.join(process.cwd(), 'artifacts');
const envSpecifiedPrivateKey = process.env.DEPLOY_ACCOUNT_KEY;

//Deploy the pixelcons contract
(async () => {
  console.log('');
  const jsonRpc = getJsonRpc();
  if (jsonRpc) {
    try {
      const provider = new JsonRpcProvider(getJsonRpc());
      const {chainId} = await provider.getNetwork();
      const deployer = await getDeployer(provider);
      if (deployer) {
        const pixelconsContract = await (await getContractFactory('PixelCons')).connect(deployer).deploy();
        console.log(`Pixelcons contract deployed: ${pixelconsContract.target}`);
        console.log(`JSON RPC: ${jsonRpc}`);
        console.log(`Chain ID: ${chainId}`);
      }
    } catch (e) {
      console.log(`ERROR: Failed to deploy with JSON RPC "${jsonRpc}"`);
    }
  } else {
    console.log('ERROR: JSON RPC not specified');
  }
})();

//Gets the json rpc to use
function getJsonRpc(): string {
  return process.argv[2];
}

//Gets the deployer account to use (either provider default or using env DEPLOY_ACCOUNT_KEY)
async function getDeployer(provider: JsonRpcProvider): Promise<Signer> {
  if (envSpecifiedPrivateKey) {
    try {
      const deployer = new Wallet(envSpecifiedPrivateKey, provider);
      console.log(`Using account specified with DEPLOY_ACCOUNT_KEY (pub key ${deployer.address})`);
      console.log('');
      return deployer;
    } catch (e) {
      console.log('ERROR: invalid key specified at DEPLOY_ACCOUNT_KEY');
    }
  } else {
    try {
      const deployer = await provider.getSigner(0);
      console.log(`Using default signer from JSON RPC (pub key ${deployer.address})`);
      console.log('Note: set environment variable DEPLOY_ACCOUNT_KEY to use custom signer');
      console.log('');
      return deployer;
    } catch (e) {
      console.log('ERROR: failed to get a default signer from the JSON RPC');
      console.log('Note: set environment variable DEPLOY_ACCOUNT_KEY to use custom signer');
    }
  }
  return null;
}

//Gets the contract factory for the given contract name
async function getContractFactory(contractName: string): Promise<ContractFactory> {
  const p = path.join(artifactsDirectory, `contracts/${contractName}.sol/${contractName}.json`);
  const contract = JSON.parse(await fs.readFile(p, 'utf8'));
  return new ContractFactory(contract.abi, contract.bytecode);
}
