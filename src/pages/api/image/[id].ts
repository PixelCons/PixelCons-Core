import {NextApiRequest, NextApiResponse} from 'next';
import {generateImage} from '../../../lib/imagedata';
import {sanitizePixelconIdParam} from '../../../lib/utils';
import buildConfig from '../../../build.config';

//Data constants
const cacheImage = buildConfig.API_CACHE_IMAGE || 7 * 24 * 60 * 60;
const cacheErrorServer = buildConfig.API_CACHE_ERROR_SERVER || 1 * 60;
const cacheErrorInvalid = buildConfig.API_CACHE_ERROR_INVALID || 12 * 60 * 60;

//API endpoint that gets a png image for a pixelcon
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const pixelconId = sanitizePixelconIdParam(req.query.id);

  //send error for bad ID
  if (!pixelconId) {
    res.setHeader('Cache-Control', `public, max-age=${cacheErrorInvalid}, s-maxage=${cacheErrorInvalid}`);
    res.status(405).end();
    return;
  }

  try {
    //generate image data
    const imagedata = generateImage(pixelconId);

    //success
    res.setHeader('Cache-Control', `public, max-age=${cacheImage}, s-maxage=${cacheImage}`);
    res.status(200).setHeader('content-type', 'image/png').end(imagedata, 'binary');
  } catch (e) {
    //internal error
    res.setHeader('Cache-Control', `public, max-age=${cacheErrorServer}, s-maxage=${cacheErrorServer}`);
    res.status(500).end();
  }
}
