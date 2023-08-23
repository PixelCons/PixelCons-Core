import {GetStaticProps} from 'next';
import React, {useState, useEffect} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import Layout from '../components/layout';
import {singleString} from '../lib/utils';
import {
  useAllPixelconIds,
  getAllPixelconIdsStatic,
  useCollectionPixelcons,
  useCreatorPixelcons,
  useOwnerPixelcons,
} from '../lib/pixelcons';
import utilStyles from '../styles/utils.module.css';

//Filter data
type FilterData = {
  collection?: string;
  creator?: string;
  owner?: string;
};

//Static props for page pre building
export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};

//The main home page to browse all existing pixelcons
export default function Home() {
  const router = useRouter();
  const staticPixelconIds = getAllPixelconIdsStatic();

  //setup filter data handling
  const [filterData, setFilterData] = useState<FilterData>({});
  useEffect(() => {
    setFilterData({
      collection: singleString(router.query.collection),
      creator: singleString(router.query.creator),
      owner: singleString(router.query.owner),
    });
  }, [router]);
  const hasFilters = filterData.collection || filterData.creator || filterData.owner;
  const {collectionPixelcons, collectionLoading, collectionError} = useCollectionPixelcons(filterData.collection);
  const {creatorPixelcons, creatorLoading, creatorError} = useCreatorPixelcons(filterData.creator);
  const {ownerPixelcons, ownerLoading, ownerError} = useOwnerPixelcons(filterData.owner);

  //load up to date pixelcon data or flag data as archive while fetching
  const {allPixelconIds, allPixelconIdsLoading, allPixelconIdsError} = useAllPixelconIds();
  const isFiltering =
    (hasFilters && allPixelconIdsLoading) ||
    (filterData.collection && collectionLoading) ||
    (filterData.creator && creatorLoading) ||
    (filterData.owner && ownerLoading);
  const isFetching = !hasFilters && allPixelconIdsLoading;
  const isError = allPixelconIdsError;
  const isFilterError = hasFilters && !isFiltering && (collectionError || creatorError || ownerError);

  //get filtered list of pixelcons to display
  const collectionPixelconIndexes = filterData.collection ? collectionPixelcons : null;
  const creatorPixelconIndexes = filterData.creator ? creatorPixelcons : null;
  const ownerPixelconIndexes = filterData.owner ? ownerPixelcons : null;
  let pixelconIds: string[] = staticPixelconIds;
  if (!hasFilters) {
    if (allPixelconIds) pixelconIds = allPixelconIds;
  } else {
    if (!isFiltering) {
      pixelconIds = [];
      if (!isFilterError) {
        for (let i = 0; i < allPixelconIds.length; i++) {
          if (
            (!collectionPixelconIndexes || collectionPixelconIndexes.indexOf(i) > -1) &&
            (!creatorPixelconIndexes || creatorPixelconIndexes.indexOf(i) > -1) &&
            (!ownerPixelconIndexes || ownerPixelconIndexes.indexOf(i) > -1)
          ) {
            pixelconIds.push(allPixelconIds[i]);
          }
        }
      }
    }
  }

  return (
    <Layout>
      <section className={utilStyles.headingSm}>
        {hasFilters && (
          <p>
            <b>Filters</b>
            {filterData.collection && <>{` | collection: ${filterData.collection}`}</>}
            {filterData.creator && <>{` | creator: ${filterData.creator}`}</>}
            {filterData.owner && <>{` | owner: ${filterData.owner}`}</>}
          </p>
        )}
        <p>
          All Pixelcons{` [${pixelconIds.length}]`}
          {isError ? ' [fetch failed]' : ''}
        </p>
        <p>{JSON.stringify(pixelconIds)}</p>
        {isFetching && <p>updating...</p>}
        {isFiltering && <p>filtering...</p>}
        {isFilterError && <p>filter error</p>}
      </section>
      <br />
      <br />
      <section className={utilStyles.headingSm}>
        <Link href="/">no filter</Link>
        <br />
        <Link href="/?collection=6">test filter</Link>
        <br />
        <Link href="/?collection=6&owner=0x0d453a098fc5fd6bacb1fd81c348c2fb03192188">test filter2</Link>
      </section>
      <h1 className={utilStyles.headingMd}>
        Go to{' '}
        <Link href="/details/0x8e8888888228822888022088880880888888888888e77e8882777728888ee888">details page!</Link>
        <br />
        Go to <Link href="/about">about page!</Link>
        <br />
        Go to <Link href="/create">create page!</Link>
      </h1>
    </Layout>
  );
}
