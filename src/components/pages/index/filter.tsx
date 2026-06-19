import React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import clsx from 'clsx';
import Address from '../../address';
import type {Collection} from '../../../lib/pixelcons';
import {clearURLParam} from '../../../lib/utils';
import utilStyles from '../../../styles/utils.module.scss';
import textStyles from '../../../styles/text.module.scss';
import styles from './filter.module.scss';
import staticCollections from '../../../../archive/pixelconCollections.json' with {type: 'json'};

//Pixelcon filter component to display filter options
export default function PixelconFilter({
  visible = true,
  collection,
  creator,
}: {
  visible?: boolean;
  collection?: string;
  creator?: string;
}) {
  const router = useRouter();
  const collectionIndex = collection ? parseInt(collection) : null;
  const collectionName =
    collectionIndex === null ? null : ((staticCollections as Collection[])[collectionIndex]?.name ?? collection);

  //empty
  if (!visible) return null;

  //build filter chips
  const filterChips = [];
  if (collection) {
    filterChips.push(
      <div key="collection" className={clsx(styles.chip, textStyles.notSelectable)}>
        <span>{`Collection: ${collectionName}`}</span>
        <Link href={clearURLParam('collection', router.asPath)} replace>
          <div className={clsx(utilStyles.icon, utilStyles.clickable)}></div>
        </Link>
      </div>,
    );
  }
  if (creator) {
    filterChips.push(
      <div key="creator" className={clsx(styles.chip, textStyles.notSelectable)}>
        <span>Creator: </span>
        <Address addr={creator}></Address>
        <Link href={clearURLParam('creator', router.asPath)} replace>
          <div className={clsx(utilStyles.icon, utilStyles.clickable)}></div>
        </Link>
      </div>,
    );
  }

  //render
  return <div className={styles.container}>{filterChips}</div>;
}
