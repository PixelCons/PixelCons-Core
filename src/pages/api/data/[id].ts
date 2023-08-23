import {NextApiRequest, NextApiResponse} from 'next';
import {Pixelcon, getPixelcon, getAllPixelconIds, getCollectionName} from '../../../lib/pixelcons';
import {generateMetadata} from '../../../lib/metadata';
import {sanitizePixelconIdParam} from '../../../lib/utils';
import {searchPossibleDerivative, isDerivative} from '../../../lib/similarities';
import buildConfig from '../../../build.config';
import staticPixelconIds from '../../../../archive/pixelconIds.json' assert {type: 'json'};
import staticPixelconMetadata from '../../../../archive/pixelconMetadata.json' assert {type: 'json'};

//Data constants
const cacheMetadata = buildConfig.API_CACHE_METADATA || 1 * 60 * 60;
const cacheErrorServer = buildConfig.API_CACHE_ERROR_SERVER || 1 * 60;
const cacheErrorUnknown = buildConfig.API_CACHE_ERROR_UNKNOWN || 5 * 60;
const cacheErrorInvalid = buildConfig.API_CACHE_ERROR_INVALID || 12 * 60 * 60;

//API endpoint that gets metadata for a pixelcon
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pixelconId = sanitizePixelconIdParam(req.query.id);

  //send error for bad ID
  if (!pixelconId) {
    res.setHeader('Cache-Control', `public, max-age=${cacheErrorInvalid}, s-maxage=${cacheErrorInvalid}`);
    res.status(405).end();
    return;
  }

  //return from archived data if available
  for (let i = 0; i < staticPixelconIds.length; i++) {
    if (pixelconId == staticPixelconIds[i]) {
      res.setHeader('Cache-Control', `public, max-age=${cacheMetadata}, s-maxage=${cacheMetadata}`);
      res.status(200).setHeader('content-type', 'application/json; charset=utf-8').end(staticPixelconMetadata[i]);
      return;
    }
  }

  //make sure pixelcon exists
  const pixelcon = await getPixelcon(pixelconId);
  if (!pixelcon) {
    res.setHeader('Cache-Control', `public, max-age=${cacheErrorUnknown}, s-maxage=${cacheErrorUnknown}`);
    res.status(400).end();
    return;
  }

  try {
    //fetch and generate metadata
    const collectionName = pixelcon.collection ? await getCollectionName(pixelcon.collection) : null;
    const allPixelconIds = await getAllPixelconIds(0, pixelcon.index + 1);
    const index = searchPossibleDerivative(pixelcon.id, allPixelconIds);
    let similarPixelcon: Pixelcon = null;
    if (index > -1) {
      const originalPixelcon = await getPixelcon(allPixelconIds[index]);
      if (isDerivative(originalPixelcon, pixelcon)) similarPixelcon = originalPixelcon;
    }
    const metadata = generateMetadata(pixelcon, similarPixelcon, collectionName);

    //success
    res.setHeader('Cache-Control', `public, max-age=${cacheMetadata}, s-maxage=${cacheMetadata}`);
    res.status(200).json(metadata);
  } catch (e) {
    //internal error
    res.setHeader('Cache-Control', `public, max-age=${cacheErrorServer}, s-maxage=${cacheErrorServer}`);
    res.status(500).end();
  }
}
