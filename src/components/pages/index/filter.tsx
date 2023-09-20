import React from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import clsx from 'clsx';
import Address from '../../address';
import Dots from '../../dots';
import {clearURLParam} from '../../../lib/utils';
import utilStyles from '../../../styles/utils.module.scss';
import textStyles from '../../../styles/text.module.scss';
import styles from './filter.module.scss';

//Pixelcon filter component to display filter options
export default function PixelconFilter({
  visible = true,
  filteringSpinner = false,
  collection,
  creator,
  owner,
}: {
  visible?: boolean;
  filteringSpinner?: boolean;
  collection?: string;
  creator?: string;
  owner?: string;
}) {
  const router = useRouter();

  //empty
  if (!visible) return null;

  //build filter chips
  const filterChips = [];
  if (!filteringSpinner) {
    if (collection) {
      filterChips.push(
        <div key="collection" className={clsx(styles.chip, textStyles.notSelectable)}>
          <span>{`Collection: ${collection}`}</span>
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
    if (owner) {
      filterChips.push(
        <div key="owner" className={clsx(styles.chip, textStyles.notSelectable)}>
          <span>Owner: </span>
          <Address addr={owner}></Address>
          <Link href={clearURLParam('owner', router.asPath)} replace>
            <div className={clsx(utilStyles.icon, utilStyles.clickable)}></div>
          </Link>
        </div>,
      );
    }
  }

  //render
  return (
    <div>
      <div className={styles.container}>
        {filterChips}
        {filteringSpinner && (
          <>
            <span className={styles.filtering}>Filtering</span>
            <Dots></Dots>
          </>
        )}
      </div>
      {!filteringSpinner && <div className={styles.spacer}></div>}
    </div>
  );
}
