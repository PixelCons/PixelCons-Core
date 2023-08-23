import {ethers, Contract, Provider, BrowserProvider, JsonRpcProvider} from 'ethers';
import useSWR from 'swr';
import {to256Hex, toAddress, toUtf8} from './utils';
import buildConfig from '../build.config';
import deployments from '../../archive/contracts/deployments.json' assert {type: 'json'};
import pixelconsABI from '../../archive/contracts/pixelconsABI.json' assert {type: 'json'};
import staticPixelconIds from '../../archive/pixelconIds.json' assert {type: 'json'};

//Data constants
const pixelconsChainId = buildConfig.OVERRIDE_CHAIN_ID || parseInt(deployments.mainnet.chainId);
const pixelconsAddress = buildConfig.OVERRIDE_PIXELCONS_CONTRACT_ADDRESS || deployments.mainnet.contracts[0].address;
const swrDataConfig = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};
const maxParallelQuery = buildConfig.DATA_FETCHING_MAX_PARALLEL_QUERY || 5;
const maxPixelconIdFetch = buildConfig.DATA_FETCHING_MAX_PIXELCON_IDS || 200;

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

//Get details about an individual pixelcon
export async function getPixelcon(pixelconId: string): Promise<Pixelcon> {
  if (pixelconId === null) return null;
  if (pixelconId === undefined) return undefined;
  pixelconId = to256Hex(pixelconId);
  const contract = await getPixelconContract();

  try {
    const pixelconRaw = await contract.getTokenData(pixelconId);
    return decodeAsPixelcon(pixelconRaw);
  } catch (e) {
    return undefined;
  }
}

//Get details about an individual collection
export async function getCollection(collectionIndex: string | number): Promise<Collection> {
  if (collectionIndex === null) return null;
  if (collectionIndex === undefined || collectionIndex === 0) return undefined;
  collectionIndex = parseInt(collectionIndex.toString());
  const contract = await getPixelconContract();

  try {
    const collectionRaw = await contract.getCollectionData(collectionIndex);
    return {
      index: collectionIndex,
      name: toUtf8(collectionRaw[0]),
      pixelconIds: await fetchPixelconIds(
        contract,
        collectionRaw[1].map((x) => parseInt(x.toString())),
      ),
    };
  } catch (e) {
    return undefined;
  }
}

//Get the name of a collection
export async function getCollectionName(collectionIndex: string | number): Promise<string> {
  if (collectionIndex === null) return null;
  if (collectionIndex === undefined || collectionIndex === 0) return undefined;
  collectionIndex = parseInt(collectionIndex.toString());
  const contract = await getPixelconContract();

  try {
    const collectionRaw = await contract.getCollectionData(collectionIndex);
    return toUtf8(collectionRaw[0]);
  } catch (e) {
    return undefined;
  }
}

//Get the pixelcon indexes that belong to a specific collection
export async function getCollectionPixelcons(collectionIndex: string | number): Promise<number[]> {
  if (collectionIndex === null) return null;
  if (collectionIndex === undefined || collectionIndex === 0) return undefined;
  collectionIndex = parseInt(collectionIndex.toString());
  const contract = await getPixelconContract();

  try {
    const collectionRaw = await contract.getForCollection(collectionIndex);
    return collectionRaw.map((x) => parseInt(x.toString()));
  } catch (e) {
    return undefined;
  }
}

//Get the pixelcon indexes that were made by a specific creator
export async function getCreatorPixelcons(address: string): Promise<number[]> {
  if (address === null) return null;
  if (address === undefined) return undefined;
  address = toAddress(address);
  const contract = await getPixelconContract();

  try {
    const ownerRaw = await contract.getForCreator(address);
    return ownerRaw.map((x) => parseInt(x.toString()));
  } catch (e) {
    return undefined;
  }
}

//Get the pixelcon indexes that belong to a specific owner
export async function getOwnerPixelcons(address: string): Promise<number[]> {
  if (address === null) return null;
  if (address === undefined) return undefined;
  address = toAddress(address);
  const contract = await getPixelconContract();

  try {
    const ownerRaw = await contract.getForOwner(address);
    return ownerRaw.map((x) => parseInt(x.toString()));
  } catch (e) {
    return undefined;
  }
}

//Get full details for all pixelcons in existence
//note: should really only be used by the archiver since this is very expensive to run
export async function getAllPixelcons(startIndex?: number, endIndex?: number): Promise<Pixelcon[]> {
  if (startIndex === null || startIndex === undefined) startIndex = 0;
  const contract = await getPixelconContract();
  try {
    if (endIndex === null || endIndex === undefined) endIndex = parseInt(await contract.totalSupply());
    if (startIndex >= endIndex) return [];

    const allPixelcons: Pixelcon[] = [];
    for (let i = startIndex; i < endIndex; i += maxParallelQuery) {
      const indexes: number[] = [];
      for (let j = 0; j < maxParallelQuery; j++) {
        if (i + j < endIndex) indexes.push(i + j);
        else break;
      }

      const pixelcons: Pixelcon[] = await fetchPixelconsInParallel(contract, indexes);
      allPixelcons.push(...pixelcons);
    }
    return allPixelcons;
  } catch (e) {
    return undefined;
  }
}

//Get all collection names
export async function getAllCollectionNames(startIndex?: number, endIndex?: number): Promise<string[]> {
  if (startIndex === null || startIndex === undefined) startIndex = 0;
  const contract = await getPixelconContract();

  try {
    const total = parseInt(await contract.totalCollections());
    if (endIndex === null || endIndex === undefined) endIndex = total;
    if (startIndex >= endIndex) return [];

    const requestSize = endIndex - startIndex;
    if (endIndex > total) endIndex = total;

    const collectionNamesRaw = await contract.getCollectionNamesInRange(startIndex, endIndex);
    const collectionNames: string[] = collectionNamesRaw.map((x) => toUtf8(x.toString()));
    for (let i = collectionNames.length; i < requestSize; i++) collectionNames.push(undefined);
    return collectionNames;
  } catch (e) {
    return undefined;
  }
}

//Get all pixelconIds (optimized with archived data)
export async function getAllPixelconIds(startIndex?: number, endIndex?: number): Promise<string[]> {
  if (startIndex === null || startIndex === undefined) startIndex = 0;
  const contract = await getPixelconContract();
  try {
    if (endIndex === null || endIndex === undefined) endIndex = parseInt(await contract.totalSupply());
    if (startIndex >= endIndex) return [];
    const allPixelconIds: string[] = [];

    //load from static data first
    while (startIndex < staticPixelconIds.length && startIndex < endIndex) {
      allPixelconIds.push(staticPixelconIds[startIndex]);
      startIndex++;
    }

    //query for anything left
    if (startIndex < endIndex) {
      const indexRanges: number[][] = [];
      for (let i = startIndex; i < endIndex; i += maxPixelconIdFetch) {
        indexRanges.push([i, Math.min(endIndex, i + maxPixelconIdFetch)]);
      }
      for (let i = 0; i < indexRanges.length; i += maxParallelQuery) {
        const ranges: number[][] = [];
        for (let j = 0; j < maxParallelQuery; j++) {
          if (i + j < indexRanges.length) ranges.push(indexRanges[i + j]);
          else break;
        }

        const pixelconIds: string[] = await getPixelconIdsInParallel(contract, ranges);
        allPixelconIds.push(...pixelconIds);
      }
    }
    return allPixelconIds;
  } catch (e) {
    return undefined;
  }
}

//Get all currently archived pixelconIds
export function getAllPixelconIdsStatic(): string[] {
  return staticPixelconIds;
}

///////////////////////////////////
// React Hooks for Pixelcon Data //
///////////////////////////////////

//Hook for getting pixelcon details
export function usePixelcon(pixelconId: string) {
  const {data, error, isLoading} = useSWR<Pixelcon>(
    `pixelcon/${pixelconId}`,
    async () => {
      //await (new Promise(r => setTimeout(r, 1000)));//TODO/////////////////////////////
      //throw new Error("wtf");//TODO/////////////////////////////
      return await getPixelcon(pixelconId);
    },
    swrDataConfig,
  );

  return {
    pixelcon: data,
    pixelconLoading: isLoading,
    pixelconError: error,
  };
}

//Hook for getting collection details
export function useCollection(collectionIndex: string | number) {
  const {data, error, isLoading} = useSWR<Collection>(
    `collection/${collectionIndex}`,
    async () => {
      //await (new Promise(r => setTimeout(r, 1000)));//TODO/////////////////////////////
      //throw new Error("wtf");//TODO/////////////////////////////
      return await getCollection(collectionIndex);
    },
    swrDataConfig,
  );

  return {
    collection: data,
    collectionLoading: isLoading,
    collectionError: error,
  };
}

//Hook for getting all pixelconIds
export function useAllPixelconIds() {
  const {data, error, isLoading} = useSWR<string[]>(
    'allPixelconIds',
    async () => {
      //await (new Promise(r => setTimeout(r, 1000)));//TODO/////////////////////////////
      //throw new Error("wtf");//TODO/////////////////////////////
      return await getAllPixelconIds();
    },
    swrDataConfig,
  );

  return {
    allPixelconIds: data,
    allPixelconIdsLoading: isLoading,
    allPixelconIdsError: error,
  };
}

//Hook for getting pixelcon indexes in a collection
export function useCollectionPixelcons(collectionIndex: string | number) {
  const {data, error, isLoading} = useSWR<number[]>(
    `collectionPixelcons/${collectionIndex}`,
    async () => {
      //await (new Promise(r => setTimeout(r, 1000)));//TODO/////////////////////////////
      //throw new Error("wtf");//TODO/////////////////////////////
      return await getCollectionPixelcons(collectionIndex);
    },
    swrDataConfig,
  );

  return {
    collectionPixelcons: data,
    collectionLoading: isLoading,
    collectionError: error,
  };
}

//Hook for getting pixelcon indexes made by a creator
export function useCreatorPixelcons(address: string) {
  const {data, error, isLoading} = useSWR<number[]>(
    `creatorPixelcons/${address}`,
    async () => {
      //await (new Promise(r => setTimeout(r, 1000)));//TODO/////////////////////////////
      //throw new Error("wtf");//TODO/////////////////////////////
      return await getCreatorPixelcons(address);
    },
    swrDataConfig,
  );

  return {
    creatorPixelcons: data,
    creatorLoading: isLoading,
    creatorError: error,
  };
}

//Hook for getting pixelcon indexes owned by an owner
export function useOwnerPixelcons(address: string) {
  const {data, error, isLoading} = useSWR<number[]>(
    `ownerPixelcons/${address}`,
    async () => {
      //await (new Promise(r => setTimeout(r, 1000)));//TODO/////////////////////////////
      //throw new Error("wtf");//TODO/////////////////////////////
      return await getOwnerPixelcons(address);
    },
    swrDataConfig,
  );

  return {
    ownerPixelcons: data,
    ownerLoading: isLoading,
    ownerError: error,
  };
}

/////////////////////////////
// Internal Util Functions //
/////////////////////////////

//Gets the pixelcon contract connected to a provider
async function getPixelconContract(): Promise<Contract> {
  const provider = await getProvider();
  return new Contract(pixelconsAddress, pixelconsABI, provider);
}

//Gets a useable provider
async function getProvider(): Promise<Provider> {
  //check if the provider has already been cached
  if (providerCache.provider) {
    return providerCache.provider;
  }

  //try to use embedded providers (making sure they're on the right network)
  try {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const browserWindow = window as any;
    if (browserWindow.ethereum) {
      const provider = new BrowserProvider(browserWindow.ethereum);
      const {chainId} = await provider.getNetwork();
      //verify correct network
      if (pixelconsChainId == Number(chainId)) {
        console.log('Using injected provider');
        providerCache.provider = provider;
        return provider;
      }
    }
    if (browserWindow.web3) {
      const provider = new BrowserProvider(browserWindow.web3);
      const {chainId} = await provider.getNetwork();
      //verify correct network
      if (pixelconsChainId == Number(chainId)) {
        console.log('Using injected provider');
        providerCache.provider = provider;
        return provider;
      }
    }
  } catch (e) {
    //do nothing
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

  //try to use fallback api provider for frontend (verify running)
  try {
    if (buildConfig.EXPOSE_RPC && typeof window === 'object') {
      const startPath = window.location.href.indexOf('/', window.location.href.indexOf('://') + 3);
      const domain = startPath > 0 ? window.location.href.substring(0, startPath) : window.location.href;
      const provider = new JsonRpcProvider(`${domain}/rpc`);
      const {chainId} = await provider.getNetwork();
      //verify correct network
      if (pixelconsChainId == Number(chainId)) {
        console.log('Using exposed rpc provider');
        providerCache.provider = provider;
        return provider;
      }
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

//Helper function to get the pixelconIds of the corresponding pixelcon indexes
async function fetchPixelconIds(contract: Contract, indexes: number[]): Promise<string[]> {
  const pixelconIds: string[] = [];
  pixelconIds.length = indexes.length;

  //fill in as many ids from the static list as possible
  const remainingIndexes: number[] = [];
  for (let i = 0; i < indexes.length; i++) {
    const pixelconIndex = indexes[i];
    if (pixelconIndex < staticPixelconIds.length) {
      pixelconIds[i] = staticPixelconIds[pixelconIndex];
    } else {
      remainingIndexes.push(pixelconIndex);
    }
  }

  //query for any remaining ids
  if (remainingIndexes.length > 0) {
    const pixelconsRaw = await contract.getBasicData(remainingIndexes);
    let fillIndex: number = 0;
    for (let i = 0; i < pixelconIds.length; i++) {
      if (pixelconIds[i] === undefined) {
        pixelconIds[i] = to256Hex(pixelconsRaw[0][fillIndex]);
        fillIndex++;
      }
    }
  }

  return pixelconIds;
}

//Helper function to fetch multiple pixelcons in parallel
async function fetchPixelconsInParallel(contract: Contract, indexes: number[]): Promise<Pixelcon[]> {
  await getProvider();
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const queries: Promise<any>[] = [];
  for (let i = 0; i < indexes.length; i++) {
    queries.push(contract.getTokenDataByIndex(indexes[i]));
  }

  const pixelcons: Pixelcon[] = [];
  for (let i = 0; i < indexes.length; i++) {
    pixelcons[i] = decodeAsPixelcon(await queries[i]);
  }
  return pixelcons;
}

//Helper function to fetch multiple batches of pixelconIds in parallel
async function getPixelconIdsInParallel(contract: Contract, indexRanges: number[][]): Promise<string[]> {
  await getProvider();
  const queries: Promise<string[]>[] = [];
  for (let i = 0; i < indexRanges.length; i++) {
    const indexes: number[] = [];
    for (let j = indexRanges[i][0]; j < indexRanges[i][1]; j++) indexes.push(j);
    queries.push(fetchPixelconIds(contract, indexes));
  }

  const pixelconIds: string[] = [];
  for (let i = 0; i < indexRanges.length; i++) {
    try {
      const ids: string[] = await queries[i];
      pixelconIds.push(...ids);
    } catch (e) {
      for (let j = indexRanges[i][0]; j < indexRanges[i][1]; j++) pixelconIds.push(undefined);
    }
  }
  return pixelconIds;
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
  return null;
}
