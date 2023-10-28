import {NextApiRequest, NextApiResponse} from 'next';
import {Pixelcon, getPixelcon, getAllPixelconIds, getCollectionName} from '../../../lib/pixelcons';
import {generateMetadata} from '../../../lib/metadata';
import {sanitizePixelconIdParam} from '../../../lib/utils';
import {searchPossibleDerivative, isDerivativePixelcon} from '../../../lib/similarities';
import buildConfig from '../../../build.config';

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
    const similarPixelconId = searchPossibleDerivative(pixelcon.id, allPixelconIds);
    let similarPixelcon: Pixelcon = null;
    if (similarPixelconId) {
      const originalPixelcon = await getPixelcon(similarPixelconId);
      if (isDerivativePixelcon(originalPixelcon, pixelcon)) similarPixelcon = originalPixelcon;
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
