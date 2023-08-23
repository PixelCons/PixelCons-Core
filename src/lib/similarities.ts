import {Pixelcon} from './pixelcons';
import {colorPalette, charCodeToColorIndex} from './utils';

//Comparison result object type
export type CompareResult = {
  exactMatch: boolean;
  verySimilarMatch: boolean;
  similarMatch: boolean;
  rotationTranslationMirror: boolean;
  numPixelsDifferent: number;
};

//Search similar results object type
export type SearchResults = {
  pixelconIds: string[];
  compareResults: CompareResult[];
};

//Searches for all pixelcons similar to the given pixelcon
export function searchSimilar(pixelconId: string, allPixelconIds: string[]): SearchResults {
  const results: SearchResults = {
    pixelconIds: [],
    compareResults: [],
  };
  for (const otherPixelconId of allPixelconIds) {
    if (otherPixelconId != pixelconId) {
      const compareResult = compare(pixelconId, otherPixelconId);
      if (compareResult.similarMatch) {
        results.pixelconIds.push(otherPixelconId);
        results.compareResults.push(compareResult);
      }
    }
  }
  return results;
}

//Searches for a single pixelcon that came before the given pixelconId and is very similar (possible derivation)
export function searchPossibleDerivative(pixelconId: string, allPixelconIds: string[]): number {
  for (let i = 0; i < allPixelconIds.length; i++) {
    const otherPixelconId = allPixelconIds[i];
    if (otherPixelconId == pixelconId) break;

    //a pixelcon is considered possibly derivative if it's at least very similar
    const compareResult = compare(pixelconId, otherPixelconId);
    if (compareResult.verySimilarMatch) return i;
  }
  return -1;
}

//Returns true if the given pixelcon is a derivative of another
export function isDerivative(originalPixelcon: Pixelcon, derivativePixelcon: Pixelcon): boolean {
  const compareResult = compare(derivativePixelcon.id, originalPixelcon.id);

  //set a harsher standard if the creator matches
  if (originalPixelcon.creator == derivativePixelcon.creator) {
    if (compareResult.rotationTranslationMirror) {
      return compareResult.numPixelsDifferent == 0;
    } else {
      return compareResult.numPixelsDifferent <= 1;
    }
  }

  return compareResult.verySimilarMatch;
}

//Comparator function which returns match details
export function compare(pixelconId1: string, pixelconId2: string): CompareResult {
  const pixelconVariations = rotateTranslateMirror(toPixelconColorData(pixelconId1));
  const otherPixelcon = toPixelconColorData(pixelconId2);
  for (let i = 0; i < 15; i++) {
    let tolerance: number = 8;
    if (i != 0) tolerance = tolerance / 2;

    let delta: number = 0;
    let pixelDifference: number = 0;
    for (let j = 0; j < 64; j++) {
      const colorDifference = getColorDistance(pixelconVariations[i][j], otherPixelcon[j]);
      if (colorDifference > 0) pixelDifference++;
      delta += colorDifference;
    }

    //do we meet at least the minimum match requirements?
    if (delta <= tolerance) {
      const colorsCount = Math.max(countColors(pixelconVariations[i]), countColors(otherPixelcon));
      let tightTolerance: number = colorsCount * 0.6;
      if (i != 0) tightTolerance = tightTolerance / 2;
      if (colorsCount < 4) tightTolerance = tightTolerance / 2;
      if (colorsCount < 3) tightTolerance = tightTolerance / 3;

      return {
        exactMatch: delta == 0,
        verySimilarMatch: delta <= tightTolerance,
        similarMatch: true,
        rotationTranslationMirror: i > 0,
        numPixelsDifferent: pixelDifference,
      };
    }
  }

  return {
    exactMatch: false,
    verySimilarMatch: false,
    similarMatch: false,
    rotationTranslationMirror: false,
    numPixelsDifferent: 0,
  };
}

//Helper function to convert an id string into a decoded array of colors
function toPixelconColorData(pixelconId: string): Uint8Array {
  const pixelconColorData: Uint8Array = new Uint8Array(64);
  for (let i = 0; i < 64; i++) pixelconColorData[i] = charCodeToColorIndex(pixelconId.charCodeAt(i + 2));
  return pixelconColorData;
}

//Helper function to get rotation translation and mirror transforms of a decoded pixelcon
function rotateTranslateMirror(pixelconColorData: Uint8Array): Uint8Array[] {
  const pixelconVariations: Uint8Array[] = [];
  pixelconVariations.push(pixelconColorData);

  //rotate
  pixelconVariations.push(rotate(pixelconVariations[0]));
  pixelconVariations.push(rotate(pixelconVariations[1]));
  pixelconVariations.push(rotate(pixelconVariations[2]));
  pixelconVariations.push(rotate(pixelconVariations[3]));

  //translate
  pixelconVariations.push(translate(pixelconColorData, -1, -1));
  pixelconVariations.push(translate(pixelconColorData, -1, 0));
  pixelconVariations.push(translate(pixelconColorData, -1, 1));
  pixelconVariations.push(translate(pixelconColorData, 0, -1));
  pixelconVariations.push(translate(pixelconColorData, 0, 1));
  pixelconVariations.push(translate(pixelconColorData, 1, -1));
  pixelconVariations.push(translate(pixelconColorData, 1, 0));
  pixelconVariations.push(translate(pixelconColorData, 1, 1));

  //mirror
  pixelconVariations.push(mirror(pixelconColorData, true));
  pixelconVariations.push(mirror(pixelconColorData, false));

  return pixelconVariations;
}

//Helper function to rotate a decoded pixelcon
function rotate(pixelconColorData: Uint8Array): Uint8Array {
  const outBuffer: Uint8Array = new Uint8Array(64);
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      outBuffer[x * 8 + (7 - y)] = pixelconColorData[y * 8 + x];
    }
  }
  return outBuffer;
}

//Helper function to mirror a decoded pixelcon
function mirror(pixelconColorData: Uint8Array, xAxis?: boolean): Uint8Array {
  const outBuffer: Uint8Array = new Uint8Array(64);
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      if (xAxis) outBuffer[x * 8 + y] = pixelconColorData[(7 - x) * 8 + y];
      else outBuffer[x * 8 + y] = pixelconColorData[x * 8 + (7 - y)];
    }
  }
  return outBuffer;
}

//Helper function to translate a decoded pixelcon
function translate(pixelconColorData: Uint8Array, tx: number, ty: number): Uint8Array {
  const outBuffer = new Uint8Array(64);
  for (let x = 0; x < 8; x++) {
    for (let y = 0; y < 8; y++) {
      const nx = (x + 8 + tx) % 8;
      const ny = (y + 8 + ty) % 8;
      outBuffer[nx * 8 + ny] = pixelconColorData[x * 8 + y];
    }
  }
  return outBuffer;
}

//Helper function to count the number of colors in a decoded pixelcon
function countColors(pixelconColorData: Uint8Array): number {
  let count: number = 0;
  const found: boolean[] = [];
  for (let i = 0; i < pixelconColorData.length; i++) {
    const color: number = pixelconColorData[i];
    if (color != 0 && !found[color]) {
      found[color] = true;
      count++;
    }
  }
  return count;
}

// Helper function to get the distance between two color values according to the palette
function getColorDistance(c1: number, c2: number): number {
  const distance =
    Math.abs(colorPalette[c1][0] - colorPalette[c2][0]) +
    Math.abs(colorPalette[c1][1] - colorPalette[c2][1]) +
    Math.abs(colorPalette[c1][2] - colorPalette[c2][2]);
  return distance / (255 * 3);
}
