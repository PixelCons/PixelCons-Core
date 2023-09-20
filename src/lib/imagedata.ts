import {charCodeToColor, to256Hex} from './utils';
import upng from 'upng-js';

//Data constants
const imageScaleMultiplier = 2;
const iconScaleMultiplier = 1;
const identiconScaleMultiplier = 1;
const headerScaleMultiplier = 1;

//Define image cache
type ImageCache = {
  images: Map<string, Uint8Array>;
  identicons: Map<string, string>;
  icons: Map<string, string>;
};
const imageCache: ImageCache = {
  images: new Map<string, Uint8Array>(),
  identicons: new Map<string, string>(),
  icons: new Map<string, string>(),
};

//Generates a PNG as an embedable string for the given pixelconId
export function generateIcon(pixelconId: string): string {
  if (pixelconId === null) return null;
  if (pixelconId === undefined) return undefined;
  pixelconId = to256Hex(pixelconId).substring(2);

  //try to fetch from cache
  if (imageCache.icons.has(pixelconId)) {
    return imageCache.icons.get(pixelconId);
  }

  //draw the pixelcon
  const width = 8 * iconScaleMultiplier;
  const height = 8 * iconScaleMultiplier;
  const pixelconScale = 1 * iconScaleMultiplier;
  const dataArray: Uint8Array = new Uint8Array(width * height * 4);
  for (let i = 3; i < width * height * 4; i += 4) {
    dataArray[i] = 255;
  }
  drawPixelcon(dataArray, width, height, 0, 0, pixelconScale, pixelconId);

  //encode
  const image = new Uint8Array(upng.encode([dataArray.buffer], width, height, 0));
  const icon = `data:image/png;base64,${Buffer.from(image).toString('base64')}`;
  imageCache.icons.set(pixelconId, icon);
  return icon;
}

//Generates a PNG as an embedable string for the given pixelconId
export function generateIdenticon(seed: string): string {
  if (seed === null) return null;
  if (seed === undefined) return undefined;
  seed = seed.toLowerCase();

  //try to fetch from cache
  if (imageCache.identicons.has(seed)) {
    return imageCache.identicons.get(seed);
  }

  //get colors and image data
  const size = 8;
  const imageData = createIdenticonImageData(seed, size);

  //draw the pixelcon
  const width = size * identiconScaleMultiplier;
  const height = size * identiconScaleMultiplier;
  const dataArray: Uint8Array = new Uint8Array(width * height * 4);
  for (let i = 3; i < width * height * 4; i += 4) {
    dataArray[i] = 255;
  }
  //drawPixelcon(dataArray, width, height, 0, 0, pixelconScale, pixelconId);
  for (let i = 0; i < imageData.data.length; i++) {
    const color =
      imageData.data[i] == 0 ? imageData.bgcolor : imageData.data[i] == 1 ? imageData.color : imageData.spotcolor;
    const xPos = (i % size) * identiconScaleMultiplier;
    const yPos = Math.floor(i / size) * identiconScaleMultiplier;
    drawSquare(dataArray, width, height, xPos, yPos, identiconScaleMultiplier, identiconScaleMultiplier, color);
  }

  //encode
  const image = new Uint8Array(upng.encode([dataArray.buffer], width, height, 0));
  const icon = `data:image/png;base64,${Buffer.from(image).toString('base64')}`;
  imageCache.identicons.set(seed, icon);
  return icon;
}

//Generates a PNG for the given pixelconId
export function generateImage(pixelconId: string): Uint8Array {
  if (pixelconId === null) return null;
  if (pixelconId === undefined) return undefined;
  pixelconId = to256Hex(pixelconId).substring(2);

  //try to fetch from cache
  if (imageCache.images.has(pixelconId)) {
    return imageCache.images.get(pixelconId);
  }

  //draw the pixelcon
  const width = 265 * imageScaleMultiplier;
  const height = 175 * imageScaleMultiplier;
  const pixelconScale = 15 * imageScaleMultiplier;
  const dataArray: Uint8Array = new Uint8Array(width * height * 4);
  for (let i = 3; i < width * height * 4; i += 4) {
    dataArray[i] = 255;
  }
  const offsetX = Math.round((width - pixelconScale * 8) / 2);
  const offsetY = Math.round((height - pixelconScale * 8) / 2);
  drawPixelcon(dataArray, width, height, offsetX, offsetY, pixelconScale, pixelconId);

  //encode
  const image = new Uint8Array(upng.encode([dataArray.buffer], width, height, 0));
  imageCache.images.set(pixelconId, image);
  return image;
}

//Generates a PNG for the given pixelconIds in a grid
export function generateIconSheet(pixelconIds: string[]): Uint8Array {
  if (pixelconIds === null) return null;
  if (pixelconIds === undefined) return undefined;
  pixelconIds = pixelconIds.map((x) => to256Hex(x).substring(2));

  //draw the pixelcons
  const square = 32;
  const width = 8 * square * iconScaleMultiplier;
  const height = 8 * square * iconScaleMultiplier;
  const pixelconScale = 1 * iconScaleMultiplier;
  const dataArray: Uint8Array = new Uint8Array(width * height * 4);
  for (let i = 3; i < width * height * 4; i += 4) {
    dataArray[i] = 255;
  }
  for (let i = 0; i < pixelconIds.length; i++) {
    const offsetX = 8 * (i % square) * iconScaleMultiplier;
    const offsetY = 8 * Math.floor(i / square) * iconScaleMultiplier;
    drawPixelcon(dataArray, width, height, offsetX, offsetY, pixelconScale, pixelconIds[i]);
  }
  return new Uint8Array(upng.encode([dataArray.buffer], width, height, 0));
}

//Generates a PNG of the header image
export function generateHeader(pixelconIds: string[]): Uint8Array {
  if (pixelconIds === null) return null;
  if (pixelconIds === undefined) return undefined;
  pixelconIds = pixelconIds.map((x) => to256Hex(x).substring(2));

  //draw the pixelcons
  const squareW = 3;
  const squareH = 2;
  const spacing = 2;
  const width = (8 + spacing) * squareW * headerScaleMultiplier;
  const height = (8 + spacing) * squareH * headerScaleMultiplier;
  const pixelconScale = 1 * headerScaleMultiplier;
  const dataArray: Uint8Array = new Uint8Array(width * height * 4);
  for (let i = 0; i < pixelconIds.length; i++) {
    const offsetX = ((8 + spacing) * (i % squareW) + spacing / 2) * headerScaleMultiplier;
    const offsetY = ((8 + spacing) * Math.floor(i / squareW) + spacing / 2) * headerScaleMultiplier;
    drawPixelcon(dataArray, width, height, offsetX, offsetY, pixelconScale, pixelconIds[i]);
  }
  const header = new Uint8Array(upng.encode([dataArray.buffer], width, height, 0));
  return header;
}

/////////////////////////////
// Internal Util Functions //
/////////////////////////////

//Helper function to draw a square in the data array buffer
function drawSquare(
  dataArray: Uint8Array,
  arrayW: number,
  arrayH: number,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number[],
) {
  const xStart = Math.max(Math.min(x, arrayW), 0);
  const xEnd = Math.max(Math.min(x + w, arrayW), 0);
  const yStart = Math.max(Math.min(y, arrayH), 0);
  const yEnd = Math.max(Math.min(y + h, arrayH), 0);
  for (let x2 = xStart; x2 < xEnd; x2++) {
    for (let y2 = yStart; y2 < yEnd; y2++) {
      const index = (y2 * arrayW + x2) * 4;
      dataArray[index + 0] = color[0];
      dataArray[index + 1] = color[1];
      dataArray[index + 2] = color[2];
      dataArray[index + 3] = 255;
    }
  }
}

//Helper function to draw a pixelcon in the data array buffer
function drawPixelcon(
  dataArray: Uint8Array,
  arrayW: number,
  arrayH: number,
  x: number,
  y: number,
  s: number,
  id: string,
) {
  for (let i = 0; i < id.length; i++) {
    const color = charCodeToColor(id.charCodeAt(i));
    const xPos = x + (i % 8) * s;
    const yPos = y + Math.floor(i / 8) * s;
    drawSquare(dataArray, arrayW, arrayH, xPos, yPos, s, s, color);
  }
}

////////////////////////////////////
// Identicon Generation Functions //
////////////////////////////////////

//IdenticonImageData object type
export type IdenticonImageData = {
  data: number[];
  color: number[];
  bgcolor: number[];
  spotcolor: number[];
};

//Helper function to generate identicon image data
function createIdenticonImageData(seed: string, size: number): IdenticonImageData {
  const randseed: Array<number> = new Array(4);
  for (let i = 0; i < randseed.length; i++) randseed[i] = 0;
  for (let i = 0; i < seed.length; i++) {
    randseed[i % 4] = (randseed[i % 4] << 5) - randseed[i % 4] + seed.charCodeAt(i);
  }

  function rand(): number {
    // based on Java's String.hashCode(), expanded to 4 32bit values
    const t = randseed[0] ^ (randseed[0] << 11);
    randseed[0] = randseed[1];
    randseed[1] = randseed[2];
    randseed[2] = randseed[3];
    randseed[3] = randseed[3] ^ (randseed[3] >> 19) ^ t ^ (t >> 8);
    return (randseed[3] >>> 0) / ((1 << 31) >>> 0);
  }

  function createColor(): number[] {
    //saturation is the whole color spectrum
    const h = Math.floor(rand() * 360);
    //saturation goes from 40 to 100, it avoids greyish colors
    const s = (rand() * 60 + 40) / 100;
    //lightness can be anything from 0 to 100, but probabilities are a bell curve around 50%
    const l = ((rand() + rand() + rand() + rand()) * 25) / 100;

    //convert to RGB
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.floor(255 * f(0)), Math.floor(255 * f(8)), Math.floor(255 * f(4))];
  }

  //create image data
  const color = createColor();
  const bgcolor = createColor();
  const spotcolor = createColor();
  const width = size; // Only support square icons for now
  const height = size;

  const dataWidth = Math.ceil(width / 2);
  const mirrorWidth = width - dataWidth;

  const data: number[] = [];
  for (let y = 0; y < height; y++) {
    let row = [];
    for (let x = 0; x < dataWidth; x++) {
      // this makes foreground and background color to have a 43% (1/2.3) probability
      // spot color has 13% chance
      row[x] = Math.floor(rand() * 2.3);
    }
    const r = row.slice(0, mirrorWidth);
    r.reverse();
    row = row.concat(r);

    for (let i = 0; i < row.length; i++) {
      data.push(row[i]);
    }
  }

  return {
    data,
    color,
    bgcolor,
    spotcolor,
  };
}
