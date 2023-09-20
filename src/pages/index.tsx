import {GetStaticProps} from 'next';
import React, {useState, useEffect} from 'react';
import Link from 'next/link';
import {useRouter} from 'next/router';
import Layout from '../components/layout';
import PixelconFilter from '../components/pages/index/filter';
import PixelconSet, {PixelconSetObject} from '../components/pages/index/pixelcons';
import {firstURLParam} from '../lib/utils';
import {
  useAllPixelconIds,
  getAllPixelconIdsStatic,
  useCollectionPixelcons,
  useCreatorPixelcons,
  useOwnerPixelcons,
} from '../lib/pixelcons';
import utilStyles from '../styles/utils.module.scss';

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
  const minFilterTime = 300;
  const [minFilterTimeElapsed, setMinFilterTimeElapsed] = useState<boolean>(false);
  useEffect(() => {
    const minFilterTimeTimer = setTimeout(() => setMinFilterTimeElapsed(true), minFilterTime);
    return () => clearTimeout(minFilterTimeTimer);
  }, []);
  const [filterData, setFilterData] = useState<FilterData>({});
  useEffect(() => {
    setFilterData({
      collection: firstURLParam('collection', router.asPath),
      creator: firstURLParam('creator', router.asPath),
      owner: firstURLParam('owner', router.asPath),
    });
  }, [router]);
  const hasFilters: boolean = !!filterData.collection || !!filterData.creator || !!filterData.owner;
  const {collectionPixelcons, collectionLoading, collectionError} = useCollectionPixelcons(filterData.collection);
  const {creatorPixelcons, creatorLoading, creatorError} = useCreatorPixelcons(filterData.creator);
  const {ownerPixelcons, ownerLoading, ownerError} = useOwnerPixelcons(filterData.owner);

  //load up to date pixelcon data or flag data as archive while fetching
  const {allPixelconIds, allPixelconIdsLoading, allPixelconIdsError} = useAllPixelconIds();
  const waitingOnMinTime: boolean = !minFilterTimeElapsed;
  const filterError: boolean = allPixelconIdsError || collectionError || creatorError || ownerError;
  const isFiltering: boolean =
    (!!hasFilters && allPixelconIdsLoading) ||
    (!!filterData.collection && collectionLoading) ||
    (!!filterData.creator && creatorLoading) ||
    (!!filterData.owner && ownerLoading);
  const filteringSpinner: boolean = hasFilters && (isFiltering || waitingOnMinTime || filterError);

  //get filtered list of pixelcons to display
  const collectionPixelconIndexes = filterData.collection ? collectionPixelcons : null;
  const creatorPixelconIndexes = filterData.creator ? creatorPixelcons : null;
  const ownerPixelconIndexes = filterData.owner ? ownerPixelcons : null;
  let pixelcons: PixelconSetObject[] = staticPixelconIds.map((x, i) => {
    return {
      id: x,
      index: i,
    };
  });
  if (allPixelconIds) {
    if (!filteringSpinner) {
      //show filtered pixelcons
      pixelcons = [];
      for (let i = 0; i < allPixelconIds.length; i++) {
        if (
          (!collectionPixelconIndexes || collectionPixelconIndexes.indexOf(i) > -1) &&
          (!creatorPixelconIndexes || creatorPixelconIndexes.indexOf(i) > -1) &&
          (!ownerPixelconIndexes || ownerPixelconIndexes.indexOf(i) > -1)
        ) {
          pixelcons.push({
            id: allPixelconIds[i],
            index: i,
          });
        }
      }
    } else {
      //show fully fetched pixelcons
      pixelcons = allPixelconIds.map((x, i) => {
        return {
          id: x,
          index: i,
        };
      });
    }
  }

  return (
    <Layout>
      <PixelconFilter
        visible={hasFilters}
        filteringSpinner={filteringSpinner}
        collection={filterData.collection}
        creator={filterData.creator}
        owner={filterData.owner}
      ></PixelconFilter>
      <PixelconSet pixelcons={pixelcons} showDates={!hasFilters || !!filteringSpinner}></PixelconSet>
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
