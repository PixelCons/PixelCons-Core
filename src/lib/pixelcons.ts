import {ethers, Contract, Provider, JsonRpcProvider} from 'ethers';
import {to256Hex, toAddress, toUtf8} from './utils';
import buildConfig from '../build.config';
import deployments from '../../archive/contracts/deployments.json' with {type: 'json'};
import pixelconsABI from '../../archive/contracts/pixelconsABI.json' with {type: 'json'};

//Data constants
const pixelconsChainId = buildConfig.OVERRIDE_CHAIN_ID || parseInt(deployments.mainnet.chainId);
const pixelconsAddress = buildConfig.OVERRIDE_PIXELCONS_CONTRACT_ADDRESS || deployments.mainnet.contracts[0].address;
const maxParallelQuery = buildConfig.DATA_FETCHING_MAX_PARALLEL_QUERY || 5;

//Define provider cache
type ProviderCache = {
  provider?: Provider;
};
const providerCache: ProviderCache = {};

//Pixelcon object type
export type Pixelcon = {
  id: string;
  index: number;
  name: string;
  owner: string;
  creator: string;
  date: number;
  collection: number;
};

//Collection object type
export type Collection = {
  index: number;
  name: string;
  pixelconIds: string[];
};

//Archive data object type
export type ArchiveData = {
  pixelcon: Pixelcon;
  collection: Collection;
  derivativeOf: Pixelcon;
};

///////////////////////////////////////////////
// Data Fetching Functions for Pixelcon Data //
///////////////////////////////////////////////

//Get the current total supply of pixelcons
export async function getTotalPixelcons(): Promise<number> {
  const contract = await getPixelconContract();
  try {
    return parseInt(await contract.totalSupply());
  } catch (e) {
    return undefined;
  }
}

//Get full details for all pixelcons in existence
//note: should really only be used by the archiver since this is very expensive to run
export async function getAllPixelcons(
  startIndex?: number,
  endIndex?: number,
  parallel: boolean = false,
): Promise<Pixelcon[]> {
  if (startIndex === null || startIndex === undefined) startIndex = 0;
  const contract = await getPixelconContract();

  try {
    if (endIndex === null || endIndex === undefined)
      endIndex = parseInt(await retryContractCall(() => contract.totalSupply()));
    if (startIndex >= endIndex) return [];

    const indexes: number[] = [];
    for (let i = startIndex; i < endIndex; i++) indexes.push(i);
    return await fetchPixelconsInParallel(contract, indexes, parallel ? null : 1);
  } catch (e) {
    return undefined;
  }
}

//Get all collection names
export async function getAllCollectionNames(startIndex?: number, endIndex?: number): Promise<string[]> {
  if (startIndex === null || startIndex === undefined) startIndex = 0;
  const contract = await getPixelconContract();

  try {
    const total = parseInt(await retryContractCall(() => contract.totalCollections()));
    if (endIndex === null || endIndex === undefined) endIndex = total;
    if (startIndex >= endIndex) return [];

    const requestSize = endIndex - startIndex;
    if (endIndex > total) endIndex = total;

    const collectionNamesRaw = await retryContractCall(() => contract.getCollectionNamesInRange(startIndex, endIndex));
    const collectionNames: string[] = collectionNamesRaw.map((x) => toUtf8(x.toString()));
    for (let i = collectionNames.length; i < requestSize; i++) collectionNames.push(undefined);
    return collectionNames;
  } catch (e) {
    return undefined;
  }
}

/////////////////////////////
// Internal Util Functions //
/////////////////////////////

//Gets the pixelcon contract connected to a provider
async function getPixelconContract(): Promise<Contract> {
  return new Contract(pixelconsAddress, pixelconsABI, await getProvider());
}

//Gets a useable provider
async function getProvider(): Promise<Provider> {
  //check if the provider has already been cached
  if (providerCache.provider) {
    return providerCache.provider;
  }

  //try to use environment provider for backend (assume correct network)
  try {
    const jsonRpc = buildConfig.OVERRIDE_JSON_RPC || process.env.JSON_RPC;
    if (jsonRpc) {
      const provider = new JsonRpcProvider(jsonRpc);
      //assume correct network
      providerCache.provider = provider;
      return provider;
    }
  } catch (e) {
    //do nothing
  }

  //attempt to use the ethers default provider
  console.log('Using default provider');
  const provider = ethers.getDefaultProvider(pixelconsChainId);
  providerCache.provider = provider;
  return provider;
}

//Helper function to fetch multiple pixelcons in parallel
async function fetchPixelconsInParallel(
  contract: Contract,
  indexes: number[],
  parallelMax?: number,
): Promise<Pixelcon[]> {
  await getProvider();
  const fetchSegment = async (subIndexes: number[]) => {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queries: Promise<any>[] = [];
    for (let i = 0; i < subIndexes.length; i++) {
      queries.push(retryContractCall(() => contract.getTokenDataByIndex(subIndexes[i])));
    }

    const pixelcons: Pixelcon[] = [];
    for (let i = 0; i < subIndexes.length; i++) {
      pixelcons[i] = decodeAsPixelcon(await queries[i]);
    }
    return pixelcons;
  };

  //fetch in segments of at most 'maxParallelQuery' indexes
  if (parallelMax === null || parallelMax === undefined) parallelMax = maxParallelQuery;
  const allPixelcons: Pixelcon[] = [];
  for (let i = 0; i < indexes.length; i += parallelMax) {
    const subIndexes: number[] = [];
    for (let j = 0; j < parallelMax; j++) {
      if (i + j < indexes.length) subIndexes.push(indexes[i + j]);
      else break;
    }

    const pixelcons: Pixelcon[] = await fetchSegment(subIndexes);
    allPixelcons.push(...pixelcons);
  }
  return allPixelcons;
}

//Helper function to retry transient RPC provider failures
async function retryContractCall<T>(call: () => Promise<T>, retries = 5, delayMs = 250): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await call();
    } catch (err) {
      lastError = err;
      if (i < retries) await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
    }
  }
  throw lastError;
}

//Helper function to convert raw contract return data into a pixelcon
//eslint-disable-next-line @typescript-eslint/no-explicit-any
function decodeAsPixelcon(pixelconRaw: any): Pixelcon {
  try {
    return {
      id: to256Hex(pixelconRaw[0]),
      index: parseInt(pixelconRaw[1].toString()),
      name: toUtf8(pixelconRaw[5]),
      owner: toAddress(pixelconRaw[3]),
      creator: toAddress(pixelconRaw[4]),
      date: parseInt(pixelconRaw[6].toString()) * 1000,
      collection: parseInt(pixelconRaw[2].toString()) ? parseInt(pixelconRaw[2].toString()) : null,
    };
  } catch (e) {
    //do nothing
  }
  return undefined;
}
