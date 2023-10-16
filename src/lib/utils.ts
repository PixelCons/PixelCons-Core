import {ethers} from 'ethers';

//Sanitizes the given pixelconId string with or without the '0x' prefix
export function sanitizePixelconIdParam(pixelconId: string | string[]): string {
  try {
    const id: string = singleString(pixelconId);
    const sanitized: string = id.indexOf('0x') == 0 ? id.toLowerCase() : `0x${id.toLowerCase()}`;
    if (sanitized.length == 66) {
      ethers.toBeHex(sanitized);
      return sanitized;
    }
  } catch (e) {
    //do nothing
  }
  return null;
}

//Returns the first url parameter
export function firstURLParam(key: string, url: string): string {
  const fullKeyStart = `?${key}=`;
  const fullKeyAnd = `&${key}=`;
  let keyStartIndex = url.indexOf(fullKeyStart);
  if (keyStartIndex < 0) keyStartIndex = url.indexOf(fullKeyAnd);

  //found
  if (keyStartIndex > -1) {
    const startIndex = keyStartIndex + fullKeyStart.length;
    const endAndIndex = url.indexOf('&', startIndex);
    return endAndIndex > -1 ? url.substring(startIndex, endAndIndex) : url.substring(startIndex);
  }

  //not found
  return undefined;
}

//Clears the given url parameter
export function clearURLParam(key: string, url: string): string {
  const fullKeyStart = `?${key}=`;
  const fullKeyAnd = `&${key}=`;
  let keyStartIndex = url.indexOf(fullKeyStart);
  if (keyStartIndex < 0) keyStartIndex = url.indexOf(fullKeyAnd);

  //found
  if (keyStartIndex > -1) {
    const endAndIndex = url.indexOf('&', keyStartIndex + fullKeyStart.length);
    const paramRemoved =
      endAndIndex > -1 ? url.substring(0, keyStartIndex) + url.substring(endAndIndex) : url.substring(0, keyStartIndex);
    return paramRemoved.indexOf('?') < 0 ? paramRemoved.replace('&', '?') : paramRemoved;
  }

  //not found
  return url;
}

//Returns the given string or the first string in an array of strings
export function singleString(item: string | string[]): string {
  if (item === undefined) return undefined;
  if (item === null) return null;
  if (typeof item === 'string') return item;
  return item[0];
}

//Converts the given item into a 256bit formatted hex string
export function to256Hex(item: string | number | bigint): string {
  try {
    const hex: string = ethers.toBeHex(item).toLowerCase();
    if (hex.length == 66) return hex;
    if (hex.length < 66) return '0x' + hex.slice(2).padStart(64, '0');
  } catch (e) {
    //do nothing
  }
  throw new Error(`Failed to convert ${item} to 256 bit hex`);
}

//Converts the given item into a 20byte formatted hex string
export function toAddress(item: string | number | bigint): string {
  try {
    const hex: string = ethers.toBeHex(item).toLowerCase();
    if (hex.length == 42) return hex;
    if (hex.length < 42) return '0x' + hex.slice(2).padStart(40, '0');
  } catch (e) {
    //do nothing
  }
  throw new Error(`Failed to convert ${item} to 160 bit address hex`);
}

//Converts the given item into a UTF8 string representation
export function toUtf8(item: string | number | bigint): string {
  try {
    let hex: string = ethers.toBeHex(item);
    while (hex[hex.length - 1] == '0' && hex[hex.length - 2] == '0') hex = hex.slice(0, hex.length - 2);
    return ethers.toUtf8String(hex);
  } catch (err) {
    //do nothing
  }
  return '';
}

//Converts the given utf8 string to a bytes representation
export function toBytes(item: string, fixedSize?: number): Uint8Array {
  try {
    if (fixedSize) {
      item = filterTextToByteSize(item, fixedSize);
      const padded = new Uint8Array(fixedSize);
      const bytes = ethers.toUtf8Bytes(item);
      for (let i = 0; i < bytes.length; i++) padded[i] = bytes[i];
      return padded;
    }
    return ethers.toUtf8Bytes(item);
  } catch (err) {
    //do nothing
  }
  return new Uint8Array(0);
}

//Converts the given millis into a readable date string
export function toDate(millis: string | number): string {
  if (millis) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const date = new Date(millis);
    const day = ('' + date.getDate()).padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return day + ' ' + month + ' ' + year;
  }
  return null;
}

//Converts the given millis into a readable date string
export function toMonthYear(millis: string | number): string {
  if (millis) {
    const date = new Date(millis);
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const year = date.getFullYear();
    return month + '/' + year;
  }
  return null;
}

//Converts the given string into an abbreviated string
export function toAbbreviatedString(item: string, maxChars = 12, offsetStart = 2, offsetEnd = 0): string {
  if (item.length <= maxChars) return item;
  if (maxChars > offsetStart + offsetEnd) {
    try {
      const half = maxChars / 2;
      return `${item.substring(0, offsetStart + Math.ceil(half))}…${item.substring(
        item.length - (offsetEnd + Math.floor(half)),
      )}`;
    } catch (e) {
      //do nothing
    }
  }
  throw new Error(`Failed to convert ${item} to 160 bit abbreviated address hex`);
}

//Returns the number or the fallback if null or undefined
export function numOr(num: number, or: number): number {
  if (num === null || num === undefined) return or;
  return num;
}

//Filters the given text down to the given byte size (utf8)
export function filterTextToByteSize(text: string, byteSize: number): string {
  for (let i = text.length; i >= 0; i--) {
    try {
      const sub = text.substring(0, i);
      const bytes = ethers.toUtf8Bytes(sub);
      if (bytes.length <= byteSize) return sub;
    } catch (e) {
      //do nothing
    }
  }
  return '';
}

//Gets a random subset of items from the given list
export function getRandomSubset(list: string[], count: number, seed = '0x5eed'): string[] {
  const from = list.map((s) => s);
  const to = [];
  let hash = ethers.keccak256(seed);
  for (let i = 0; i < count && i < list.length; i++) {
    hash = ethers.keccak256(hash);
    const index = parseInt((ethers.toBigInt(hash) % ethers.toBigInt(from.length)).toString());
    to.push(from.splice(index, 1)[0]);
  }
  return to;
}

//Color palette reference
export const colorPalette = [
  [0, 0, 0], //#000000
  [29, 43, 83], //#1D2B53
  [126, 37, 83], //#7E2553
  [0, 135, 81], //#008751
  [171, 82, 54], //#AB5236
  [95, 87, 79], //#5F574F
  [194, 195, 195], //#C2C3C7
  [255, 241, 232], //#FFF1E8
  [255, 0, 77], //#FF004D
  [255, 163, 0], //#FFA300
  [255, 255, 39], //#FFFF27
  [0, 231, 86], //#00E756
  [41, 173, 255], //#29ADFF
  [131, 118, 156], //#83769C
  [255, 119, 168], //#FF77A8
  [255, 204, 170], //#FFCCAA
];

//Gets the index in the color palette for the given hex string char code
export function charCodeToColorIndex(code: number): number {
  if (code >= 48 && code < 58) return code - 48;
  if (code >= 97 && code < 103) return code - 87;
  return 0;
}

//Gets the rgb color for the given hex string char code
export function charCodeToColor(code: number): number[] {
  return colorPalette[charCodeToColorIndex(code)];
}
