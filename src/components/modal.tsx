import React, {useState, useEffect, useRef} from 'react';
import clsx from 'clsx';
import styles from './modal.module.scss';
import utilStyles from '../styles/utils.module.scss';

//Connector component for connecting to a web3 client
export default function Web3Connector({
  visible,
  children,
  closable = true,
  showOk = false,
  showCancel = false,
  onClose = null,
}: {
  visible: boolean;
  children: React.ReactNode;
  closable?: boolean;
  showOk?: boolean;
  showCancel?: boolean;
  onClose?: (confirm?: boolean) => void;
}) {
  const mountedRef = useRef(false);
  const [confirmValue, setConfirmValue] = useState<boolean>(undefined);
  const close = (confirm?: boolean) => {
    if (closable) {
      setConfirmValue(confirm);
      setStartClose(true);
    }
  };

  //animation delays for open/close
  const animationTime = 0.15 * 1000;
  const [startClose, setStartClose] = useState(true);
  useEffect(() => {
    if (mountedRef.current && startClose) {
      const animationTimer = setTimeout(() => {
        if (onClose) onClose(confirmValue);
      }, animationTime);
      return () => clearTimeout(animationTimer);
    }
  }, [startClose]);
  useEffect(() => {
    if (visible) setStartClose(false);
  }, [visible]);

  //keep track of mounting
  useEffect(() => {
    mountedRef.current = true;
  }, []);

  //render
  if (!visible) return null;
  return (
    <div className={clsx(styles.background, !startClose && styles.visible)} onClick={() => close()}>
      <div className={styles.modal} onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
        <div>{children}</div>
        {showCancel && (
          <div className={clsx(styles.option, utilStyles.clickable)} onClick={() => close(false)}>
            <span>CANCEL</span>
          </div>
        )}
        {showOk && (
          <div className={clsx(styles.option, styles.primary, utilStyles.clickable)} onClick={() => close(true)}>
            <span>OK</span>
          </div>
        )}
      </div>
    </div>
  );
}
