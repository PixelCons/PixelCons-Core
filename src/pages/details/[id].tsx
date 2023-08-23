/* eslint-disable @next/next/no-img-element */
import {GetStaticProps, GetStaticPaths} from 'next';
import React, {useState, useEffect} from 'react';
import {useRouter} from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Collection from '../../components/collection';
import Layout from '../../components/layout';
import {ArchiveData, Pixelcon, usePixelcon, getAllPixelconIds, getPixelcon, getCollection} from '../../lib/pixelcons';
import {getHTMLHeaderData} from '../../lib/metadata';
import {sanitizePixelconIdParam} from '../../lib/utils';
import {generateIcon} from '../../lib/imagedata';
import {searchPossibleDerivative, isDerivative} from '../../lib/similarities';
import buildConfig from '../../build.config';
import utilStyles from '../../styles/utils.module.css';
import {promises as fs} from 'fs';
import path from 'path';

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
  const pixelconId = sanitizePixelconIdParam(params.id);

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

  //await (new Promise(r => setTimeout(r, 1000)));//TODO/////////////////////////////

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
  const index = searchPossibleDerivative(pixelcon.id, allPixelconIds);
  let derivativeOf: Pixelcon = null;
  if (index > -1) {
    const originalPixelcon: Pixelcon = await getPixelcon(allPixelconIds[index]);
    if (isDerivative(originalPixelcon, pixelcon)) derivativeOf = originalPixelcon;
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
    const pathIdParam = sanitizePixelconIdParam(router.asPath.substring(router.asPath.lastIndexOf('/') + 1));
    setPathPixelconId(pathIdParam ? pathIdParam : pixelconIdInvalid);
  }, [pixelconId]);

  //determine overall page state
  const isBlankLoading = !pixelconId && !pathPixelconId;
  const isInvalid = pixelconId === pixelconIdInvalid || pathPixelconId === pixelconIdInvalid;
  const renderPixelconId = isInvalid ? null : pixelconId ? pixelconId : pathPixelconId;

  //load up to date pixelcon data or flag data as archive while fetching
  const {pixelcon, pixelconLoading, pixelconError} = usePixelcon(renderPixelconId);
  const isUnknown =
    renderPixelconId && !pixelconLoading && !pixelconError && !pixelcon && (!archiveData || !archiveData.pixelcon);
  const isFetching = renderPixelconId && pixelconLoading;
  const isError = pixelconError;
  const isArchive = !pixelcon && archiveData && archiveData.pixelcon;
  const renderPixelcon = pixelcon ? pixelcon : archiveData ? archiveData.pixelcon : null;
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
      {!isBlankLoading && (
        <>
          {isInvalid && (
            <section className={utilStyles.headingSm}>
              <p>
                <b>Invalid Pixelcon</b>
              </p>
            </section>
          )}
          {!isInvalid && (
            <section className={utilStyles.headingSm}>
              <img width="100px" className="crispImage" src={generateIcon(renderPixelconId)} alt="icon" />
              <p>{renderPixelconId}</p>
              <p>
                <b>
                  Pixelcon Details{isArchive ? ' (Archive)' : ''}
                  {isError ? ' [fetch failed]' : ''}
                </b>
              </p>
              <p>{renderPixelcon ? JSON.stringify(renderPixelcon) : ''}</p>
              <p>{isFetching ? (isArchive ? 'updating...' : 'loading...') : ''}</p>
              <p>{isUnknown ? 'unknown pixelcon' : ''}</p>
              <Collection
                collectionIndex={pixelcon ? pixelcon.collection : null}
                archiveData={archiveData}
              ></Collection>
              {renderPixelcon && !archiveData && <p>checking for derivative...</p>}
              {renderPixelcon && archiveData && archiveData.derivativeOf && (
                <p>{`derivative of ${archiveData.derivativeOf.id}`}</p>
              )}
            </section>
          )}
        </>
      )}
      <br />
      <br />
      <section className={utilStyles.headingSm} style={{position: 'absolute', bottom: '100px'}}>
        <Link href="/details/0x8e8888888228822888022088880880888888888888e77e8882777728888ee888">Goto Angry</Link>
        <br />
        <Link href="/details/0x9a9999999949949994944949ee9999eee499994e99400499999aa99999999999">Goto Blush</Link>
        <br />
        <Link href="/details/0x0008887000088888004f40f0004ff44f0004fff0088ccca070cccc8700500050">Goto Mario</Link>
      </section>
    </Layout>
  );
}
