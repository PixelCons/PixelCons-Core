import React from 'react';
import clsx from 'clsx';
import styles from './inputText.module.scss';

//Input text component
export default function InputText({
  label,
  disabled = false,
  width = 150,
  id = 'inputtext',
}: {
  label?: string;
  disabled?: boolean;
  width?: number;
  id?: string;
}) {
  //render
  return (
    <input
      type="input"
      className={clsx(styles.input, disabled && styles.disabled)}
      placeholder={label}
      name={id}
      id={id}
      style={{width: `${width}px`}}
      disabled={disabled}
    />
  );
}
