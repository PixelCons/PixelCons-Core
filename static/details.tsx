import React from 'react';
import Layout from '../src/components/layout';
import Title from '../src/components/pages/details/title';
import PixelconImage from '../src/components/pages/details/pixelconImage';
import Description from '../src/components/pages/details/description';
import styles from '../src/styles/utils.module.scss';
import {byId, byCollection} from './data';
import {useRouter} from './router';

export default function Details() {
  const {route, query} = useRouter();
  const pixelcon = byId.get(query.id);
  const name = route.name ?? pixelcon?.name ?? '';
  const index = route.index ?? pixelcon?.index;
  const date = route.date === undefined ? pixelcon?.date : route.date * 1000;
  const renderPixelcon = pixelcon ? {...pixelcon, name, index, date} : undefined;
  const archiveData = pixelcon
    ? {pixelcon: renderPixelcon, collection: byCollection.get(pixelcon.collection), derivativeOf: null}
    : undefined;
  return (
    <Layout>
      <div className={styles.contentFooterContainer}>
        <Title
          pixelconId={query.id}
          pixelcon={renderPixelcon}
          archiveData={archiveData}
          offline
          unarchivedName={name}
          unarchivedIndex={index}
          unarchivedDate={date}
        />
        {route.name === null && (
          <p role="status" style={{textAlign: 'center'}}>
            The name bytes in this link could not be decoded.
          </p>
        )}
        <PixelconImage pixelconId={query.id} pixelcon={renderPixelcon} />
        <Description isSpacer pixelcon={null} archiveData={null} />
      </div>
      <Description pixelcon={renderPixelcon} archiveData={archiveData} />
    </Layout>
  );
}
