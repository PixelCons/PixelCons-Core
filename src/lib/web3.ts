import {initializeConnector, Web3ReactHooks} from '@web3-react/core';
import {Connector} from '@web3-react/types';
import {MetaMask} from '@web3-react/metamask';
import {WalletConnect} from '@web3-react/walletconnect';
import {CoinbaseWallet} from '@web3-react/coinbase-wallet';
import buildConfig from '../build.config';
import deployments from '../../archive/contracts/deployments.json' assert {type: 'json'};

//Data constants
const mainnetChainId = 1;
const pixelconsChainId = buildConfig.OVERRIDE_CHAIN_ID || parseInt(deployments.mainnet.chainId);

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
  return buildConfig.OVERRIDE_JSON_RPC || '';
}
