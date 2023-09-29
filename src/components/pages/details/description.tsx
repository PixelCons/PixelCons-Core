import React from 'react';
import Link from 'next/link';
import Dots from '../../dots';
import Address from '../../address';
import clsx from 'clsx';
import {Pixelcon, ArchiveData, useCollection} from '../../../lib/pixelcons';
import {generateIcon} from '../../../lib/imagedata';
import styles from './description.module.scss';
import textStyles from '../../../styles/text.module.scss';
import utilStyles from '../../../styles/utils.module.scss';

//Pixelcon description component to display additional details
export default function Description({
  pixelcon,
  archiveData,
  isSpacer = false,
}: {
  pixelcon: Pixelcon;
  archiveData: ArchiveData;
  isSpacer?: boolean;
}) {
  if (isSpacer) return <div className={styles.blankSpacer}></div>;
  const collectionIndex = pixelcon ? pixelcon.collection : undefined;

  //load up to date collection data or flag data as archived while fetching
  const {collection, collectionLoading, collectionError} = useCollection(collectionIndex);
  const isCollectionFetching: boolean = !!collectionIndex && (collectionLoading || collectionError);
  const renderCollection = collection !== undefined ? collection : archiveData ? archiveData.collection : undefined;

  //collection pixelcons
  const maxPixelcons = 20;
  const renderCollectionPixelcons = [];
  if (renderCollection) {
    const pixelconIds = renderCollection.pixelconIds.slice(0, maxPixelcons);
    for (let i = 0; i < pixelconIds.length; i++) {
      const img = generateIcon(pixelconIds[i]);
      renderCollectionPixelcons.push(
        <Link
          key={pixelconIds[i]}
          className={clsx(styles.collectionPixelcon, utilStyles.crispImage)}
          style={{
            backgroundImage: `url(${img})`,
          }}
          href={`/details/${pixelconIds[i]}`}
          prefetch={false}
        ></Link>,
      );
    }
    if (renderCollectionPixelcons.length < renderCollection.pixelconIds.length) {
      const remainder = renderCollection.pixelconIds.length - pixelconIds.length;
      renderCollectionPixelcons.push(
        <div
          key={'remainder'}
          className={clsx(styles.collectionPlus, textStyles.notSelectable)}
        >{`+${remainder}`}</div>,
      );
    }
  }

  //render
  return (
    <div className={styles.container}>
      {pixelcon && (
        <>
          {renderCollection && (
            <div className={styles.collectionContainer}>
              <Link href={`/?collection=${renderCollection.index}`}>
                <span className={styles.label}>{`1 of ${renderCollection.pixelconIds.length} `}</span>
              </Link>
              <div className={clsx(styles.collectionPreview, utilStyles.animated)}>{renderCollectionPixelcons}</div>
              {renderCollection.name && (
                <Link href={`/?collection=${renderCollection.index}`}>
                  <span className={styles.collectionName}>{renderCollection.name}</span>
                </Link>
              )}
            </div>
          )}
          {!renderCollection && (
            <div className={styles.spacer}>{isCollectionFetching && <Dots size={5} delayed dim></Dots>}</div>
          )}
          <div className={styles.address}>
            <Link className={styles.label} href={`/?owner=${pixelcon.owner}`}>
              Owner
            </Link>
            <Address addr={pixelcon.owner} maxChars={42} abbrChars={20} linkOwner={true}></Address>
          </div>
          <div className={styles.address}>
            <Link className={styles.label} href={`/?creator=${pixelcon.creator}`}>
              Creator
            </Link>
            <Address addr={pixelcon.creator} maxChars={42} abbrChars={20} linkCreator={true}></Address>
          </div>
        </>
      )}
    </div>
  );
}
