import React, {useState, useEffect} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import ActionPanel from '../create/actionPanel';
import CreatePixelcon from '../create/createPixelcon';
import CreateCollection from '../create/createCollection';
import clsx from 'clsx';
import {firstURLParam} from '../../../lib/utils';
import {generateIcon} from '../../../lib/imagedata';
import {decodePNGFile} from '../../../lib/imagedecode';
import styles from './uploader.module.scss';
import textStyles from '../../../styles/text.module.scss';
import utilStyles from '../../../styles/utils.module.scss';

//Pixelcon uploader component to upload pixelcons from file
export default function Upload() {
  const router = useRouter();
  const defaultId = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const [confirmPixelconId, setConfirmPixelconId] = useState(defaultId);
  const [pixelconIds, setPixelconIds] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [confirmCollection, setConfirmCollection] = useState(false);
  const [uploadError, setUploadError] = useState('');
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
  const onUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    if (ev && ev.target && ev.target.files && ev.target.files.length) {
      try {
        const file = ev.target.files[0];
        const pixelconIds = await decodePNGFile(file);
        setPixelconIds(pixelconIds);
        setUploadError('');
      } catch (e) {
        console.error(e);
        setPixelconIds([]);
        setUploadError(e.text || e);
      }
    } else {
      //no file
      setPixelconIds([]);
      setUploadError('');
    }
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
          <span className={styles.prompt}>
            Create multiple PixelCons by uploading a PNG file. See templates{' '}
            <a href="/data/PixelCons_AdvancedCreatorTemplates.zip">here</a>
          </span>
          <div className={clsx(styles.box, textStyles.notSelectable, utilStyles.clickable)}>
            <span>Click Here to Upload File</span>
            <br />
            <span>(Or Drag and Drop)</span>
            <input type="file" accept="image/png" onChange={onUpload}></input>
          </div>
          <div className={styles.pixelconContainer}>{pixelcons}</div>
          {uploadError && <div className={textStyles.error}>{uploadError}</div>}
          <div className={styles.linksSpacer}></div>
        </div>

        <div className={overlaySplitClass}>
          <ActionPanel onClose={hideConfirm}>
            {confirm && <CreatePixelcon pixelconId={confirmPixelconId} onCreate={hideConfirm}></CreatePixelcon>}
            {confirmCollection && <CreateCollection></CreateCollection>}
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
