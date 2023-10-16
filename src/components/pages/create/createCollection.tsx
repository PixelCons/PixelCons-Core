import React, {useState} from 'react';
import {useWeb3React} from '@web3-react/core';
import Link from 'next/link';
import clsx from 'clsx';
import Dots from '../../dots';
import Modal from '../../modal';
import InputText from '../../inputText';
import {checkNetwork, getSigner, checkPendingCreateCollection} from '../../../lib/web3';
import {useGroupablePixelcons, createCollection} from '../../../lib/pixelcons';
import {generateIcon} from '../../../lib/imagedata';
import styles from './createCollection.module.scss';
import textStyles from '../../../styles/text.module.scss';
import utilStyles from '../../../styles/utils.module.scss';

//Create component for confirming the creation of a collection
export default function CreateCollection({onCreate}: {onCreate?: () => void}) {
  const {account, provider} = useWeb3React();
  const accountAddress = account ? account.toLowerCase() : null;
  const [showCreating, setShowCreating] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [collectionName, setCollectionName] = useState('');
  const [selectedPixelconIds, setSelectedPixelconIds] = useState<string[]>([]);
  const {groupablePixelcons, groupableLoading, groupableError} = useGroupablePixelcons(accountAddress);
  const pleaseLogin: boolean = !accountAddress;
  const isLoading: boolean = !pleaseLogin && (groupableLoading || groupableError);
  const canCreate: boolean = selectedPixelconIds.length > 1;
  const buttonClass = clsx(styles.button, utilStyles.textButton, textStyles.notSelectable);
  const getSelectedIndexes = () => {
    const pixelconIndexes: number[] = [];
    for (const pixelconId of selectedPixelconIds) {
      for (const pixelcon of groupablePixelcons) {
        if (pixelconId == pixelcon.id) {
          pixelconIndexes.push(pixelcon.index);
          break;
        }
      }
    }
    return pixelconIndexes;
  };

  //create function
  const createClick = async () => {
    const pixelconIndexes = getSelectedIndexes();
    if (checkPendingCreateCollection(pixelconIndexes)) setShowWarning(true);
    else await create(true);
  };
  const create = async (confirm?: boolean) => {
    if (canCreate) {
      setShowWarning(false);
      if (confirm === true && (await checkNetwork())) {
        setShowCreating(true);

        const pixelconIndexes = getSelectedIndexes();
        const signer = getSigner(provider);
        await createCollection(signer, accountAddress, pixelconIndexes, collectionName);
        checkPendingCreateCollection(pixelconIndexes, true);
        setSelectedPixelconIds([]);
        setCollectionName('');
        setShowCreating(false);
        if (onCreate) onCreate();
      }
    }
  };

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
            Select PixelCons to group into a collection (PixelCons you currently own, created and are not already in a
            collection)
          </div>
          <div className={styles.selectBox}>
            {!isLoading && selectablePixelcons}
            {!isLoading && groupablePixelcons && groupablePixelcons.length == 0 && (
              <div className={styles.boxText}>No PixelCons</div>
            )}
            {isLoading && (
              <div className={styles.boxText}>
                <Dots />
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

              <InputText
                label="(Optional Name)"
                byteLimit={8}
                disabled={selectedPixelconIds.length == 0}
                onChange={setCollectionName}
              ></InputText>
              <div className={clsx(styles.confirmText, textStyles.lowEmphasis)}>
                By creating this Collection, you agree to the{' '}
                <Link className={utilStyles.subtleLink} href="/terms">
                  Terms of Use
                </Link>
              </div>
              <div className={clsx(buttonClass, !canCreate && utilStyles.disabled)} onClick={createClick}>
                CONFRIM
              </div>
            </>
          )}
        </>
      )}
      <div className={styles.bottomSpacer}></div>
      <Modal visible={showWarning} showOk={true} showCancel={true} onClose={create}>
        {'It looks like you already made a transaction to create a similar collection. '}
        {"Make sure any old transactions aren't still pending before trying to create again."}
      </Modal>
      <Modal visible={showCreating} closable={false}>
        <div className={textStyles.lg}>Creating Collection</div>
        <br />
        <Dots />
      </Modal>
    </>
  );
}
