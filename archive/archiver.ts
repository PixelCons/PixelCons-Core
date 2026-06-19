import {Collection, Pixelcon, getAllPixelcons, getAllCollectionNames, getTotalPixelcons} from '../src/lib/pixelcons';
import {searchPossibleDerivativeIndex, isDerivativePixelcon} from '../src/lib/similarities';
import {generateMetadata} from '../src/lib/metadata';
import {generateImage, generateIconSheet} from '../src/lib/imagedata';
import {promises as fs} from 'fs';
import path from 'path';
import 'dotenv/config';

//Data constants
const archiveDirectory = path.join(process.cwd(), 'archive');
const publicImagesDirectory = path.join(process.cwd(), 'public/images');
const publicMetaDirectory = path.join(process.cwd(), 'public/meta');

//Archive current state of the pixelcons contract
(async () => {
  //fetch only new pixelcon data when the archive already has the current supply
  console.log('checking current pixelcon supply...');
  const totalPixelcons = await getTotalPixelcons();
  console.log('loading archived pixelcon data...');
  const archivedPixelcons = await readArchivedPixelcons();
  const archivedTotal = archivedPixelcons && archiveCanBeExtended(archivedPixelcons) ? archivedPixelcons.length : 0;
  if (archivedPixelcons && archivedTotal === totalPixelcons) {
    console.log('no new pixelcon data to archive');
    return;
  }

  //fetch pixelcon data
  let pixelcons: Pixelcon[];
  if (archivedTotal > 0 && archivedTotal < totalPixelcons) {
    console.log(`fetching ${totalPixelcons - archivedTotal} new pixelcon records...`);
    const newPixelcons = await getAllPixelcons(archivedTotal, totalPixelcons);
    assertArrayFetched(newPixelcons, 'new pixelcons');
    pixelcons = archivedPixelcons.concat(newPixelcons);
  } else {
    console.log('fetching all pixelcon data... (this can take a while)');
    pixelcons = await getAllPixelcons(0, totalPixelcons);
    assertArrayFetched(pixelcons, 'pixelcons');
  }
  pixelcons.sort((a, b) => a.index - b.index);

  //fetch collection names
  console.log('fetching collection names...');
  const collectionNames = await getAllCollectionNames();
  assertArrayFetched(collectionNames, 'collection names');

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

  //////////////////
  // Public Files //
  //////////////////

  //metadata
  await deleteAllFilesInDir(path.join(publicMetaDirectory, 'data'));
  const writePublicMetadataPromises = pixelcons.map((pixelcon): Promise<void> => {
    const collectionName = pixelcon.collection ? collectionNames[pixelcon.collection] : null;
    const similarPixelcon = pixelconDerivatives[pixelcon.id];
    const json = JSON.stringify(generateMetadata(pixelcon, similarPixelcon, collectionName));
    return fs.writeFile(path.join(publicMetaDirectory, 'data', `${pixelcon.id}.json`), json);
  });
  await Promise.all(writePublicMetadataPromises);

  //individual images
  await deleteAllFilesInDir(path.join(publicMetaDirectory, 'image'));
  const writePublicImagesPromises = pixelcons.map((pixelcon): Promise<void> => {
    const image = generateImage(pixelcon.id);
    return fs.writeFile(path.join(publicMetaDirectory, 'image', `${pixelcon.id}.png`), image);
  });
  await Promise.all(writePublicImagesPromises);

  //icon sheets
  await deleteAllFilesInDir(path.join(publicImagesDirectory, 'icon'));
  const writePublicIconsPromises = [];
  for (let i = 0; i < pixelconIds.length; i += 1024) {
    const sheet = generateIconSheet(pixelconIds.slice(i, i + 1024));
    const filename = `${i.toString().padStart(5, '0')}-${(i + 1024).toString().padStart(5, '0')}.png`;
    writePublicIconsPromises.push(fs.writeFile(path.join(publicImagesDirectory, 'icon', filename), sheet));
  }
  await Promise.all(writePublicIconsPromises);

  console.log('finished archiving pixelcon data.');
})().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

//Helper function to fail before writing invalid archive data
function assertArrayFetched<T>(value: T[], label: string): asserts value is T[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `Unable to fetch ${label}. Check that JSON_RPC is set to a working Ethereum RPC endpoint and try again.`,
    );
  }
}

//Helper function to load current archived pixelcons
async function readArchivedPixelcons(): Promise<Pixelcon[]> {
  try {
    const json = await fs.readFile(path.join(archiveDirectory, 'pixelcons.json'), 'utf8');
    const pixelcons = JSON.parse(json);
    return Array.isArray(pixelcons) ? pixelcons : undefined;
  } catch {
    return undefined;
  }
}

//Helper function to make sure archived indexes align with append-only contract indexes
function archiveCanBeExtended(pixelcons: Pixelcon[]): boolean {
  return pixelcons.every((pixelcon, index) => pixelcon && pixelcon.index === index);
}

//Helper function to clear all files in a folder
async function deleteAllFilesInDir(dirPath: string) {
  try {
    try {
      //make sure folder exists, then delete all files
      await fs.access(dirPath);
      const files = await fs.readdir(dirPath);
      const deleteFilePromises = files.map((file) => fs.unlink(path.join(dirPath, file)));
      await Promise.all(deleteFilePromises);
    } catch {
      //create the folder
      await fs.mkdir(dirPath);
    }
  } catch (err) {
    console.log(err);
  }
}
