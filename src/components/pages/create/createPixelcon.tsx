import React from 'react';
import clsx from 'clsx';
import Link from 'next/link';
import Dots from '../../dots';
import InputText from '../../inputText';
import {useAllPixelconIds, usePixelcon} from '../../../lib/pixelcons';
import {searchExact, searchPossibleDerivativeIndex, isDerivative} from '../../../lib/similarities';
import {generateIcon} from '../../../lib/imagedata';
import styles from './createPixelcon.module.scss';
import textStyles from '../../../styles/text.module.scss';
import utilStyles from '../../../styles/utils.module.scss';

//Create component for confirming the creation of a pixelcon
export default function CreatePixelcon({pixelconId, connectedAccount}: {pixelconId: string; connectedAccount: string}) {
  const buttonClass = clsx(styles.button, utilStyles.textButton, textStyles.notSelectable);
  const {allPixelconIds, allPixelconIdsLoading, allPixelconIdsError} = useAllPixelconIds();
  const exactIndex = searchExact(pixelconId, allPixelconIds) || -1;
  const possibleDerivativeIndex = searchPossibleDerivativeIndex(pixelconId, allPixelconIds) || -1;
  const possibleDerivative = possibleDerivativeIndex > -1 ? allPixelconIds[possibleDerivativeIndex] : undefined;
  const {pixelcon, pixelconLoading, pixelconError} = usePixelcon(exactIndex > -1 ? undefined : possibleDerivative);
  const checkDerivative = isDerivative(
    pixelconId,
    connectedAccount,
    pixelcon ? pixelcon.id : undefined,
    pixelcon ? pixelcon.creator : undefined,
  );
  const pleaseLogin: boolean = !connectedAccount;
  const isLoading: boolean =
    !pleaseLogin && (allPixelconIdsLoading || allPixelconIdsError || pixelconLoading || pixelconError);
  const alreadyExists: boolean = !pleaseLogin && !isLoading && exactIndex > -1;
  const tooSimilar: boolean = !pleaseLogin && !isLoading && !alreadyExists && !!checkDerivative;

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
      {isLoading && <Dots></Dots>}
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
          <InputText label="(Optional Name)"></InputText>
          <div className={clsx(styles.confirmText, textStyles.lowEmphasis)}>
            By creating this PixelCon, you agree to the Terms of Use
          </div>
          <div className={clsx(buttonClass)}>CONFRIM</div>
        </>
      )}
      <div className={styles.bottomSpacer}></div>
    </>
  );
}
