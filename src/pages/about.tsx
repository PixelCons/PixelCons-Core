import React from 'react';
import {GetStaticProps} from 'next';
import Layout from '../components/layout';
import Link from 'next/link';
import clsx from 'clsx';
import utilStyles from '../styles/utils.module.scss';
import textStyles from '../styles/text.module.scss';

//Static props for page pre building
export const getStaticProps: GetStaticProps = async () => {
  return {
    props: {},
  };
};

//The about page to explain pixelcons
export default function About() {
  //render
  return (
    <Layout>
      <div className={clsx(utilStyles.basicContainer, textStyles.center)}>
        <div className={utilStyles.basicSection}>
          <img className={clsx(utilStyles.crispImage, utilStyles.basicFeature)} src={'/images/showcase.png'} />
          <div className={utilStyles.basicDescription}>
            <div className={textStyles.title}>PixelCons</div>
            <div className={textStyles.lg}>Tiny On-Chain Pixel Art</div>
            <div className={textStyles.lg}>NFTs Since 2018</div>
          </div>
        </div>
        <div className={utilStyles.basicSection}>
          <div className={utilStyles.basicDescription}>
            <div className={clsx(textStyles.xl, textStyles.bold)}>What are PixelCons?</div>
            <br />
            <div className={clsx(textStyles.lg, textStyles.lowEmphasis)}>
              PixelCons are collectible NFTs featuring minimalist pixel art. 8x8 and only 16 colors, each PixelCon is
              unique and all {"it's"} data fits in the size of a hash. This open platform was started in 2018 to allow
              any artist to easily make digital collectibles within a shared ecosystem.
            </div>
          </div>
          <div className={utilStyles.basicFeature}>
            <Link href={'/'}>
              <div className={clsx(utilStyles.basicButton, textStyles.xl, textStyles.bold)}>
                <div
                  className={clsx(utilStyles.basicIcon, textStyles.xl)}
                  style={{backgroundImage: 'url(/icons/browse.svg)'}}
                ></div>
                <span>Browse</span>
              </div>
            </Link>
            <br />
            <Link href={'/create'}>
              <div className={clsx(utilStyles.basicButton, textStyles.xl, textStyles.bold)}>
                <div
                  className={clsx(utilStyles.basicIcon, textStyles.xl)}
                  style={{backgroundImage: 'url(/icons/add.svg)'}}
                ></div>
                <span>Create</span>
              </div>
            </Link>
          </div>
        </div>
        <div className={utilStyles.basicSection}>
          <img className={utilStyles.basicFeature} src={'/images/card_small.png'} />
          <div className={utilStyles.basicDescription}>
            <div className={clsx(textStyles.xl, textStyles.bold)}>PixelCons Origin Story</div>
            <br />
            <div className={clsx(textStyles.lg, textStyles.lowEmphasis)}>
              Read about the origin of PixelCons in the article from ONE37PM. In it is an interview with the lead
              developer and details how the project came together over three years ago before NFTs exploded to the
              status they have today.
            </div>
            <br />
            <a
              className={clsx(textStyles.lg, utilStyles.subtleLink)}
              href="https://www.one37pm.com/nft/pixelcons-2018-nft-pixel-art-project"
            >
              Read More
            </a>
          </div>
        </div>
        <div className={utilStyles.basicSection}>
          <div className={utilStyles.basicDescription}>
            <div className={clsx(textStyles.xl, textStyles.bold)}>What makes PixelCons Special?</div>
            <div className={clsx(textStyles.lg, textStyles.lowEmphasis, textStyles.left)}>
              <ul>
                <li>All data is fully on-chain</li>
                <li>Never any developer fees or royalties</li>
                <li>No hidden admin restrictions</li>
                <li>Completely open source</li>
              </ul>
            </div>
          </div>
          <div className={utilStyles.basicFeature}>
            <Link href={'/'}>
              <div
                className={clsx(utilStyles.basicButton, utilStyles.basicIcon, textStyles.largeIcon)}
                style={{backgroundImage: 'url(/icons/github.svg)'}}
              ></div>
            </Link>
            <Link href={'/'}>
              <div
                className={clsx(utilStyles.basicButton, utilStyles.basicIcon, textStyles.largeIcon)}
                style={{backgroundImage: 'url(/icons/x.svg)'}}
              ></div>
            </Link>
            <Link href={'/'}>
              <div
                className={clsx(utilStyles.basicButton, utilStyles.basicIcon, textStyles.largeIcon)}
                style={{backgroundImage: 'url(/icons/opensea.svg)'}}
              ></div>
            </Link>
            <Link href={'/'}>
              <div
                className={clsx(utilStyles.basicButton, utilStyles.basicIcon, textStyles.largeIcon)}
                style={{backgroundImage: 'url(/icons/discord.svg)'}}
              ></div>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
