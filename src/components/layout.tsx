import React, {useEffect} from 'react';
import {useRouter} from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import buildConfig from '../build.config';
import clsx from 'clsx';
import styles from './layout.module.scss';
import utilStyles from '../styles/utils.module.scss';
import textStyles from '../styles/text.module.scss';
import archive from '../../archive/pixelconArchive.json' assert {type: 'json'};

//Data constants
const webDomain = buildConfig.WEB_DOMAIN || '';

//Common layout component applied accross all pages
export default function Layout({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const isBrowsing = router.pathname == '/';

  //report archive timestamp to console
  useEffect(() => {
    console.log(`Archive timestamp ${archive.timestamp} (${new Date(archive.timestamp)})`);
  }, []);

  return (
    <>
      <Head>
        <title>PixelCons</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/images/icon.png" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@PixelConsToken" />
        <meta name="twitter:title" content="PixelCons (An Open NFT Platform)" />
        <meta
          name="twitter:description"
          content="Only 8x8 and 16 colors, each PixelCon has to be unique and its data is fully on-chain. A platform started in 2018 for pixel artists and collectors!"
        />
        <meta name="twitter:image" content={`${webDomain}/img/large/card.png`} />
        <meta property="og:url" content={`${webDomain}/`} />
        <meta property="og:title" content="PixelCons (An Open NFT Platform)" />
        <meta
          property="og:description"
          content="Only 8x8 and 16 colors, each PixelCon has to be unique and its data is fully on-chain. A platform started in 2018 for pixel artists and collectors!"
        />
        <meta property="og:image" content={`${webDomain}/img/large/card.png`} />
      </Head>
      <main className={styles.content}>
        <div className={styles.nonFooterSectionContainer}>
          <div className={clsx(styles.header, textStyles.notSelectable)}>
            <div className={clsx(styles.button, utilStyles.button)}>
              <div className={utilStyles.icon}></div>
              <span>OPENSEA</span>
            </div>
            <div className={clsx(styles.logo, utilStyles.clickable)}>
              <div className={utilStyles.crispImage} />
              <span>PixelCons</span>
            </div>
            {!isBrowsing && (
              <Link className={clsx(styles.button, utilStyles.button)} href={'/'} prefetch={false}>
                <div className={utilStyles.icon} style={{backgroundImage: 'url(/icons/browse.svg)'}}></div>
                <span>BROWSE</span>
              </Link>
            )}
            {isBrowsing && (
              <Link className={clsx(styles.button, utilStyles.button)} href={'/create'} prefetch={false}>
                <div className={utilStyles.icon} style={{backgroundImage: 'url(/icons/add.svg)'}}></div>
                <span>CREATE</span>
              </Link>
            )}
          </div>
          {children}
          <div className={styles.footerSpacer}></div>
        </div>
        <div className={clsx(styles.footer, textStyles.notSelectable)}>footer</div>
      </main>
    </>
  );
}
