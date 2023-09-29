import {Collection, getAllPixelcons, getAllCollectionNames} from '../src/lib/pixelcons';
import {searchPossibleDerivativeIndex, isDerivativePixelcon} from '../src/lib/similarities';
import {generateMetadata} from '../src/lib/metadata';
import {generateImage, generateIconSheet, generateHeader} from '../src/lib/imagedata';
import {promises as fs} from 'fs';
import path from 'path';
import 'dotenv/config';

//Data constants
const archiveDirectory = path.join(process.cwd(), 'archive');
const publicArchiveDirectory = path.join(process.cwd(), 'public/archive');

//Archive current state of the pixelcons contract
(async () => {
  //fetch data for all pixelcons and collection names
  console.log('fetching all pixelcon data... (this can take a while)');
  const pixelcons = await getAllPixelcons();
  const collectionNames = await getAllCollectionNames();

  ///////////////////////
  // Archive JSON Data //
  ///////////////////////

  //archive pixelcon data
  console.log('archiving pixelcon data...');
  await fs.writeFile(path.join(archiveDirectory, 'pixelcons.json'), JSON.stringify(pixelcons, null, 2));

  //archive pixelconIds
  const pixelconIds = pixelcons.map((pixelcon): string => pixelcon.id);
  await fs.writeFile(path.join(archiveDirectory, 'pixelconIds.json'), JSON.stringify(pixelconIds, null, 2));

  //archive pixelconCollections
  const collections = collectionNames.map((collectionName, collectionIndex): Collection => {
    const collectionPixelconIds = [];
    for (const pixelcon of pixelcons) {
      if (pixelcon.collection === collectionIndex) collectionPixelconIds.push(pixelcon.id);
    }
    return {
      index: collectionIndex,
      name: collectionName,
      pixelconIds: collectionPixelconIds,
    };
  });
  await fs.writeFile(path.join(archiveDirectory, 'pixelconCollections.json'), JSON.stringify(collections, null, 2));

  //archive pixelcon derivatives data
  //eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pixelconDerivatives: any = {};
  for (const pixelcon of pixelcons) {
    const index = searchPossibleDerivativeIndex(pixelcon.id, pixelconIds);
    if (index > -1 && isDerivativePixelcon(pixelcons[index], pixelcon)) {
      pixelconDerivatives[pixelcon.id] = pixelcons[index];
    }
  }
  await fs.writeFile(
    path.join(archiveDirectory, 'pixelconDerivatives.json'),
    JSON.stringify(pixelconDerivatives, null, 2),
  );

  //archive summary
  const datesFound: Set<number> = new Set<number>();
  const dates: {year: number; firstIndex: number}[] = [];
  for (const pixelcon of pixelcons) {
    const year = new Date(pixelcon.date).getFullYear();
    if (!datesFound.has(year)) {
      datesFound.add(year);
      dates.push({
        year,
        firstIndex: pixelcon.index,
      });
    }
  }
  const summary = {
    timestamp: new Date().getTime(),
    totalSupply: pixelcons.length,
    collectionTotal: collections.length,
    dates,
  };
  await fs.writeFile(path.join(archiveDirectory, 'pixelconArchive.json'), JSON.stringify(summary, null, 2));

  //////////////////////////
  // Public Archive Files //
  //////////////////////////

  //metadata
  await deleteAllFilesInDir(path.join(publicArchiveDirectory, 'meta'));
  const writePublicMetadataPromises = pixelcons.map((pixelcon): Promise<void> => {
    const collectionName = pixelcon.collection ? collectionNames[pixelcon.collection] : null;
    const similarPixelcon = pixelconDerivatives[pixelcon.id];
    const json = JSON.stringify(generateMetadata(pixelcon, similarPixelcon, collectionName));
    return fs.writeFile(path.join(publicArchiveDirectory, 'meta', `${pixelcon.id}.json`), json);
  });
  await Promise.all(writePublicMetadataPromises);

  //individual images
  await deleteAllFilesInDir(path.join(publicArchiveDirectory, 'image'));
  const writePublicImagesPromises = pixelcons.map((pixelcon): Promise<void> => {
    const image = generateImage(pixelcon.id);
    return fs.writeFile(path.join(publicArchiveDirectory, 'image', `${pixelcon.id}.png`), image);
  });
  await Promise.all(writePublicImagesPromises);

  //icon sheets
  await deleteAllFilesInDir(path.join(publicArchiveDirectory, 'icon'));
  const writePublicIconsPromises = [];
  for (let i = 0; i < pixelconIds.length; i += 1024) {
    const sheet = generateIconSheet(pixelconIds.slice(i, i + 1024));
    const filename = `${i.toString().padStart(5, '0')}-${(i + 1024).toString().padStart(5, '0')}.png`;
    writePublicIconsPromises.push(fs.writeFile(path.join(publicArchiveDirectory, 'icon', filename), sheet));
  }
  await Promise.all(writePublicIconsPromises);

  //header image
  if (pixelconIds.length >= 6) {
    const header = generateHeader(getRandomPretty(pixelconIds.slice(27, 84), 6));
    await fs.writeFile(path.join(publicArchiveDirectory, 'header.png'), header);
  }

  console.log('finished archiving pixelcon data.');
})();

//Helper function to clear all files in a folder
async function deleteAllFilesInDir(dirPath: string) {
  try {
    const files = await fs.readdir(dirPath);
    const deleteFilePromises = files.map((file) => fs.unlink(path.join(dirPath, file)));
    await Promise.all(deleteFilePromises);
  } catch (err) {
    console.log(err);
  }
}

//Helper function to get random pixelcons
function getRandom(list: string[], count: number): string[] {
  const listCopy = [...list];
  const random: string[] = [];
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * listCopy.length);
    random.push(listCopy.splice(index, 1)[0]);
  }
  return random;
}

//Helper function to look for the most visually appealing random set of pixelcons
function getRandomPretty(list: string[], count: number): string[] {
  //a set is "pretty" if it has a wide range of colors
  const maxTries = 100;
  const colorThreshold = 3 * count; //number of times a color must appear before it is counted
  const minColorCount = 9; //minimum number of colors to be "pretty"

  let pixelconSet: string[] = [];
  let pixelconSetColorCount: number = 0;
  for (let i = 0; i < maxTries; i++) {
    const randomSet = getRandom(list, count);
    const colorCounts = new Map<string, number>();
    for (const pixelconId of randomSet) {
      for (let j = 2; j < pixelconId.length; j++) {
        const color = pixelconId.charAt(j);
        if (color != '0') {
          colorCounts.set(color, colorCounts.has(color) ? colorCounts.get(color) + 1 : 1);
        }
      }
    }

    //is "pretty"?
    let colorCount = 0;
    colorCounts.forEach((value: number) => {
      if (value > colorThreshold) colorCount++;
    });
    if (colorCount >= minColorCount) {
      //is "pretty"
      pixelconSet = randomSet;
      pixelconSetColorCount = colorCount;
      break;
    } else if (colorCount > pixelconSetColorCount) {
      //at least remember the prettiest in case we don't find a full "pretty"
      pixelconSet = randomSet;
      pixelconSetColorCount = colorCount;
    }
  }

  //sort by how little black is in each pixelcon
  pixelconSet.sort((a: string, b: string) => {
    let blackCountA = 0;
    for (let j = 2; j < a.length; j++) if (a.charAt(j) == '0') blackCountA++;
    let blackCountB = 0;
    for (let j = 2; j < b.length; j++) if (b.charAt(j) == '0') blackCountB++;
    return blackCountA - blackCountB;
  });

  //order in a stagger
  for (let i = 0; i < pixelconSet.length / 2; i += 2) {
    const tmp = pixelconSet[i];
    pixelconSet[i] = pixelconSet[pixelconSet.length - 1 - i];
    pixelconSet[pixelconSet.length - 1 - i] = tmp;
  }
  return pixelconSet;
}
