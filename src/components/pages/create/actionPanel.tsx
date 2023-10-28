import React, {useState} from 'react';
import {useWeb3React} from '@web3-react/core';
import clsx from 'clsx';
import Web3Connector from '../../web3/web3Connector';
import {deactivateConnector} from '../../../lib/web3';
import {toAbbreviatedString} from '../../../lib/utils';
import styles from './actionPanel.module.scss';
import textStyles from '../../../styles/text.module.scss';
import utilStyles from '../../../styles/utils.module.scss';

//Action panel component for overlaying create page and handling a web3 connection
export default function ActionPanel({onClose, children}: {onClose?: () => void; children?: React.ReactNode}) {
  const {isActive, account} = useWeb3React();
  const [web3ConnectVisible, setWeb3ConnectVisible] = useState(false);

  //connector open and close functions
  const openWeb3Connect = () => setWeb3ConnectVisible(true);
  const closeWeb3Connect = () => setWeb3ConnectVisible(false);
  const disconnectWeb3 = async () => {
    try {
      await deactivateConnector();
    } catch (e) {
      //do nothing
    }
  };

  //render
  return (
    <div className={styles.container}>
      <span className={clsx(styles.header, textStyles.notSelectable)}>
        <div className={clsx(styles.close, utilStyles.icon, utilStyles.clickable)} onClick={onClose}></div>
        {!isActive && (
          <div className={clsx(styles.connect, utilStyles.clickable)} onClick={openWeb3Connect}>
            <div className={styles.red} />
            <span>Connect to Web3</span>
          </div>
        )}
        {isActive && (
          <div className={clsx(styles.connect, utilStyles.clickable)} onClick={disconnectWeb3}>
            <div className={styles.green} />
            <span className={styles.defaultText}>{`Connected: ${toAbbreviatedString(account)}`}</span>
            <span className={styles.hoverText}>
              <b>[Disconnect]</b>
              {` ${toAbbreviatedString(account)}`}
            </span>
          </div>
        )}
        <Web3Connector visible={web3ConnectVisible} onClose={closeWeb3Connect}></Web3Connector>
      </span>
      {children}
    </div>
  );
}
