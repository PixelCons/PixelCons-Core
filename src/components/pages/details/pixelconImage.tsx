import React from 'react';
import clsx from 'clsx';
import {Pixelcon} from '../../../lib/pixelcons';
import {generateIcon} from '../../../lib/imagedata';
import styles from './pixelconImage.module.scss';
import utilStyles from '../../../styles/utils.module.scss';
import textStyles from '../../../styles/text.module.scss';

//Pixelcon image component to display image details
export default function PixelconImage({pixelconId, pixelcon}: {pixelconId: string; pixelcon: Pixelcon}) {
  const img = pixelconId && pixelconId.indexOf('0x') == 0 ? generateIcon(pixelconId) : null;

  //render
  return (
    <div className={clsx(styles.container, textStyles.notSelectable)}>
      {img && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={clsx(styles.pixelcon, utilStyles.crispImage)} src={img} />
          <div className={styles.exportContainer}></div>
          {pixelcon && <span></span>}
        </>
      )}
    </div>
  );
}
