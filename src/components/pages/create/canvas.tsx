import React, {useState, useEffect} from 'react';
import {useRouter} from 'next/router';
import Link from 'next/link';
import clsx from 'clsx';
import ActionPanel from './actionPanel';
import CreatePixelcon from './createPixelcon';
import CreateCollection from './createCollection';
import {firstURLParam} from '../../../lib/utils';
import {charCodeToColor, colorPalette} from '../../../lib/utils';
import styles from './canvas.module.scss';
import textStyles from '../../../styles/text.module.scss';
import utilStyles from '../../../styles/utils.module.scss';

//Pixelcon canvas component to draw pixelcons
export default function Canvas() {
  const router = useRouter();
  const defaultId = '0x0000000000000000000000000000000000000000000000000000000000000000';
  const [pixelconId, setPixelconId] = useState(defaultId);
  const [confirmPixelconId, setConfirmPixelconId] = useState(defaultId);
  const [confirm, setConfirm] = useState(false);
  const [confirmCollection, setConfirmCollection] = useState(false);
  const [color, setColor] = useState(0);
  const [drawing, setDrawing] = useState(false);
  const canCreate = pixelconId != defaultId;
  const confirmAny = confirm || confirmCollection;
  const buttonClass = clsx(styles.button, utilStyles.textButton, textStyles.notSelectable);
  const mainSplitClass = clsx(styles.split, confirmAny && styles.splitMaxHeight);
  const overlaySplitClass = clsx(styles.split, !confirmAny && styles.splitMaxHeight, confirmAny && styles.splitOverlay);
  const draw = (index: number) => {
    const newId = pixelconId.substring(0, index + 2) + color.toString(16) + pixelconId.substring(index + 3);
    if (newId != pixelconId) {
      if (onDraw) onDraw(newId);
    }
  };

  //check show confirm from params
  useEffect(() => {
    const pixelconId = firstURLParam('pixelconId', router.asPath);
    const confirmCollection = firstURLParam('confirmCollection', router.asPath) === 'true';
    const confirm = !confirmCollection && pixelconId && firstURLParam('confirm', router.asPath) === 'true';
    setPixelconId(pixelconId || defaultId);
    setConfirm(confirm);
    setConfirmCollection(confirmCollection);
    if (confirm) setConfirmPixelconId(pixelconId);
  }, [router]);

  //action functions
  const showConfirm = () => {
    if (canCreate) router.push({query: {...router.query, confirm: true}}, undefined, {shallow: true});
  };
  const showConfirmCollection = () => {
    router.push({query: {...router.query, confirmCollection: true}}, undefined, {shallow: true});
  };
  const hideConfirm = () => {
    router.back();
  };

  //draw function
  const onDraw = (pixelconId: string) => {
    setPixelconId(pixelconId);
    if (pixelconId == defaultId) {
      delete router.query.pixelconId;
      router.replace({query: {...router.query}}, undefined, {shallow: true});
    } else {
      router.replace({query: {...router.query, pixelconId: pixelconId}}, undefined, {shallow: true});
    }
  };

  //cells
  const cells = [];
  for (let i = 0; i < 64; i++) {
    const c = charCodeToColor(pixelconId.charCodeAt(i + 2));
    cells.push(
      <div
        key={`cell_${i}`}
        className={clsx(styles.cell, utilStyles.clickable)}
        style={{backgroundColor: `rgb(${c[0]},${c[1]},${c[2]})`}}
        onMouseDown={() => {
          draw(i);
        }}
        onMouseOver={() => {
          if (drawing) draw(i);
        }}
      ></div>,
    );
  }

  //palette
  const palette = [];
  for (let i = 0; i < 16; i++) {
    const c = colorPalette[i];
    palette.push(
      <div
        key={`color_${i}`}
        className={clsx(i == color && styles.selected, utilStyles.clickable)}
        style={{backgroundColor: `rgb(${c[0]},${c[1]},${c[2]})`}}
        onClick={() => {
          setColor(i);
        }}
      ></div>,
    );
  }

  //render
  return (
    <div className={styles.container}>
      <div className={styles.splitContainer}>
        <div className={clsx(mainSplitClass)}>
          <span className={styles.prompt}>Draw a new PixelCon</span>
          <div
            className={clsx(styles.canvas, textStyles.notSelectable)}
            onMouseDown={() => {
              setDrawing(true);
            }}
            onMouseUp={() => {
              setDrawing(false);
            }}
            onMouseLeave={() => {
              setDrawing(false);
            }}
          >
            {cells}
          </div>
          <div className={utilStyles.inlineBlock}>
            <div className={clsx(styles.palette, textStyles.notSelectable)}>{palette}</div>
          </div>
          <div className={clsx(buttonClass, !canCreate && utilStyles.disabled)} onClick={showConfirm}>
            CREATE
          </div>
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
          <Link href={'/upload'}>
            <div>Upload from file</div>
          </Link>
          <div className={utilStyles.clickable} onClick={showConfirmCollection}>
            Create collection
          </div>
        </div>
      )}
    </div>
  );
}
