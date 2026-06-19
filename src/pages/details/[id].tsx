import {GetStaticProps, GetStaticPaths} from 'next';
import React from 'react';
import Head from 'next/head';
import Layout from '../../components/layout';
import Title from '../../components/pages/details/title';
import Description from '../../components/pages/details/description';
import PixelconImage from '../../components/pages/details/pixelconImage';
import type {ArchiveData} from '../../lib/pixelcons';
import {getHTMLHeaderData} from '../../lib/metadata';
import {sanitizePixelconIdParam, sanitizePixelconIndexParam} from '../../lib/utils';
import buildConfig from '../../build.config';
import {promises as fs} from 'fs';
import path from 'path';
import utilStyles from '../../styles/utils.module.scss';

//Data constants
const archiveDirectory = path.join(process.cwd(), 'archive');
const webDomain = buildConfig.WEB_DOMAIN || '';
const pixelconIdInvalid = 'invalid';

//Static paths for the page built from archive data
export const getStaticPaths: GetStaticPaths = async () => {
  const staticPixelconIds = JSON.parse(await fs.readFile(path.join(archiveDirectory, 'pixelconIds.json'), 'utf8'));
  const paths = staticPixelconIds.map((pixelconId) => {
    return {
      params: {
        id: pixelconId,
      },
    };
  });

  return {
    paths,
    fallback: false,
  };
};

//Static props for page pre building using the archive data
export const getStaticProps: GetStaticProps = async ({params}) => {
  const staticPixelconIds = JSON.parse(await fs.readFile(path.join(archiveDirectory, 'pixelconIds.json'), 'utf8'));
  const pixelconIndex = sanitizePixelconIndexParam(params.id);
  const pixelconId = sanitizePixelconIdParam(params.id) || staticPixelconIds[pixelconIndex];

  //invalid pixelconId
  if (!pixelconId) {
    return {
      props: {
        pixelconId: pixelconIdInvalid,
        archiveData: null,
      },
    };
  }

  //redirect to more sanitized url
  if (pixelconId != params.id) {
    return {
      redirect: {
        destination: `/details/${pixelconId}`,
        permanent: true,
      },
    };
  }

  //return from archived data if available
  const staticPixelcons = JSON.parse(await fs.readFile(path.join(archiveDirectory, 'pixelcons.json'), 'utf8'));
  const staticPixelconCollections = JSON.parse(
    await fs.readFile(path.join(archiveDirectory, 'pixelconCollections.json'), 'utf8'),
  );
  const staticPixelconDerivatives = JSON.parse(
    await fs.readFile(path.join(archiveDirectory, 'pixelconDerivatives.json'), 'utf8'),
  );
  for (let i = 0; i < staticPixelcons.length; i++) {
    if (pixelconId == staticPixelcons[i].id) {
      return {
        props: {
          pixelconId,
          archiveData: {
            pixelcon: staticPixelcons[i],
            collection: staticPixelcons[i].collection ? staticPixelconCollections[staticPixelcons[i].collection] : null,
            derivativeOf: staticPixelconDerivatives[pixelconId] ? staticPixelconDerivatives[pixelconId] : null,
          },
        },
      };
    }
  }

  return {
    props: {
      pixelconId,
      archiveData: null,
    },
  };
};

//The details page to show the details of an individual pixelcon
export default function Details({pixelconId, archiveData}: {pixelconId: string; archiveData?: ArchiveData}) {
  //determine overall page state
  const isInvalid: boolean = pixelconId === pixelconIdInvalid;
  const renderPixelconId = isInvalid ? null : pixelconId;
  const renderPixelcon = archiveData ? archiveData.pixelcon : undefined;
  const headerData = getHTMLHeaderData(renderPixelcon);

  //render
  return (
    <Layout>
      {headerData && (
        <Head>
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:site" content="@PixelConsToken" />
          <meta name="twitter:title" content={headerData.title} />
          <meta name="twitter:description" content={headerData.description} />
          <meta name="twitter:image" content={`${webDomain}${headerData.imageUrl}`} />
          <meta property="og:url" content={`${webDomain}/`} />
          <meta property="og:title" content={headerData.title} />
          <meta property="og:description" content={headerData.description} />
          <meta property="og:image" content={`${webDomain}${headerData.imageUrl}`} />
        </Head>
      )}
      <div className={utilStyles.contentFooterContainer}>
        <Title pixelconId={renderPixelconId} pixelcon={renderPixelcon} archiveData={archiveData}></Title>
        <PixelconImage pixelconId={renderPixelconId} pixelcon={renderPixelcon}></PixelconImage>
        <Description isSpacer={true} pixelcon={null} archiveData={null}></Description>
      </div>
      <Description pixelcon={renderPixelcon} archiveData={archiveData}></Description>
    </Layout>
  );
}
