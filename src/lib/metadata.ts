import {toDate} from './utils';
import {Pixelcon} from './pixelcons';
import buildConfig from '../build.config';

//Data constants
const webDomain = buildConfig.WEB_DOMAIN || '';
const genesisCount = buildConfig.METADATA_GENESIS_COUNT || 0;
const genesisYear = buildConfig.METADATA_GENESIS_YEAR || '';

//Metadata object type
export type Metadata = {
  'name': string;
  'description': string;
  'image': string;
  'image_url': string;
  'external_url': string;
  'home_url': string;
  'background_color': string;
  'color': string;
  'attributes'?: MetadataAttribute[];
};

//Metadata attribute object type
export type MetadataAttribute = {
  'trait_type': string;
  'value': string;
};

//HTML header data object type
export type HeaderData = {
  title: string;
  description: string;
  imageUrl: string;
};

//Generates the metadata for the given pixelcon
export function generateMetadata(pixelcon: Pixelcon, similarPixelcon: Pixelcon, collectionName: string): Metadata {
  if (pixelcon === null) return null;
  if (pixelcon === undefined) return undefined;

  //build name and description
  //eslint-disable-next-line no-irregular-whitespace
  const name: string = pixelcon.name ? `${pixelcon.name} #${pixelcon.index}` : `#${pixelcon.index}`;
  let description: string = `PixelCon #${pixelcon.index} - ${toDate(pixelcon.date)}`;
  if (similarPixelcon)
    description += ` - ⚠️Very similar to older [PixelCon #${similarPixelcon.index}](${webDomain}/details/${similarPixelcon.id})`;
  if (pixelcon.collection > 0) {
    description += ` - Collection ${pixelcon.collection}`;
    if (collectionName) description += ` [${collectionName}]`;
  }
  description += ` - Creator ${pixelcon.creator}`;

  //construct metadata
  const metadata: Metadata = {
    name: name,
    description: description,
    image: `${webDomain}/meta/image/${pixelcon.id}`,
    image_url: `${webDomain}/meta/image/${pixelcon.id}`,
    external_url: `${webDomain}/details/${pixelcon.id}`,
    home_url: `${webDomain}/details/${pixelcon.id}`,
    background_color: '000000',
    color: '000000',
    attributes: [],
  };

  //add attributes
  if (pixelcon.index < 100) {
    metadata['attributes'].push({
      trait_type: 'Attributes',
      value: 'First 100',
    });
  }
  if (pixelcon.index < genesisCount) {
    metadata['attributes'].push({
      trait_type: 'Attributes',
      value: genesisYear ? `${genesisYear} Genesis` : 'Genesis',
    });
  }
  if (pixelcon.collection) {
    metadata['attributes'].push({
      trait_type: 'Attributes',
      value: 'Collectible',
    });
  }
  if (!similarPixelcon || similarPixelcon.creator == pixelcon.creator) {
    metadata['attributes'].push({
      trait_type: 'Attributes',
      value: 'Unique',
    });
  }

  return metadata;
}

//Gets the data required for displaying web header data
export function getHTMLHeaderData(pixelcon) {
  if (pixelcon === null) return null;
  if (pixelcon === undefined) return undefined;

  //build name and description
  const name: string = pixelcon.name ? `PixelCon [${pixelcon.name}]` : 'PixelCon';
  let description: string = `PixelCon #${pixelcon.index} - ${toDate(pixelcon.date)}`;
  if (pixelcon.collection > 0) {
    description += ` - Collection ${pixelcon.collection}`;
  }
  description += ` - Creator ${pixelcon.creator}`;

  return {
    title: name,
    description: description,
    imageUrl: `${webDomain}/meta/image/${pixelcon.id}`,
  };
}
