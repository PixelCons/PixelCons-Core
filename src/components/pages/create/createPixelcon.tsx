import React, {useState} from 'react';
import {useWeb3React} from '@web3-react/core';
import clsx from 'clsx';
import Link from 'next/link';
import Dots from '../../dots';
import Modal from '../../modal';
import InputText from '../../inputText';
import {checkNetwork, getSigner, checkPendingCreate} from '../../../lib/web3';
import {useAllPixelconIds, usePixelcon, createPixelcon} from '../../../lib/pixelcons';
import {searchExact, searchPossibleDerivativeIndex, isDerivative} from '../../../lib/similarities';
import {generateIcon} from '../../../lib/imagedata';
import {numOr} from '../../../lib/utils';
import styles from './createPixelcon.module.scss';
import textStyles from '../../../styles/text.module.scss';
import utilStyles from '../../../styles/utils.module.scss';

//Create component for confirming the creation of a pixelcon
export default function CreatePixelcon({pixelconId, onCreate}: {pixelconId: string; onCreate?: () => void}) {
  const {account, provider} = useWeb3React();
  const accountAddress = account ? account.toLowerCase() : null;
  const [showCreating, setShowCreating] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [pixelconName, setPixelconName] = useState('');
  const {allPixelconIds, allPixelconIdsLoading, allPixelconIdsError} = useAllPixelconIds();
  const exactIndex = numOr(searchExact(pixelconId, allPixelconIds), -1);
  const possibleDerivativeIndex = numOr(searchPossibleDerivativeIndex(pixelconId, allPixelconIds), -1);
  const possibleDerivative = possibleDerivativeIndex > -1 ? allPixelconIds[possibleDerivativeIndex] : undefined;
  const {pixelcon, pixelconLoading, pixelconError} = usePixelcon(exactIndex > -1 ? undefined : possibleDerivative);
  const checkDerivative = isDerivative(
    pixelconId,
    accountAddress,
    pixelcon ? pixelcon.id : undefined,
    pixelcon ? pixelcon.creator : undefined,
  );
  const pleaseLogin: boolean = !accountAddress;
  const isLoading: boolean =
    !pleaseLogin && (allPixelconIdsLoading || allPixelconIdsError || pixelconLoading || pixelconError);
  const alreadyExists: boolean = !pleaseLogin && !isLoading && exactIndex > -1;
  const tooSimilar: boolean = !pleaseLogin && !isLoading && !alreadyExists && !!checkDerivative;
  const buttonClass = clsx(styles.button, utilStyles.textButton, textStyles.notSelectable);

  //create function
  const createClick = async () => {
    if (checkPendingCreate(pixelconId)) setShowWarning(true);
    else await create(true);
  };
  const create = async (confirm?: boolean) => {
    setShowWarning(false);
    if (confirm === true && (await checkNetwork())) {
      setShowCreating(true);

      const signer = getSigner(provider);
      await createPixelcon(signer, accountAddress, pixelconId, pixelconName);
      checkPendingCreate(pixelconId, true);
      setPixelconName('');
      setShowCreating(false);
      if (onCreate) onCreate();
    }
  };

  //render
  return (
    <>
      <div className={styles.title}>Create Pixelcon</div>
      {alreadyExists && (
        <Link href={`/details/${allPixelconIds[exactIndex]}`}>
          <div
            className={clsx(styles.preview, utilStyles.crispImage, alreadyExists)}
            style={{
              backgroundImage: `url(${generateIcon(pixelconId)})`,
            }}
          />
        </Link>
      )}
      {!alreadyExists && (
        <div
          className={clsx(styles.preview, utilStyles.crispImage, alreadyExists)}
          style={{
            backgroundImage: `url(${generateIcon(pixelconId)})`,
          }}
        />
      )}

      {/* show one of different display options */}
      {pleaseLogin && <div className={styles.connectText}>Connect Web3 account to continue</div>}
      {isLoading && <Dots />}
      {alreadyExists && (
        <>
          <div className={styles.existsNum}>{`#${exactIndex}`}</div>
          <div className={styles.existsText}>PixelCon already exists</div>
        </>
      )}
      {tooSimilar && (
        <>
          <div className={styles.derivativeText}>
            PixelCon is too similar to an already created PixelCon. Try making it more unique
          </div>
          <Link href={`/details/${possibleDerivative}`}>
            <div className={clsx(styles.derivativeIcon, utilStyles.icon)}></div>
            <div className={styles.derivativePixelconContainer}>
              <div
                className={clsx(styles.derivativePixelcon, utilStyles.crispImage, alreadyExists)}
                style={{
                  backgroundImage: `url(${generateIcon(possibleDerivative)})`,
                }}
              ></div>
              <div className={styles.derivativePixelconNum}>{`#${possibleDerivativeIndex}`}</div>
            </div>
          </Link>
        </>
      )}
      {!pleaseLogin && !isLoading && !alreadyExists && !tooSimilar && (
        <>
          <InputText label="(Optional Name)" byteLimit={8} onChange={setPixelconName}></InputText>
          <div className={clsx(styles.confirmText, textStyles.lowEmphasis)}>
            By creating this PixelCon, you agree to the{' '}
            <Link className={utilStyles.subtleLink} href="/terms">
              Terms of Use
            </Link>
          </div>
          <div className={clsx(buttonClass)} onClick={createClick}>
            CONFRIM
          </div>
        </>
      )}
      <div className={styles.bottomSpacer}></div>
      <Modal visible={showWarning} showOk={true} showCancel={true} onClose={create}>
        {'It looks like you already made a transaction to create this PixelCon. '}
        {"Make sure any old transactions aren't still pending before trying to create again."}
      </Modal>
      <Modal visible={showCreating} closable={false}>
        <div className={textStyles.lg}>Creating PixelCon</div>
        <br />
        <Dots />
      </Modal>
    </>
  );
}
