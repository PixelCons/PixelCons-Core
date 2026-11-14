import React from 'react';
import Dots from '../../dots';
import clsx from 'clsx';
import {Pixelcon, ArchiveData} from '../../../lib/pixelcons';
import {toDate} from '../../../lib/utils';
import styles from './title.module.scss';
import textStyles from '../../../styles/text.module.scss';

//Header component to display prominent details
export default function Title({
  pixelconId,
  pixelcon,
  archiveData,
  offline = false,
  unarchivedName = '',
  unarchivedIndex,
  unarchivedDate,
}: {
  pixelconId: string;
  pixelcon: Pixelcon;
  archiveData?: ArchiveData;
  offline?: boolean;
  unarchivedName?: string;
  unarchivedIndex?: number;
  unarchivedDate?: number;
}) {
  const isBadId: boolean = pixelconId === null;
  const isUnknown: boolean = !!pixelconId && pixelcon === null;
  const isFetchingNew: boolean = !offline && !!pixelconId && !isUnknown && !pixelcon && !archiveData;
  let titleText = '';
  if (isBadId) titleText = 'invalid ID';
  else if (isUnknown) titleText = 'unknown';
  else if (isFetchingNew) titleText = 'Loading';
  else if (pixelcon) titleText = pixelcon ? `#${pixelcon.index}` : 'none';
  else if (offline) titleText = unarchivedIndex === undefined ? 'PixelCon' : `#${unarchivedIndex}`;

  //render
  const name = pixelcon?.name ?? unarchivedName;
  const date = pixelcon?.date ?? unarchivedDate;
  const dateText =
    date === 0
      ? new Date(0).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})
      : toDate(date);
  return (
    <div className={styles.container}>
      <span className={clsx(styles.text, styles.topFont, isBadId && textStyles.error)}>{titleText}</span>
      {isFetchingNew && <Dots />}
      {name && <span className={clsx(styles.name, styles.topFont)}>{name}</span>}
      {pixelconId && <span className={clsx(styles.text, styles.id)}>{pixelconId}</span>}
      {date !== undefined && date !== null && <span className={clsx(styles.text, styles.date)}>{dateText}</span>}
    </div>
  );
}
