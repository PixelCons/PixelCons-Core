import {colorPalette} from './utils';
import upng from 'upng-js';

//Configuration constants
const frameColorDist = 0.05;
const maxColorDist = 0.1;

//Frame details object type
type FrameDetails = {
  color: number[];
  cols: number[][];
  rows: number[][];
};

//Decodes the given pixelcon png file
export async function decodePNGFile(file: File): Promise<string[]> {
  try {
    const data = await readFile(file);
    const img = upng.decode(data);
    const rgba = new Uint8Array(upng.toRGBA8(img)[0]);

    //check if the image seems to have a frame
    const frameDetails = getFrameDetails(img.width, img.height, rgba);
    if (frameDetails) {
      //loop through the rows and columns and fill id data
      const ids = [];
      for (let r = 0; r < frameDetails.rows.length; r++) {
        const rStart = frameDetails.rows[r][0];
        const rLength = frameDetails.rows[r][1] - frameDetails.rows[r][0];
        for (let c = 0; c < frameDetails.cols.length; c++) {
          const cStart = frameDetails.cols[c][0];
          const cLength = frameDetails.cols[c][1] - frameDetails.cols[c][0];
          const id = getPixelconIdFromBuffer(cStart, rStart, cLength, rLength, img.width, img.height, rgba);
          if (id) ids.push(id);
        }
      }
      if (ids.length > 0) return ids;
      throw 'Failed to decode file';
    } else {
      //simple image
      const id = getPixelconIdFromBuffer(0, 0, img.width, img.height, img.width, img.height, rgba);
      if (id) return [id];
      throw 'Failed to decode file';
    }
  } catch (err) {
    if (err == 'The input is not a PNG file!') throw 'The given file is not a PNG file';
    else throw 'Failed to decode file';
  }
}

/////////////////////////////
// Internal Util Functions //
/////////////////////////////

//Reads data from the given file
export async function readFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = function () {
      reject(fr.error);
    };
    fr.onloadend = function () {
      if (fr.result instanceof ArrayBuffer) {
        resolve(fr.result);
      } else {
        const textEncoder = new TextEncoder();
        resolve(textEncoder.encode(fr.result));
      }
    };
    fr.readAsArrayBuffer(file);
  });
}

//Determines details of an image frame
function getFrameDetails(w: number, h: number, buf: Uint8Array): FrameDetails {
  const frameColor = getFrameColor(w, h, buf);
  if (frameColor) {
    const frameDetails: FrameDetails = {
      color: frameColor,
      cols: [],
      rows: [],
    };

    //fill columns
    let cStart = 0;
    let cEnd = 0;
    for (let x = 0; x < w; x++) {
      if (cStart <= cEnd) {
        //on border
        if (!verifyVerticalColor(x, frameColor, w, h, buf)) {
          //start of image
          cStart = x;
        }
      } else {
        //on image
        if (verifyVerticalColor(x, frameColor, w, h, buf)) {
          //end of image
          cEnd = x;
          frameDetails.cols.push([cStart, cEnd]);
        }
      }
    }

    //fill rows
    let rStart = 0;
    let rEnd = 0;
    for (let y = 0; y < h; y++) {
      if (rStart <= rEnd) {
        //on border
        if (!verifyHorizontalColor(y, frameColor, w, h, buf)) {
          //start of image
          rStart = y;
        }
      } else {
        //on image
        if (verifyHorizontalColor(y, frameColor, w, h, buf)) {
          //end of image
          rEnd = y;
          frameDetails.rows.push([rStart, rEnd]);
        }
      }
    }

    return frameDetails;
  }
  return null;
}

//Verifies if the given color goes all the way along the vertical
function verifyVerticalColor(x: number, color: number[], w: number, h: number, buf: Uint8Array): boolean {
  for (let y = 0; y < h; y++) {
    if (getColorDistance(color, getColorAtPosition(x, y, w, buf)) > 0) return false;
  }
  return true;
}

//Verifies if the given color goes all the way along the horizontal
function verifyHorizontalColor(y: number, color: number[], w: number, h: number, buf: Uint8Array): boolean {
  for (let x = 0; x < w; x++) {
    if (getColorDistance(color, getColorAtPosition(x, y, w, buf)) > 0) return false;
  }
  return true;
}

//Searches for a common frame color from given image
function getFrameColor(w: number, h: number, buf: Uint8Array): number[] {
  const frameColor = getColorAtPosition(0, 0, w, buf);
  if (getPaletteColorHex(frameColor, frameColorDist) !== null) return null;

  //verify the border is all the same color
  for (let x = 0; x < w; x++) {
    if (
      getColorDistance(frameColor, getColorAtPosition(x, 0, w, buf)) > 0 ||
      getColorDistance(frameColor, getColorAtPosition(x, h - 1, w, buf)) > 0
    ) {
      return null;
    }
  }
  for (let y = 0; y < h; y++) {
    if (
      getColorDistance(frameColor, getColorAtPosition(0, y, w, buf)) > 0 ||
      getColorDistance(frameColor, getColorAtPosition(w - 1, y, w, buf)) > 0
    ) {
      return null;
    }
  }

  return frameColor;
}

//Samples the buffer from the given position and size
function getPixelconIdFromBuffer(
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  w: number,
  h: number,
  buf: Uint8Array,
): string {
  if (w >= 8 && h >= 8) {
    const dx = sw / 8;
    const dy = sh / 8;

    let id = '0x';
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const color = getColorAtPosition(sx + Math.floor(dx * x + dx / 2), sy + Math.floor(dy * y + dy / 2), w, buf);
        const colorHex = getPaletteColorHex(color, maxColorDist);
        if (!colorHex) return null;
        id += colorHex;
      }
    }
    if (id == '0x0000000000000000000000000000000000000000000000000000000000000000') return null;
    return id;
  }

  return null;
}

//Gets the closest palette color from the given color
function getColorAtPosition(x: number, y: number, w: number, buf: Uint8Array): number[] {
  const index = (y * w + x) * 4;
  return [buf[index + 0], buf[index + 1], buf[index + 2]];
}

//Gets the closest palette color from the given color
function getPaletteColorHex(color: number[], maxDist: number): string {
  let bestColor: string = null;
  let bestColorDistance = 1.0;
  for (let i = 0; i < colorPalette.length; i++) {
    const cpColor = colorPalette[i];
    const distance = getColorDistance(color, cpColor);
    if (distance < bestColorDistance && distance < maxDist) {
      bestColorDistance = distance;
      bestColor = i.toString(16);
    }
  }
  return bestColor;
}

//Gets the distance between two colors (0.0 - 1.0)
function getColorDistance(c1: number[], c2: number[]): number {
  const d = [c1[0] - c2[0], c1[1] - c2[1], c1[2] - c2[2]];
  const dist = Math.sqrt(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
  const max = Math.sqrt(255 * 255 + 255 * 255 + 255 * 255);

  return dist / max;
}
