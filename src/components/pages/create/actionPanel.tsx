import React from 'react';
import clsx from 'clsx';
import styles from './actionPanel.module.scss';
import textStyles from '../../../styles/text.module.scss';
import utilStyles from '../../../styles/utils.module.scss';

//Action panel component for overlaying create page and handling a web3 connection
export default function ActionPanel({onClose, children}: {onClose?: () => void; children?: React.ReactNode}) {
  //render
  return (
    <div className={styles.container}>
      <span className={clsx(styles.header, textStyles.notSelectable)}>
        <div className={clsx(styles.close, utilStyles.icon, utilStyles.clickable)} onClick={onClose}></div>
        <div className={clsx(styles.connect, utilStyles.clickable)}>
          <div></div>Connect to Web3
        </div>
      </span>
      {children}
    </div>
  );
}
