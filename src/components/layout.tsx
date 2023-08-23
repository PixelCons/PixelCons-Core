import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import buildConfig from '../build.config';
import styles from './layout.module.css';
import utilStyles from '../styles/utils.module.css';

//Data constants
const webDomain = buildConfig.WEB_DOMAIN || '';

//Common layout component applied accross all pages
export default function Layout({children}: {children: React.ReactNode}) {
  return (
    <div>
      <Head>
        <title>PixelCons</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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

      <header className={styles.header}>
        <Image priority src="/images/icon.png" className={utilStyles.borderCircle} height={144} width={144} alt="" />
      </header>
      <main>{children}</main>
      {/* footer */}
    </div>
  );
}
