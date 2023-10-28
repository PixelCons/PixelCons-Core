import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import {generateIcon} from '../../../lib/imagedata';
import styles from './pixelcons.module.scss';
import utilStyles from '../../../styles/utils.module.scss';
import textStyles from '../../../styles/text.module.scss';
import archive from '../../../../archive/pixelconArchive.json' assert {type: 'json'};

//Pixelcon render object type
export type PixelconSetObject = {
  id: string;
  index: number;
};

//Pixelcons component to display set of pixelcons
export default function PixelconSet({
  pixelcons,
  showDates = true,
}: {
  pixelcons: PixelconSetObject[];
  showDates?: boolean;
}) {
  const pixelconsAndDates: (PixelconSetObject | number)[] = [];
  for (const pixelcon of pixelcons) {
    if (showDates) {
      for (const date of archive.dates) {
        if (date.firstIndex == pixelcon.index) {
          pixelconsAndDates.push(date.year);
          break;
        }
      }
    }
    pixelconsAndDates.push(pixelcon);
  }
  const renderPixelcons = pixelconsAndDates.map((pixelconOrDate) => {
    //date object
    if (typeof pixelconOrDate == 'number') {
      return (
        <div key={pixelconOrDate} className={clsx(styles.date, textStyles.notSelectable)}>
          <div>{pixelconOrDate}</div>
        </div>
      );
    }

    //use archive sheets
    const pixelcon: PixelconSetObject = pixelconOrDate as PixelconSetObject;
    if (pixelcon.index < archive.totalSupply) {
      const acrhiveClass = `archive${Math.floor(pixelcon.index / 1024)}`;
      const x = (pixelcon.index % 1024) % 32;
      const y = Math.floor((pixelcon.index % 1024) / 32);
      const divStyle = {
        backgroundPosition: `${(x / 31) * 100}% ${(y / 31) * 100}%`,
      };
      return (
        <Link key={pixelcon.id} className={styles.pixelcon} href={`/details/${pixelcon.id}`} prefetch={false}>
          <div className={clsx(styles[acrhiveClass], utilStyles.crispImage)} style={divStyle} />
          <span>#{pixelcon.index}</span>
        </Link>
      );
    }

    //generate icon
    const img = generateIcon(pixelcon.id);
    const divStyle = {
      backgroundImage: `url(${img})`,
      backgroundSize: '100%',
    };
    return (
      <Link key={pixelcon.id} className={styles.pixelcon} href={`/details/${pixelcon.id}`} prefetch={false}>
        <div className={utilStyles.crispImage} style={divStyle} />
        <span>#{pixelcon.index}</span>
      </Link>
    );
  });

  //render
  return <div className={styles.container}>{renderPixelcons}</div>;
}
