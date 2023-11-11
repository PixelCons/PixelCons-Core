import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import utilStyles from '../styles/utils.module.scss';
import textStyles from '../styles/text.module.scss';

export default function PageNotFound() {
  return (
    <div className={utilStyles.errorContainer}>
      <Link href={'/'} prefetch={false}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className={clsx(utilStyles.crispImage, textStyles.notSelectable)}
          width="100px"
          height="100px"
          src={'/images/showcase.png'}
        />
      </Link>
      <div className={utilStyles.errorH2}>
        <b>404:</b> Page not found
      </div>
    </div>
  );
}
