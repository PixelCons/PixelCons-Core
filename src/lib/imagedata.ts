import {charCodeToColor, to256Hex} from './utils';
import upng from 'upng-js';

//Data constants
const imageScaleMultiplier = 2;
const iconScaleMultiplier = 2;

//Generates a PNG for the given pixelconId
export function generateImage(pixelconId: string): Uint8Array {
  if (pixelconId === null) return null;
  if (pixelconId === undefined) return undefined;
  pixelconId = to256Hex(pixelconId).substring(2);

  const width = 265 * imageScaleMultiplier;
  const height = 175 * imageScaleMultiplier;
  const pixelconScale = 15 * imageScaleMultiplier;
  const dataArray: Uint8Array = new Uint8Array(width * height * 4);
  for (let i = 3; i < width * height * 4; i += 4) {
    dataArray[i] = 255;
  }

  //draw the pixelcon
  if (pixelconId) {
    const offsetX = Math.round((width - pixelconScale * 8) / 2);
    const offsetY = Math.round((height - pixelconScale * 8) / 2);
    drawPixelcon(dataArray, width, height, offsetX, offsetY, pixelconScale, pixelconId);
  }

  return new Uint8Array(upng.encode([dataArray.buffer], width, height, 0));
}

//Generates a PNG as an embedable string for the given pixelconId
export function generateIcon(pixelconId: string): string {
  if (pixelconId === null) return null;
  if (pixelconId === undefined) return undefined;
  pixelconId = to256Hex(pixelconId).substring(2);

  const width = 8 * iconScaleMultiplier;
  const height = 8 * iconScaleMultiplier;
  const pixelconScale = 1 * iconScaleMultiplier;
  const dataArray: Uint8Array = new Uint8Array(width * height * 4);
  for (let i = 3; i < width * height * 4; i += 4) {
    dataArray[i] = 255;
  }

  //draw the pixelcon
  if (pixelconId) {
    const offsetX = Math.round((width - pixelconScale * 8) / 2);
    const offsetY = Math.round((height - pixelconScale * 8) / 2);
    drawPixelcon(dataArray, width, height, offsetX, offsetY, pixelconScale, pixelconId);
  }

  const image = new Uint8Array(upng.encode([dataArray.buffer], width, height, 0));
  return `data:image/png;base64,${Buffer.from(image).toString('base64')}`;
}

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
