import React, {useState, useEffect} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import ActionPanel from '../create/actionPanel';
import CreatePixelcon from '../create/createPixelcon';
import CreateCollection from '../create/createCollection';
import clsx from 'clsx';
import {firstURLParam} from '../../../lib/utils';
import {generateIcon} from '../../../lib/imagedata';
import styles from './uploader.module.scss';
import textStyles from '../../../styles/text.module.scss';
import utilStyles from '../../../styles/utils.module.scss';

//Pixelcon uploader component to upload pixelcons from file
export default function Upload() {
  const router = useRouter();
  const defaultId = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const defaultIds: string[] = [];
  const [confirmPixelconId, setConfirmPixelconId] = useState(defaultId);
  const [pixelconIds, setPixelconIds] = useState(defaultIds);
  const [confirm, setConfirm] = useState(false);
  const [confirmCollection, setConfirmCollection] = useState(false);
  const confirmAny = confirm || confirmCollection;
  const mainSplitClass = clsx(styles.split, confirmAny && styles.splitMaxHeight);
  const overlaySplitClass = clsx(styles.split, !confirmAny && styles.splitMaxHeight, confirmAny && styles.splitOverlay);

  //check show confirm from params
  useEffect(() => {
    const pixelconId = firstURLParam('pixelconId', router.asPath);
    const confirmCollection = firstURLParam('confirmCollection', router.asPath) === 'true';
    const confirm = !confirmCollection && pixelconId && firstURLParam('confirm', router.asPath) === 'true';
    setPixelconIds(pixelconIds.length == 0 && pixelconId ? [pixelconId] : pixelconIds);
    setConfirm(confirm);
    setConfirmCollection(confirmCollection);
    if (confirm) setConfirmPixelconId(pixelconId);
  }, [router]);

  //action functions
  const showConfirm = (pixelconId: string) => {
    router.push({query: {...router.query, pixelconId: pixelconId, confirm: true}}, undefined, {shallow: true});
  };
  const showConfirmCollection = () => {
    router.push({query: {...router.query, confirmCollection: true}}, undefined, {shallow: true});
  };
  const hideConfirm = () => {
    router.back();
  };

  //upload function
  const onUpload = () => {
    setPixelconIds([
      '0x00000000000000000000033000b3b3330bdbb33300b0bb3b0bbbdbbd0030b30b',
      '0x0000000000000800000388200b3b3223bdbb33300b0bb3b0bbbdbbd0030b30b0',
      '0x000088000082a92800388280b355b443bbbbb53b0bb0bb53bddbbbbb0300b30b',
      '0x00000000000000000999900000909000099990a00044908000aa940009a94000',
      '0x0000000000888800080808000888880a00022809008aa808000aa28000080800',
      '0x009990909990949099999dd900449dd909aa49d809aa498a049a949879407900',
      '0x000000000000000000cccc00000c0c0000cccc40000a9c2c0009a1c100010c00',
      '0x0060007000ccc7600c0c06000ccccc4000111c2700ca9c2600c9a16000100c00',
      '0x6ccc1007ccc0c476ccccc4604aaadc402c999c202ca9a121019a9c1071000700',
    ]);
  };

  //pixelcons
  const pixelcons = [];
  for (let i = 0; i < pixelconIds.length; i++) {
    pixelcons.push(
      <div
        key={pixelconIds[i]}
        className={clsx(styles.pixelcon, utilStyles.crispImage, utilStyles.clickable)}
        style={{
          backgroundImage: `url(${generateIcon(pixelconIds[i])})`,
        }}
        onClick={() => showConfirm(pixelconIds[i])}
      />,
    );
  }

  //render
  return (
    <div className={styles.container}>
      <div className={styles.splitContainer}>
        <div className={mainSplitClass}>
          <span className={styles.prompt}>Create multiple PixelCons by uploading a PNG file. See templates here</span>
          <div className={clsx(styles.box, textStyles.notSelectable, utilStyles.clickable)} onClick={onUpload}>
            <span>Click Here to Upload File</span>
            <br />
            <span>(Or Drag and Drop)</span>
          </div>
          <div className={styles.pixelconContainer}>{pixelcons}</div>
          <div className={styles.linksSpacer}></div>
        </div>

        <div className={overlaySplitClass}>
          <ActionPanel onClose={hideConfirm}>
            {confirm && (
              <CreatePixelcon
                pixelconId={confirmPixelconId}
                connectedAccount={'0x2c755a1231bcabb363598277c52be7865d365257'}
              ></CreatePixelcon>
            )}
            {confirmCollection && (
              <CreateCollection connectedAccount={'0x2c755a1231bcabb363598277c52be7865d365257'}></CreateCollection>
            )}
          </ActionPanel>
        </div>
      </div>

      {!confirmAny && (
        <div className={clsx(styles.linksContainer, textStyles.notSelectable)}>
          <Link href={'/create'}>
            <div>Create from drawing</div>
          </Link>
          <div className={utilStyles.clickable} onClick={showConfirmCollection}>
            Create collection
          </div>
        </div>
      )}
    </div>
  );
}
