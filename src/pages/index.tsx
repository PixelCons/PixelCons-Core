import {GetStaticProps} from 'next';
import React, {useState, useEffect} from 'react';
import {useRouter} from 'next/router';
import Layout from '../components/layout';
import PixelconFilter from '../components/pages/index/filter';
import PixelconSet, {PixelconSetObject} from '../components/pages/index/pixelcons';
import {firstURLParam} from '../lib/utils';
import {Pixelcon} from '../lib/pixelcons';
import staticPixelcons from '../../archive/pixelcons.json' assert {type: 'json'};

//Filter data
type FilterData = {
  collection?: string;
  creator?: string;
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

  //setup filter data handling
  const [filterData, setFilterData] = useState<FilterData>({});
  useEffect(() => {
    setFilterData({
      collection: firstURLParam('collection', router.asPath),
      creator: firstURLParam('creator', router.asPath),
    });
  }, [router]);
  const hasFilters: boolean = !!filterData.collection || !!filterData.creator;

  //get filtered list of pixelcons to display
  const collectionIndex = filterData.collection ? parseInt(filterData.collection) : null;
  const creatorAddress = filterData.creator ? filterData.creator.toLowerCase() : null;
  const pixelcons: PixelconSetObject[] = [];
  for (const pixelcon of staticPixelcons as Pixelcon[]) {
    if (
      (collectionIndex === null || pixelcon.collection === collectionIndex) &&
      (creatorAddress === null || pixelcon.creator.toLowerCase() === creatorAddress)
    ) {
      pixelcons.push({
        id: pixelcon.id,
        index: pixelcon.index,
      });
    }
  }

  //scroll restoration after filter
  useEffect(() => {
    //store scroll position
    const handleRouteChange = () => {
      sessionStorage.setItem('scrollPath', router.asPath);
      sessionStorage.setItem('scrollPosition', window.scrollY.toString());
    };
    router.events.on('routeChangeStart', handleRouteChange);
    return () => router.events.off('routeChangeStart', handleRouteChange);
  }, [router.events]);

  useEffect(() => {
    //restore scroll position
    const scrollPath = sessionStorage.getItem('scrollPath');
    const scrollPosition = Number(sessionStorage.getItem('scrollPosition'));
    if (scrollPath == router.asPath && scrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      });
    }
    sessionStorage.removeItem('scrollPath');
    sessionStorage.removeItem('scrollPosition');
  }, [router.asPath]);

  return (
    <Layout>
      <PixelconFilter
        visible={hasFilters}
        collection={filterData.collection}
        creator={filterData.creator}
      ></PixelconFilter>
      <PixelconSet pixelcons={pixelcons} showDates={!hasFilters}></PixelconSet>
    </Layout>
  );
}
