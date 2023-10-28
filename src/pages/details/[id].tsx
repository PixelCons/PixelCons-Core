import {GetStaticProps, GetStaticPaths} from 'next';
import React, {useState, useEffect} from 'react';
import {useRouter} from 'next/router';
import Head from 'next/head';
import Layout from '../../components/layout';
import Title from '../../components/pages/details/title';
import Description from '../../components/pages/details/description';
import PixelconImage from '../../components/pages/details/pixelconImage';
import {
  ArchiveData,
  Pixelcon,
  usePixelcon,
  getPixelconId,
  getAllPixelconIds,
  getPixelcon,
  getCollection,
} from '../../lib/pixelcons';
import {getHTMLHeaderData} from '../../lib/metadata';
import {sanitizePixelconIdParam, sanitizePixelconIndexParam} from '../../lib/utils';
import {searchPossibleDerivative, isDerivativePixelcon} from '../../lib/similarities';
import buildConfig from '../../build.config';
import {promises as fs} from 'fs';
import path from 'path';
import utilStyles from '../../styles/utils.module.scss';

//Data constants
const archiveDirectory = path.join(process.cwd(), 'archive');
const webDomain = buildConfig.WEB_DOMAIN || '';
const unknownPixelconIdRevalidate = buildConfig.API_CACHE_ERROR_UNKNOWN || 300;
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
    fallback: true,
  };
};

//Static props for page pre building using the archive data
export const getStaticProps: GetStaticProps = async ({params}) => {
  const pixelconIndex = sanitizePixelconIndexParam(params.id);
  const pixelconId = sanitizePixelconIdParam(params.id) || (await getPixelconId(pixelconIndex));

  //invalid pixelconId
  if (pixelconId === null) {
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

  //await new Promise((r) => setTimeout(r, 4000)); //TODO/////////////////////////////

  //make sure pixelcon exists
  const pixelcon = await getPixelcon(pixelconId);
  if (!pixelcon) {
    return {
      props: {
        pixelconId,
        archiveData: null,
      },
      revalidate: unknownPixelconIdRevalidate,
    };
  }

  //fetch the remaining data
  const collection = await getCollection(pixelcon.collection);
  const allPixelconIds = await getAllPixelconIds(0, pixelcon.index + 1);
  const similarPixelconId = searchPossibleDerivative(pixelcon.id, allPixelconIds);
  let derivativeOf: Pixelcon = null;
  if (similarPixelconId) {
    const originalPixelcon: Pixelcon = await getPixelcon(similarPixelconId);
    if (isDerivativePixelcon(originalPixelcon, pixelcon)) derivativeOf = originalPixelcon;
  }
  return {
    props: {
      pixelconId,
      archiveData: {
        pixelcon,
        collection,
        derivativeOf,
      },
    },
  };
};

//The details page to show the details of an individual pixelcon
export default function Details({pixelconId, archiveData}: {pixelconId: string; archiveData?: ArchiveData}) {
  const router = useRouter();

  //setup previewing of pixelcon on fallback page
  const [pathPixelconId, setPathPixelconId] = useState<string>();
  useEffect(() => {
    const param = router.asPath.substring(router.asPath.lastIndexOf('/') + 1);
    const pathIndexParam = sanitizePixelconIndexParam(param);
    const pathIdParam = sanitizePixelconIdParam(param);
    setPathPixelconId(pathIdParam ? pathIdParam : pathIndexParam ? `#${pathIndexParam}` : pixelconIdInvalid);
  }, [pixelconId]);

  //determine overall page state
  const isInvalid: boolean = pixelconId === pixelconIdInvalid || pathPixelconId === pixelconIdInvalid;
  const renderPixelconId = isInvalid ? null : pixelconId ? pixelconId : pathPixelconId;

  //load up to date pixelcon data or flag data as archive while fetching
  const {pixelcon} = usePixelcon(renderPixelconId);
  const renderPixelcon = pixelcon !== undefined ? pixelcon : archiveData ? archiveData.pixelcon : undefined;
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
