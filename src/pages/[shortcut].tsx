import React, {useEffect} from 'react';
import {useRouter} from 'next/router';
import PageNotFound from './404';
import pixelconIds from '../../archive/pixelconIds.json' assert {type: 'json'};

//Handles legacy shortcut URLs without requiring middleware.
export default function Shortcut() {
  const router = useRouter();
  const shortcut = typeof router.query.shortcut === 'string' ? router.query.shortcut : null;
  const pixelconId = getShortcutPixelconId(shortcut);

  useEffect(() => {
    if (pixelconId) {
      router.replace(`/details/${pixelconId}`);
    }
  }, [pixelconId, router]);

  if (pixelconId) return null;
  return <PageNotFound />;
}

function getShortcutPixelconId(shortcut: string): string | null {
  const index = decodeShortcut(shortcut);
  return index === null ? null : pixelconIds[index] || null;
}

function decodeShortcut(shortcut: string): number | null {
  if (!shortcut) return null;

  const decimal = decodeDecimal(shortcut);
  if (decimal !== null) return decimal;

  const hex = decodeHex(shortcut);
  if (hex !== null) return hex;

  const base64 = decodeBase64(shortcut);
  if (base64 !== null) return base64;

  return null;
}

function decodeDecimal(shortcut: string): number | null {
  if (!/^\d+$/.test(shortcut)) return null;
  return parseInt(shortcut, 10);
}

function decodeHex(shortcut: string): number | null {
  if (!/^x[0-9a-f]+$/.test(shortcut)) return null;
  return parseInt(shortcut.substring(1), 16);
}

function decodeBase64(shortcut: string): number | null {
  if (shortcut.charAt(0) !== '_') return null;

  const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-'.split('');
  let result = 0;
  for (let i = 1; i < shortcut.length; i++) {
    const value = digits.indexOf(shortcut.charAt(i));
    if (value === -1) return null;
    result = (result << 6) + value;
  }
  return result;
}
