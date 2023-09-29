import React, {useState} from 'react';
import clsx from 'clsx';
import Dots from '../../dots';
import InputText from '../../inputText';
import {useGroupablePixelcons} from '../../../lib/pixelcons';
import {generateIcon} from '../../../lib/imagedata';
import styles from './createCollection.module.scss';
import textStyles from '../../../styles/text.module.scss';
import utilStyles from '../../../styles/utils.module.scss';

//Create component for confirming the creation of a collection
export default function CreateCollection({connectedAccount}: {connectedAccount: string}) {
  const buttonClass = clsx(styles.button, utilStyles.textButton, textStyles.notSelectable);
  const defaultSelected: string[] = [];
  const [selectedPixelconIds, setSelectedPixelconIds] = useState(defaultSelected);
  const {groupablePixelcons, groupableLoading, groupableError} = useGroupablePixelcons(connectedAccount);
  const pleaseLogin: boolean = !connectedAccount;
  const isLoading: boolean = !pleaseLogin && (groupableLoading || groupableError);
  const canCreate: boolean = selectedPixelconIds.length > 1;

  //select functions
  const onSelect = (pixelconId: string) => {
    const newSelectedPixelconIds = selectedPixelconIds.slice();
    newSelectedPixelconIds.push(pixelconId);
    setSelectedPixelconIds(newSelectedPixelconIds);
  };
  const onUnselect = (pixelconId: string) => {
    const newSelectedPixelconIds = selectedPixelconIds.slice();
    newSelectedPixelconIds.splice(newSelectedPixelconIds.indexOf(pixelconId), 1);
    setSelectedPixelconIds(newSelectedPixelconIds);
  };

  //selected and not selected pixelcons
  const selectablePixelcons = [];
  const selectedPixelcons = [];
  if (groupablePixelcons) {
    for (const pixelcon of groupablePixelcons) {
      if (!selectedPixelconIds.includes(pixelcon.id)) {
        selectablePixelcons.push(
          <div
            key={pixelcon.id}
            className={clsx(styles.pixelcon, styles.select, utilStyles.crispImage, utilStyles.clickable)}
            style={{
              backgroundImage: `url(${generateIcon(pixelcon.id)})`,
            }}
            onClick={() => {
              onSelect(pixelcon.id);
            }}
          ></div>,
        );
      }
    }
    for (const selectedPixelconId of selectedPixelconIds) {
      selectedPixelcons.push(
        <div
          key={selectedPixelconId}
          className={clsx(styles.pixelcon, utilStyles.crispImage, utilStyles.clickable, textStyles.notSelectable)}
          style={{
            backgroundImage: `url(${generateIcon(selectedPixelconId)})`,
          }}
          onClick={() => {
            onUnselect(selectedPixelconId);
          }}
        >
          <div></div>
        </div>,
      );
    }
  }

  //render
  return (
    <>
      {pleaseLogin && <div className={styles.connectText}>Connect Web3 account to continue</div>}
      {!pleaseLogin && (
        <>
          <div className={styles.instructions}>
            Select the PixelCons you created and currently own, which are not already in a collection, that you want to
            turn into a new collection
          </div>
          <div className={styles.selectBox}>
            {!isLoading && selectablePixelcons}
            {!isLoading && groupablePixelcons && groupablePixelcons.length == 0 && (
              <div className={styles.boxText}>No PixelCons</div>
            )}
            {isLoading && (
              <div className={styles.boxText}>
                <Dots></Dots>
              </div>
            )}
          </div>

          {!isLoading && (
            <>
              <div className={styles.title}>Create Collection</div>
              <div className={styles.previewBox}>
                {selectedPixelcons}
                {selectedPixelconIds.length == 0 && <div className={styles.previewText}>Nothing Selected</div>}
              </div>

              <InputText label="(Optional Name)" disabled={selectedPixelconIds.length == 0}></InputText>
              <div className={clsx(styles.confirmText, textStyles.lowEmphasis)}>
                By creating this Collection, you agree to the Terms of Use
              </div>
              <div className={clsx(buttonClass, !canCreate && utilStyles.disabled)}>CONFRIM</div>
            </>
          )}
        </>
      )}
      <div className={styles.bottomSpacer}></div>
    </>
  );
}
