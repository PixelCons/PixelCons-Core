import {ethers} from 'ethers';

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
    if (hex.length < 42) return '0x' + hex.slice(2).padStart(64, '0');
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
