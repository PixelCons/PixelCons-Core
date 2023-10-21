import React, {useState, useEffect, useRef} from 'react';
import clsx from 'clsx';
import {ConnectionType, activateConnector} from '../../lib/web3';
import styles from './web3Connector.module.scss';
import utilStyles from '../../styles/utils.module.scss';

//Constants
const metamaskURL = 'https://metamask.io/';

//Connector component for connecting to a web3 client
export default function Web3Connector({
  visible,
  onClose = null,
  onActivate = null,
}: {
  visible: boolean;
  onClose?: () => void;
  onActivate?: (connectionType: ConnectionType) => void;
}) {
  const mountedRef = useRef(false);

  //check for metamask extension
  const [hasMetaMaskExtension, setHasMetaMaskExtension] = useState(false);
  useEffect(() => {
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    const browserWindow = window as any;
    const isBraveWallet = browserWindow.ethereum?.isBraveWallet ?? false;
    const isMetaMask = browserWindow.ethereum?.isMetaMask ?? false;
    setHasMetaMaskExtension(isMetaMask && !isBraveWallet);
  }, []);

  //animation delays for open/close
  const animationTime = 0.15 * 1000;
  const [startClose, setStartClose] = useState(true);
  const close = () => setStartClose(true);
  useEffect(() => {
    if (mountedRef.current && startClose) {
      const animationTimer = setTimeout(() => {
        if (onClose) onClose();
      }, animationTime);
      return () => clearTimeout(animationTimer);
    }
  }, [startClose]);
  useEffect(() => {
    if (visible) setStartClose(false);
  }, [visible]);

  //option click
  const optionClick = async (type: ConnectionType) => {
    try {
      const activation = await activateConnector(type);
      if (activation) {
        setStartClose(true);
        if (onActivate) onActivate(activation);
      }
    } catch (e) {
      //do nothing
    }
  };

  //keep track of mounting
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  //render
  if (!visible) return null;
  return (
    <div className={clsx(styles.background, !startClose && styles.visible)} onClick={close}>
      <div className={styles.modal} onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        <div className={styles.header}>
          <span>Select Wallet</span>
          <div className={clsx(styles.close, utilStyles.clickable)} onClick={close}></div>
        </div>
        {!hasMetaMaskExtension && (
          <a className={styles.option} href={metamaskURL}>
            <div className={clsx(styles.icon, styles.metamask)}></div>
            <span>Install MetaMask</span>
          </a>
        )}
        {hasMetaMaskExtension && (
          <div
            className={clsx(styles.option, utilStyles.clickable)}
            onClick={async () => optionClick(ConnectionType.INJECTED)}
          >
            <div className={clsx(styles.icon, styles.metamask)}></div>
            <span>MetaMask</span>
          </div>
        )}
        <div
          className={clsx(styles.option, utilStyles.clickable)}
          onClick={async () => optionClick(ConnectionType.WALLET_CONNECT)}
        >
          <div className={clsx(styles.icon, styles.walletconnect)}></div>
          <span>WalletConnect</span>
        </div>
        <div
          className={clsx(styles.option, utilStyles.clickable)}
          onClick={async () => optionClick(ConnectionType.COINBASE_WALLET)}
        >
          <div className={clsx(styles.icon, styles.coinbasewallet)}></div>
          <span>Coinbase Wallet</span>
        </div>
      </div>
    </div>
  );
}
