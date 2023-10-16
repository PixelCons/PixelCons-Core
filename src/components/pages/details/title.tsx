import React from 'react';
import Link from 'next/link';
import Dots from '../../dots';
import clsx from 'clsx';
import {Pixelcon, ArchiveData} from '../../../lib/pixelcons';
import {toDate} from '../../../lib/utils';
import {generateIcon} from '../../../lib/imagedata';
import styles from './title.module.scss';
import utilStyles from '../../../styles/utils.module.scss';
import textStyles from '../../../styles/text.module.scss';

//Header component to display prominent details
export default function Title({
  pixelconId,
  pixelcon,
  archiveData,
}: {
  pixelconId: string;
  pixelcon: Pixelcon;
  archiveData?: ArchiveData;
}) {
  const isBadId: boolean = pixelconId === null;
  const isUnknown: boolean = !!pixelconId && pixelcon === null;
  const isFetchingNew: boolean = !!pixelconId && !isUnknown && !pixelcon && !archiveData;
  let titleText = '';
  if (isBadId) titleText = 'invalid ID';
  else if (isUnknown) titleText = 'unknown';
  else if (isFetchingNew) titleText = 'Loading';
  else if (pixelcon) titleText = pixelcon ? `#${pixelcon.index}` : 'none';

  //render
  const hasDerivative = archiveData && archiveData.derivativeOf;
  const hasName = pixelcon && pixelcon.name;
  return (
    <div className={styles.container}>
      <span className={clsx(styles.text, styles.topFont, isBadId && textStyles.error)}>{titleText}</span>
      {isFetchingNew && <Dots />}
      {hasName && <span className={clsx(styles.name, styles.topFont)}>{pixelcon.name}</span>}
      {pixelconId && <span className={clsx(styles.text, styles.id)}>{pixelconId}</span>}
      {pixelcon && <span className={clsx(styles.text, styles.date)}>{toDate(pixelcon.date)}</span>}

      {hasDerivative && (
        <div className={styles.derivativeContainer}>
          <div className={clsx(styles.derivativeButton, utilStyles.icon, utilStyles.animated)}>
            <div className={styles.derivativeText}>{`Very similar to #${archiveData.derivativeOf.index}`}</div>
            <Link
              className={clsx(styles.derivativePixelcon, utilStyles.crispImage)}
              style={{
                backgroundImage: `url(${generateIcon(archiveData.derivativeOf.id)})`,
              }}
              href={`/details/${archiveData.derivativeOf.id}`}
              prefetch={false}
            ></Link>
          </div>
        </div>
      )}
    </div>
  );
}
