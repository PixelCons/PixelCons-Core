import React from 'react';
import styles from './dots.module.scss';

//Pulsing dots loading indicator component
export default function Dots({
  visible = true,
  size = 6,
  margin = 2,
  dim = false,
  delayed = false,
}: {
  visible?: boolean;
  size?: number;
  margin?: number;
  dim?: boolean;
  delayed?: boolean;
}) {
  //empty
  if (!visible) return null;

  //build style from props
  const containerStyle = {
    height: `${size}px`,
    margin: `0px 0px 0px ${margin}px`,
  };
  const dotStyle = {
    height: `${size}px`,
    width: `${size}px`,
    margin: `${margin}px`,
  };

  //choose styling
  let classStyle = dim ? styles.dotDim : styles.dot;
  if (delayed) classStyle = dim ? styles.dotDelayDim : styles.dotDelay;

  //render
  return (
    <span className={styles.container} style={containerStyle}>
      <span className={classStyle} style={dotStyle} />
      <span className={classStyle} style={dotStyle} />
      <span className={classStyle} style={dotStyle} />
    </span>
  );
}
