import {ethers, Contract, Provider, BrowserProvider, JsonRpcProvider, JsonRpcSigner} from 'ethers';
import useSWR, {mutate} from 'swr';
import {to256Hex, toAddress, toUtf8, toBytes} from './utils';
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
const swrMutateConfig = {
  revalidate: true,
  populateCache: true,
  rollbackOnError: true,
  throwOnError: true,
};
const maxParallelQuery = buildConfig.DATA_FETCHING_MAX_PARALLEL_QUERY || 5;
const maxPixelconIdFetch = buildConfig.DATA_FETCHING_MAX_PIXELCON_IDS || 200;
const collectionNameLocalCacheKey = 'collection_names';
const collectionNameLocalCacheExp = 1 * 60 * 60 * 1000;

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

//Lite pixelcon object type
export type PixelconLite = {
  id: string;
  index: number;
  name: string;
  owner: string;
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
    try {
      const pixelconRaw = await contract.getTokenData(pixelconId);
      return decodeAsPixelcon(pixelconRaw);
    } catch (e) {
      //pixelcon does not exist
      if (e && e.reason && e.reason == 'PixelCon does not exist') return null;
      throw e;
    }
  } catch (e) {
    return undefined;
  }
}

//Get the id of the pixelcon at the given index
export async function getPixelconId(pixelconIndex: string | number): Promise<string> {
  if (pixelconIndex === null) return null;
  if (pixelconIndex === undefined) return undefined;
  pixelconIndex = parseInt(pixelconIndex.toString());
  const contract = await getPixelconContract();

  try {
    try {
      const ids = await fetchPixelconIds(contract, [pixelconIndex]);
      return ids[0];
    } catch (e) {
      //pixelcon does not exist
      if (e && e.reason && e.reason == 'PixelCon does not exist') return null;
      throw e;
    }
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
      //collection does not exist
      if (e && e.reason && e.reason == 'Collection does not exist') return null;
      throw e;
    }
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

//Get lite details for the given pixelcon indexes
export async function getLitePixelcons(indexes: number[]): Promise<PixelconLite[]> {
  if (indexes === null) return null;
  if (indexes === undefined) return undefined;
  if (indexes.length == 0) return [];
  const contract = await getPixelconContract();

  try {
    return await fetchLitePixelconsInParallel(contract, indexes);
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

    const indexes: number[] = [];
    for (let i = startIndex; i < endIndex; i++) indexes.push(i);
    return await fetchPixelconsInParallel(contract, indexes);
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
      const indexes: number[] = [];
      for (let i = startIndex; i < endIndex; i++) indexes.push(i);
      const pixelconIds: string[] = await fetchPixelconIdsInParallel(contract, indexes);
      allPixelconIds.push(...pixelconIds);
    }
    return allPixelconIds;
  } catch (e) {
    return undefined;
  }
}

//Get the ens name of a pixelcons user
export async function getUserName(address: string): Promise<string> {
  if (address === null) return null;
  if (address === undefined) return undefined;
  address = toAddress(address);
  const provider = await getProvider();

  try {
    const name = await provider.lookupAddress(address);
    return name;
  } catch (e) {
    return undefined;
  }
}

//Get all currently archived pixelconIds
export function getAllPixelconIdsStatic(): string[] {
  return staticPixelconIds;
}

///////////////////////////////////////////////
// Persistent Functions for Pixelcon Actions //
///////////////////////////////////////////////

//Create a pixelcon
export async function createPixelcon(
  signer: JsonRpcSigner,
  to: string,
  tokenId: string,
  name?: string,
): Promise<Pixelcon> {
  if (tokenId === null) return null;
  if (tokenId === undefined) return undefined;
  tokenId = to256Hex(tokenId);
  const contract = await getPixelconContract(signer);

  try {
    await contract.create(to, tokenId, toBytes(name, 8));
    const pixelcon = await waitForPixelconCreate(tokenId);

    //update cached data
    await mutate('allPixelconIds', undefined, swrMutateConfig);
    await mutate(`pixelcon/${tokenId}`, undefined, swrMutateConfig);
    await mutate(`groupablePixelcons/${pixelcon.creator}`, undefined, swrMutateConfig);
    await mutate(`creatorPixelcons/${pixelcon.creator}`, undefined, swrMutateConfig);
    await mutate(`ownerPixelcons/${pixelcon.owner}`, undefined, swrMutateConfig);

    return pixelcon;
  } catch (e) {
    return undefined;
  }
}

//Create a collection
export async function createCollection(
  signer: JsonRpcSigner,
  creator: string,
  tokenIndexes: number[],
  name?: string,
): Promise<Collection> {
  if (tokenIndexes === null) return null;
  if (tokenIndexes === undefined) return undefined;
  const contract = await getPixelconContract(signer);

  try {
    const collectionIndex: number = await contract.totalCollections();
    await contract.createCollection(tokenIndexes, toBytes(name, 8));
    const collection = await waitForCollectionCreate(collectionIndex);

    //update cached data
    await mutate(`collection/${collectionIndex}`, undefined, swrMutateConfig);
    await mutate(`collectionPixelcons/${collectionIndex}`, undefined, swrMutateConfig);
    await mutate(`groupablePixelcons/${creator}`, undefined, swrMutateConfig);
    for (const pixelconId of collection.pixelconIds) {
      await mutate(`pixelcon/${pixelconId}`, undefined, swrMutateConfig);
    }

    return collection;
  } catch (e) {
    return undefined;
  }
}

///////////////////////////////////
// React Hooks for Pixelcon Data //
///////////////////////////////////

//Hook for getting pixelcon details
export function usePixelcon(pixelconId: string) {
  const {data, error, isLoading} = useSWR<Pixelcon>(
    `pixelcon/${pixelconId}`,
    async () => {
      try {
        const pixelcon = await getPixelcon(pixelconId);
        if (pixelcon === undefined && pixelconId !== undefined) {
          throw new Error('Something went wrong during getPixelcon query');
        }
        return pixelcon;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    swrDataConfig,
  );

  return {
    pixelcon: data,
    pixelconLoading: isLoading || (data === undefined && pixelconId !== undefined && !error),
    pixelconError: error,
  };
}

//Hook for getting collection details
export function useCollection(collectionIndex: string | number) {
  const {data, error, isLoading} = useSWR<Collection>(
    `collection/${collectionIndex}`,
    async () => {
      try {
        const collection = await getCollection(collectionIndex);
        if (collection === undefined && collectionIndex !== undefined) {
          throw new Error('Something went wrong during getCollection query');
        }
        return collection;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    swrDataConfig,
  );

  return {
    collection: data,
    collectionLoading: isLoading || (data === undefined && collectionIndex !== undefined && !error),
    collectionError: error,
  };
}

//Hook for getting all pixelconIds
export function useAllPixelconIds() {
  const {data, error, isLoading} = useSWR<string[]>(
    'allPixelconIds',
    async () => {
      try {
        const allPixelconIds = await getAllPixelconIds();
        if (allPixelconIds === undefined) {
          throw new Error('Something went wrong during getAllPixelconIds query');
        }
        return allPixelconIds;
      } catch (e) {
        console.error(e);
        throw e;
      }
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
      try {
        const collectionPixelcons = await getCollectionPixelcons(collectionIndex);
        if (collectionPixelcons === undefined && collectionIndex !== undefined) {
          throw new Error('Something went wrong during getCollectionPixelcons query');
        }
        return collectionPixelcons;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    swrDataConfig,
  );

  return {
    collectionPixelcons: data,
    collectionLoading: isLoading || (data === undefined && collectionIndex !== undefined && !error),
    collectionError: error,
  };
}

//Hook for getting pixelcon indexes made by a creator
export function useCreatorPixelcons(address: string) {
  const {data, error, isLoading} = useSWR<number[]>(
    `creatorPixelcons/${address}`,
    async () => {
      try {
        const creatorPixelcons = await getCreatorPixelcons(address);
        if (creatorPixelcons === undefined && address !== undefined) {
          throw new Error('Something went wrong during getCreatorPixelcons query');
        }
        return creatorPixelcons;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    swrDataConfig,
  );

  return {
    creatorPixelcons: data,
    creatorLoading: isLoading || (data === undefined && address !== undefined && !error),
    creatorError: error,
  };
}

//Hook for getting pixelcon indexes owned by an owner
export function useOwnerPixelcons(address: string) {
  const {data, error, isLoading} = useSWR<number[]>(
    `ownerPixelcons/${address}`,
    async () => {
      try {
        const ownerPixelcons = await getOwnerPixelcons(address);
        if (ownerPixelcons === undefined && address !== undefined) {
          throw new Error('Something went wrong during getOwnerPixelcons query');
        }
        return ownerPixelcons;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    swrDataConfig,
  );

  return {
    ownerPixelcons: data,
    ownerLoading: isLoading || (data === undefined && address !== undefined && !error),
    ownerError: error,
  };
}

//Hook for getting pixelcon indexes owned by an owner
export function useGroupablePixelcons(address: string) {
  const {data, error, isLoading} = useSWR<PixelconLite[]>(
    `groupablePixelcons/${address}`,
    async () => {
      try {
        if (address === null) return null;
        if (address === undefined) return undefined;

        const creatorPixelconsQuery = getCreatorPixelcons(address);
        const ownerPixelconsQuery = getOwnerPixelcons(address);
        const creatorPixelcons = await creatorPixelconsQuery;
        if (creatorPixelcons === undefined && address !== undefined) {
          throw new Error('Something went wrong during getCreatorPixelcons query');
        }
        const ownerPixelcons = await ownerPixelconsQuery;
        if (ownerPixelcons === undefined && address !== undefined) {
          throw new Error('Something went wrong during getOwnerPixelcons query');
        }

        //get combined creator and owner indexes
        const creatorOwnerIndexes: number[] = [];
        for (const creatorPixelcon of creatorPixelcons) {
          if (ownerPixelcons.includes(creatorPixelcon)) {
            creatorOwnerIndexes.push(creatorPixelcon);
          }
        }
        const litePixelcons = await getLitePixelcons(creatorOwnerIndexes);
        if (litePixelcons === undefined && address !== undefined) {
          throw new Error('Something went wrong during getLitePixelcons query');
        }

        //only return pixelcons not already in a group
        const filteredLitePixelcons: PixelconLite[] = [];
        for (const litePixelcon of litePixelcons) {
          if (litePixelcon.collection === null) filteredLitePixelcons.push(litePixelcon);
        }
        return filteredLitePixelcons;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    swrDataConfig,
  );

  return {
    groupablePixelcons: data,
    groupableLoading: isLoading || (data === undefined && address !== undefined && !error),
    groupableError: error,
  };
}

//Hook for getting collection name
export function useCollectionName(collectionIndex: string | number) {
  const cachedName = getCollectionNameLocal(collectionIndex);
  const {data, error, isLoading} = useSWR<string>(
    `collectionName/${collectionIndex}`,
    async () => {
      try {
        if (collectionIndex === null) return null;
        if (collectionIndex === undefined) return undefined;

        if (cachedName !== null) return cachedName;

        const collectionName = await getCollectionName(collectionIndex);
        if (collectionName === undefined && collectionIndex !== undefined) {
          throw new Error('Something went wrong during getCollectionName query');
        }

        //add to local storage cache
        if (typeof window !== 'undefined' && localStorage) {
          const timestamp = new Date().getTime();
          const collectionNames = JSON.parse(localStorage.getItem(collectionNameLocalCacheKey) || '[]');
          collectionNames.push({
            index: collectionIndex,
            name: collectionName,
            time: timestamp,
          });
          localStorage.setItem(collectionNameLocalCacheKey, JSON.stringify(collectionNames));
        }

        return collectionName;
      } catch (e) {
        console.error(e);
        throw e;
      }
    },
    swrDataConfig,
  );

  return {
    collectionName: data || collectionIndex,
    collectionNameLoading: isLoading || (data === undefined && collectionIndex !== undefined && !error),
    collectionNameError: error,
  };
}

/////////////////////////////
// Internal Util Functions //
/////////////////////////////

//Gets the pixelcon contract connected to a provider
async function getPixelconContract(signer?: JsonRpcSigner): Promise<Contract> {
  return new Contract(pixelconsAddress, pixelconsABI, signer ? signer : await getProvider());
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
    } else if (browserWindow.web3) {
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

//Helper function to wait for a pixelcon to be created
async function waitForPixelconCreate(pixelconId: string, pollTime = 2000): Promise<Pixelcon> {
  return new Promise((resolve) => {
    const poll = async () => {
      const pixelcon = await getPixelcon(pixelconId);
      if (pixelcon) resolve(pixelcon);
      else setTimeout(poll, pollTime);
    };
    setTimeout(poll, pollTime);
  });
}

//Helper function to wait for a collection to be created
async function waitForCollectionCreate(collectionIndex: number, pollTime = 2000): Promise<Collection> {
  return new Promise((resolve) => {
    const poll = async () => {
      const collection = await getCollection(collectionIndex);
      if (collection) resolve(collection);
      else setTimeout(poll, pollTime);
    };
    setTimeout(poll, pollTime);
  });
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

//Helper function to get the pixelcon lite objects of the corresponding pixelcon indexes
async function fetchLitePixelcons(contract: Contract, indexes: number[]): Promise<PixelconLite[]> {
  const pixelcons: PixelconLite[] = [];
  if (indexes.length > 0) {
    pixelcons.length = indexes.length;
    const pixelconsRaw = await contract.getBasicData(indexes);
    for (let i = 0; i < indexes.length; i++) {
      pixelcons[i] = {
        id: to256Hex(pixelconsRaw[0][i]),
        index: indexes[i],
        name: toUtf8(pixelconsRaw[1][i]),
        owner: toAddress(pixelconsRaw[2][i]),
        collection: parseInt(pixelconsRaw[3][i].toString()) ? parseInt(pixelconsRaw[3][i].toString()) : null,
      };
    }
  }
  return pixelcons;
}

//Helper function to fetch multiple pixelcons in parallel
async function fetchPixelconsInParallel(contract: Contract, indexes: number[]): Promise<Pixelcon[]> {
  await getProvider();
  const fetchSegment = async (subIndexes: number[]) => {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queries: Promise<any>[] = [];
    for (let i = 0; i < subIndexes.length; i++) {
      queries.push(contract.getTokenDataByIndex(subIndexes[i]));
    }

    const pixelcons: Pixelcon[] = [];
    for (let i = 0; i < subIndexes.length; i++) {
      pixelcons[i] = decodeAsPixelcon(await queries[i]);
    }
    return pixelcons;
  };

  //fetch in segments of at most 'maxParallelQuery' indexes
  const allPixelcons: Pixelcon[] = [];
  for (let i = 0; i < indexes.length; i += maxParallelQuery) {
    const subIndexes: number[] = [];
    for (let j = 0; j < maxParallelQuery; j++) {
      if (i + j < indexes.length) subIndexes.push(indexes[i + j]);
      else break;
    }

    const pixelcons: Pixelcon[] = await fetchSegment(subIndexes);
    allPixelcons.push(...pixelcons);
  }
  return allPixelcons;
}

//Helper function to fetch multiple pixelconIds in parallel
async function fetchPixelconIdsInParallel(contract: Contract, indexes: number[]): Promise<string[]> {
  await getProvider();
  const fetchSegment = async (subIndexBatches: number[][]) => {
    const queries: Promise<string[]>[] = [];
    for (let i = 0; i < subIndexBatches.length; i++) {
      queries.push(fetchPixelconIds(contract, subIndexBatches[i]));
    }

    const combinedPixelconIds: string[] = [];
    for (let i = 0; i < subIndexBatches.length; i++) {
      try {
        const pixelconIds: string[] = await queries[i];
        combinedPixelconIds.push(...pixelconIds);
      } catch (e) {
        for (let j = 0; j < subIndexBatches[i].length; j++) combinedPixelconIds.push(undefined);
      }
    }
    return combinedPixelconIds;
  };

  //break indexes into batches of at most 'maxPixelconIdFetch' ids
  const indexBatches: number[][] = [];
  for (let i = 0; i < indexes.length; i += maxPixelconIdFetch) {
    const indexBatch: number[] = [];
    for (let j = 0; j < maxPixelconIdFetch; j++) {
      if (i + j < indexes.length) indexBatch.push(indexes[i + j]);
      else break;
    }
    indexBatches.push(indexBatch);
  }

  //fetch in segments of at most 'maxParallelQuery' indexBatches
  const allPixelconIds: string[] = [];
  for (let i = 0; i < indexBatches.length; i += maxParallelQuery) {
    const subIndexBatches: number[][] = [];
    for (let j = 0; j < maxParallelQuery; j++) {
      if (i + j < indexBatches.length) subIndexBatches.push(indexBatches[i + j]);
      else break;
    }

    const pixelconIds: string[] = await fetchSegment(subIndexBatches);
    allPixelconIds.push(...pixelconIds);
  }
  return allPixelconIds;
}

//Helper function to fetch multiple lite pixelcons in parallel
async function fetchLitePixelconsInParallel(contract: Contract, indexes: number[]): Promise<PixelconLite[]> {
  await getProvider();
  const fetchSegment = async (subIndexBatches: number[][]) => {
    const queries: Promise<PixelconLite[]>[] = [];
    for (let i = 0; i < subIndexBatches.length; i++) {
      queries.push(fetchLitePixelcons(contract, subIndexBatches[i]));
    }

    const combinedLitePixelcons: PixelconLite[] = [];
    for (let i = 0; i < subIndexBatches.length; i++) {
      try {
        const litePixelcons: PixelconLite[] = await queries[i];
        combinedLitePixelcons.push(...litePixelcons);
      } catch (e) {
        for (let j = 0; j < subIndexBatches[i].length; j++) combinedLitePixelcons.push(undefined);
      }
    }
    return combinedLitePixelcons;
  };

  //break indexes into batches of at most 'maxPixelconIdFetch' ids
  const indexBatches: number[][] = [];
  for (let i = 0; i < indexes.length; i += maxPixelconIdFetch) {
    const indexBatch: number[] = [];
    for (let j = 0; j < maxPixelconIdFetch; j++) {
      if (i + j < indexes.length) indexBatch.push(indexes[i + j]);
      else break;
    }
    indexBatches.push(indexBatch);
  }

  //fetch in segments of at most 'maxParallelQuery' indexBatches
  const allLitePixelcons: PixelconLite[] = [];
  for (let i = 0; i < indexBatches.length; i += maxParallelQuery) {
    const subIndexBatches: number[][] = [];
    for (let j = 0; j < maxParallelQuery; j++) {
      if (i + j < indexBatches.length) subIndexBatches.push(indexBatches[i + j]);
      else break;
    }

    const litePixelcons: PixelconLite[] = await fetchSegment(subIndexBatches);
    allLitePixelcons.push(...litePixelcons);
  }
  return allLitePixelcons;
}

//Get collection name from local storage
function getCollectionNameLocal(collectionIndex: string | number): string {
  if (collectionIndex === null) return null;
  if (collectionIndex === undefined) return undefined;
  collectionIndex = collectionIndex.toString();

  let collectionName = null;
  if (typeof window !== 'undefined' && localStorage) {
    const timestamp = new Date().getTime();
    const collectionNames = JSON.parse(localStorage.getItem(collectionNameLocalCacheKey) || '[]');
    for (let i = collectionNames.length - 1; i >= 0; i--) {
      if (timestamp >= collectionNames[i].time + collectionNameLocalCacheExp) {
        collectionNames.splice(i, 1); //item expired
      } else if (collectionNames[i].index == collectionIndex) {
        collectionName = collectionNames[i].name; //item not expired and matches index
      }
    }
  }
  return collectionName;
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
