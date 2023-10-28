import {initializeConnector, Web3ReactHooks} from '@web3-react/core';
import {Connector} from '@web3-react/types';
import {MetaMask} from '@web3-react/metamask';
import {WalletConnect} from '@web3-react/walletconnect';
import {CoinbaseWallet} from '@web3-react/coinbase-wallet';
import useSWR from 'swr';
import {JsonRpcSigner} from 'ethers';
import {toAddress} from './utils';
import {getUserName} from './pixelcons';
import buildConfig from '../build.config';
import deployments from '../../archive/contracts/deployments.json' assert {type: 'json'};

//Data constants
const mainnetChainId = 1;
const pixelconsChainId = buildConfig.OVERRIDE_CHAIN_ID || parseInt(deployments.mainnet.chainId);
const maxPendingTime = 24 * 60 * 60 * 1000;
const createLocalStorageKey = 'pending_creates';
const createCollectionLocalStorageKey = 'pending_collection_creates';
const ensLocalLocalStorageExp = 4 * 60 * 60 * 1000;
const ensLocalLocalStorageKey = 'ens_names';
const swrDataConfig = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

//Data types
export enum ConnectionType {
  COINBASE_WALLET = 'COINBASE_WALLET',
  INJECTED = 'INJECTED',
  WALLET_CONNECT = 'WALLET_CONNECT',
}
export interface Connection {
  connector: Connector;
  hooks: Web3ReactHooks;
  type: ConnectionType;
  active: boolean;
}

//Main list of supported connectors and their priorities
export const prioritizedConnectors: {[key in ConnectionType]: Connection} = {
  [ConnectionType.INJECTED]: buildInjectedConnector(),
  [ConnectionType.COINBASE_WALLET]: buildCoinbaseWalletConnector(),
  [ConnectionType.WALLET_CONNECT]: buildWalletConnectConnector(),
};

//Tries to activate a given connector
export async function activateConnector(type: ConnectionType): Promise<ConnectionType | undefined> {
  const connection = getConnection(type);
  if (pixelconsChainId == mainnetChainId) {
    await connection.connector.activate(mainnetChainId);
  } else {
    await connection.connector.activate();
  }

  connection.active = true;
  return connection.type;
}

//Tries to deactivate a given connector
export async function deactivateConnector(): Promise<null | undefined> {
  for (const connection of Object.values(prioritizedConnectors)) {
    if (connection.active) {
      connection.connector.deactivate?.();
      connection.connector.resetState();

      connection.active = false;
      return null;
    }
  }

  return undefined;
}

//Switch network
export async function checkNetwork(): Promise<boolean> {
  if (pixelconsChainId == mainnetChainId) {
    for (const connection of Object.values(prioritizedConnectors)) {
      if (connection.active) {
        try {
          await connection.connector.activate(mainnetChainId);
        } catch (e) {
          return false;
        }
        return true;
      }
    }
    return false;
  }
  return true;
}

//Gets an ethers compatible signer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSigner(provider: any) {
  return provider.getSigner() as JsonRpcSigner;
}

//////////////
// ENS Hook //
//////////////

//Hook for getting collection name
export function useENS(address: string) {
  address = toAddress(address);
  const cachedName = getENSLocal(address);

  const {data, error, isLoading} = useSWR<string>(
    `ens/${address}`,
    async () => {
      try {
        if (address === null) return null;
        if (address === undefined) return undefined;
        if (cachedName !== null) return cachedName;

        const collectionName = await getUserName(address);
        if (collectionName === undefined && address !== undefined) {
          throw new Error('Something went wrong during getUserName query');
        }

        //add to local storage cache
        if (typeof window !== 'undefined' && localStorage) {
          const timestamp = new Date().getTime();
          const collectionNames = JSON.parse(localStorage.getItem(ensLocalLocalStorageKey) || '[]');
          collectionNames.push({
            address: address,
            name: collectionName,
            time: timestamp,
          });
          localStorage.setItem(ensLocalLocalStorageKey, JSON.stringify(collectionNames));
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
    name: data || address,
    nameLoading: isLoading || (data === undefined && address !== undefined && !error),
    nameError: error,
  };
}

//////////////////////////
// Pending Tx Functions //
//////////////////////////

//Checks if the same pixelconId has already tried to be created
export function checkPendingCreate(pixelconId: string, forceClear = false): boolean {
  if (typeof window !== 'undefined' && localStorage) {
    const timestamp = new Date().getTime();
    const pendingItems = JSON.parse(localStorage.getItem(createLocalStorageKey) || '[]');
    let stillPending = false;
    for (let i = pendingItems.length - 1; i >= 0; i--) {
      if (timestamp >= pendingItems[i].time + maxPendingTime) {
        pendingItems.splice(i, 1); //item expired
      } else if (pendingItems[i].id == pixelconId) {
        if (forceClear) pendingItems.splice(i, 1); //force clear
        stillPending = true; //item not expired and matches pixelconId
      }
    }
    if (!stillPending) {
      pendingItems.push({
        id: pixelconId,
        time: timestamp,
      });
    }
    localStorage.setItem(createLocalStorageKey, JSON.stringify(pendingItems));
    return stillPending;
  }
  return false;
}

//Checks if the same pixelcon indexes have already tried to be grouped
export function checkPendingCreateCollection(pixelconIndexes: number[], forceClear = false): boolean {
  if (typeof window !== 'undefined' && localStorage) {
    const timestamp = new Date().getTime();
    const pendingItems = JSON.parse(localStorage.getItem(createCollectionLocalStorageKey) || '[]');
    let stillPending = false;
    for (let i = pendingItems.length - 1; i >= 0; i--) {
      if (timestamp >= pendingItems[i].time + maxPendingTime) {
        pendingItems.splice(i, 1); //item expired
      } else {
        let fullOverlap = true;
        for (const index of pendingItems[i].indexes) {
          if (pixelconIndexes.includes(index)) stillPending = true; //item not expired and matches pixelconId
          else fullOverlap = false;
        }
        if (fullOverlap && forceClear) pendingItems.splice(i, 1); //force clear
      }
    }
    if (!stillPending) {
      pendingItems.push({
        indexes: pixelconIndexes,
        time: timestamp,
      });
    }
    localStorage.setItem(createCollectionLocalStorageKey, JSON.stringify(pendingItems));
    return stillPending;
  }
  return false;
}

///////////////////////////////
// Connector Build Functions //
///////////////////////////////

//Injected connector
function buildInjectedConnector() {
  const [web3MetamaskWallet, web3MetamaskWalletHooks] = initializeConnector<MetaMask>(
    (actions) => new MetaMask({actions, onError: onConnectionError}),
  );
  const injectedConnection: Connection = {
    connector: web3MetamaskWallet,
    hooks: web3MetamaskWalletHooks,
    type: ConnectionType.INJECTED,
    active: false,
  };

  return injectedConnection;
}

//Wallet connect connector
function buildWalletConnectConnector() {
  const [web3WalletConnect, web3WalletConnectHooks] = initializeConnector<WalletConnect>(
    (actions) =>
      new WalletConnect({
        actions,
        options: {
          rpc: {
            [pixelconsChainId]: getDefaultRPC(),
          },
          qrcode: true,
        },
        onError: onConnectionError,
      }),
  );
  const walletConnectConnection: Connection = {
    connector: web3WalletConnect,
    hooks: web3WalletConnectHooks,
    type: ConnectionType.WALLET_CONNECT,
    active: false,
  };
  return walletConnectConnection;
}

//Coinbase wallet connector
function buildCoinbaseWalletConnector() {
  const [web3CoinbaseWallet, web3CoinbaseWalletHooks] = initializeConnector<CoinbaseWallet>(
    (actions) =>
      new CoinbaseWallet({
        actions,
        options: {
          appName: 'PixelCons',
          url: getDefaultRPC(),
          reloadOnDisconnect: false,
        },
        onError: onConnectionError,
      }),
  );
  const coinbaseWalletConnection: Connection = {
    connector: web3CoinbaseWallet,
    hooks: web3CoinbaseWalletHooks,
    type: ConnectionType.COINBASE_WALLET,
    active: false,
  };

  return coinbaseWalletConnection;
}

//////////////////////
// Helper Functions //
//////////////////////

//Gets the connection interface from a connector or type
function getConnection(c: Connector | ConnectionType): Connection {
  if (c instanceof Connector) {
    const connection = Object.values(prioritizedConnectors).find((connection) => connection.connector === c);
    if (!connection) {
      throw Error('Unsupported Connector');
    }
    return connection;
  } else {
    switch (c) {
      case ConnectionType.INJECTED:
        return prioritizedConnectors[ConnectionType.INJECTED];
      case ConnectionType.COINBASE_WALLET:
        return prioritizedConnectors[ConnectionType.COINBASE_WALLET];
      case ConnectionType.WALLET_CONNECT:
        return prioritizedConnectors[ConnectionType.WALLET_CONNECT];
    }
  }
}

//Simple generic error handler
function onConnectionError(error: Error) {
  console.debug(`web3-react error: ${error}`);
}

//Gets a default rpc endpoint to use
function getDefaultRPC(): string {
  if (buildConfig.EXPOSE_RPC && typeof window === 'object') {
    const startPath = window.location.href.indexOf('/', window.location.href.indexOf('://') + 3);
    const domain = startPath > 0 ? window.location.href.substring(0, startPath) : window.location.href;
    return `${domain}/rpc`;
  }
  return '';
}

//Get ens name from local storage
function getENSLocal(address: string): string {
  if (address === null) return null;
  if (address === undefined) return undefined;

  let collectionName = null;
  if (typeof window !== 'undefined' && localStorage) {
    const timestamp = new Date().getTime();
    const collectionNames = JSON.parse(localStorage.getItem(ensLocalLocalStorageKey) || '[]');
    for (let i = collectionNames.length - 1; i >= 0; i--) {
      if (timestamp >= collectionNames[i].time + ensLocalLocalStorageExp) {
        collectionNames.splice(i, 1); //item expired
      } else if (collectionNames[i].address == address) {
        collectionName = collectionNames[i].name; //item not expired and matches address
      }
    }
  }
  return collectionName;
}
