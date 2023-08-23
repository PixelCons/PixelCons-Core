import {Collection, getAllPixelcons, getAllCollectionNames} from '../src/lib/pixelcons';
import {searchPossibleDerivative, isDerivative} from '../src/lib/similarities';
import {generateMetadata} from '../src/lib/metadata';
import {promises as fs} from 'fs';
import path from 'path';
import 'dotenv/config';

//Archive current state of the pixelcons contract
(async () => {
  //fetch data for all pixelcons and collection names
  console.log('fetching all pixelcon data... (this can take a while)');
  const pixelcons = await getAllPixelcons();
  const collectionNames = await getAllCollectionNames();

  //archive pixelcon data
  console.log('archiving pixelcon data...');
  const archiveDirectory = path.join(process.cwd(), 'archive');
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
    const index = searchPossibleDerivative(pixelcon.id, pixelconIds);
    if (index > -1 && isDerivative(pixelcons[index], pixelcon)) {
      pixelconDerivatives[pixelcon.id] = pixelcons[index];
    }
  }
  await fs.writeFile(
    path.join(archiveDirectory, 'pixelconDerivatives.json'),
    JSON.stringify(pixelconDerivatives, null, 2),
  );

  //archive pixelcon metadata
  const pixelconMetadata = pixelcons.map((pixelcon): string => {
    const collectionName = pixelcon.collection ? collectionNames[pixelcon.collection] : null;
    const similarPixelcon = pixelconDerivatives[pixelcon.id];
    return JSON.stringify(generateMetadata(pixelcon, similarPixelcon, collectionName));
  });
  await fs.writeFile(path.join(archiveDirectory, 'pixelconMetadata.json'), JSON.stringify(pixelconMetadata, null, 2));

  console.log('finished archiving pixelcon data.');
})();
