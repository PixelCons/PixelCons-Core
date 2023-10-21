import React from 'react';
import clsx from 'clsx';
import {Pixelcon} from '../../../lib/pixelcons';
import {generateIcon} from '../../../lib/imagedata';
import styles from './pixelconImage.module.scss';
import utilStyles from '../../../styles/utils.module.scss';
import textStyles from '../../../styles/text.module.scss';

//Pixelcon image component to display image details
export default function PixelconImage({pixelconId, pixelcon}: {pixelconId: string; pixelcon: Pixelcon}) {
  //render
  return (
    <div className={clsx(styles.container, textStyles.notSelectable)}>
      {pixelconId && (
        <>
          <img className={clsx(styles.pixelcon, utilStyles.crispImage)} src={generateIcon(pixelconId)} />
          <div className={styles.exportContainer}></div>
          {pixelcon && <span></span>}
        </>
      )}
    </div>
  );
}
