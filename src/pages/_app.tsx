import React from 'react';
import {AppProps} from 'next/app';
import {Web3ReactProvider} from '@web3-react/core';
import '../styles/global.scss';

import {prioritizedConnectors} from '../lib/web3';

export default function App({Component, pageProps}: AppProps) {
  return (
    <Web3ReactProvider
      connectors={Object.values(prioritizedConnectors).map((connector) => [connector.connector, connector.hooks])}
    >
      <Component {...pageProps} />
    </Web3ReactProvider>
  );
}
