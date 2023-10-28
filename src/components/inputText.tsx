import React, {useState} from 'react';
import clsx from 'clsx';
import {filterTextToByteSize} from '../lib/utils';
import styles from './inputText.module.scss';

//Input text component
export default function InputText({
  label,
  disabled = false,
  width = 150,
  id = 'inputtext',
  byteLimit = null,
  onChange = null,
}: {
  label?: string;
  disabled?: boolean;
  width?: number;
  id?: string;
  byteLimit?: number;
  onChange?: (value: string) => void;
}) {
  const [text, setText] = useState('');

  //on change function for the text
  const textChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const targetValue = ev && ev.target && ev.target.value ? ev.target.value : '';
    const newText = byteLimit ? filterTextToByteSize(targetValue, byteLimit) : targetValue;
    setText(newText);
    if (onChange) onChange(newText);
  };

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
      value={text}
      onChange={textChange}
    />
  );
}
