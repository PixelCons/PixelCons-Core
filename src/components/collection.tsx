import React from 'react';
import {ArchiveData, useCollection} from '../lib/pixelcons';
import styles from './collection.module.css';

//Collection component to display collection data
export default function Collection({
  collectionIndex,
  archiveData,
}: {
  collectionIndex: number;
  archiveData?: ArchiveData;
}) {
  const isBlank = !collectionIndex && (!archiveData || !archiveData.collection);

  //load up to date collection data or flag data as archived while fetching
  const {collection, collectionLoading, collectionError} = useCollection(collectionIndex);
  const isUnknown = !!collectionIndex && !collection && !collectionLoading && !collectionError;
  const isFetching = !!collectionIndex && collectionLoading;
  const isError = collectionError;
  const isArchive = !collection && archiveData && archiveData.collection;
  const renderCollection = collection ? collection : archiveData ? archiveData.collection : null;

  //render
  return (
    <>
      {!isBlank && (
        <div className={styles.container}>
          <p>
            Collection{isArchive ? ' (Archive)' : ''}
            {isError ? ' [fetch failed]' : ''}
          </p>
          <p>{renderCollection ? JSON.stringify(renderCollection) : ''}</p>
          <p>{isFetching ? (isArchive ? 'updating...' : 'loading...') : ''}</p>
          <p>{isUnknown ? 'unknown collection' : ''}</p>
        </div>
      )}
    </>
  );
}
