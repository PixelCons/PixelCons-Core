import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import {generateIdenticon} from '../lib/imagedata';
import {useENS} from '../lib/web3';
import {toAddress, toAbbreviatedString} from '../lib/utils';
import styles from './address.module.scss';
import utilStyles from '../styles/utils.module.scss';

//Pixelcon filter component to display filter options
export default function Address({
  addr,
  maxChars = 42,
  abbrChars = 10,
  showIdenticon = true,
  linkOwner = false,
  linkCreator = false,
}: {
  addr: string;
  maxChars?: number;
  abbrChars?: number;
  showIdenticon?: boolean;
  linkOwner?: boolean;
  linkCreator?: boolean;
}) {
  const {name} = useENS(addr);

  //abbreviate address/name
  const fullAddr = getENSAbbr(name, maxChars) || getHexAbbr(addr, maxChars);
  const abbrAddr = getENSAbbr(name, abbrChars) || getHexAbbr(addr, abbrChars);

  //generate identicon
  const identiconStyle = {
    backgroundImage: `url(${generateIdenticon(addr)})`,
  };

  //copy address
  const copyFunc = () => {
    try {
      navigator.clipboard.writeText(addr);
    } catch (e) {
      //do nothing
    }
  };

  //render
  const link = linkOwner ? `/?owner=${addr}` : linkCreator ? `/?creator=${addr}` : null;
  const innerElements = (
    <>
      {showIdenticon && (
        <span className={clsx(styles.identicon, utilStyles.icon, utilStyles.crispImage)} style={identiconStyle}></span>
      )}
      <span className={styles.hideOnSmall}>{fullAddr}</span>
      <span className={styles.hideOnNotSmall}>{abbrAddr}</span>
    </>
  );
  const copyButton = (
    <span
      className={clsx(styles.copy, styles.hideOnSmall, !!link && styles.offLink, utilStyles.icon, utilStyles.clickable)}
      onClick={copyFunc}
    ></span>
  );
  if (link) {
    //as link
    return (
      <div className={styles.container}>
        <Link href={link} prefetch={false}>
          {innerElements}
        </Link>
        {copyButton}
      </div>
    );
  }
  return (
    <div className={styles.container}>
      {innerElements}
      {copyButton}
    </div>
  );
}

//helper function to get the abbreviated address hex
function getHexAbbr(str: string, maxChars: number): string | null {
  try {
    return toAbbreviatedString(toAddress(str), maxChars, 2);
  } catch (e) {
    return null;
  }
}

//helper function to get the abbreviated address hex
function getENSAbbr(str: string, maxChars: number): string | null {
  try {
    return toAbbreviatedString(str, maxChars, 0, 4);
  } catch (e) {
    return null;
  }
}
