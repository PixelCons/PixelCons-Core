import type {Pixelcon, Collection} from '../src/lib/pixelcons';
import {decodeArchive} from './archive-codec.mjs';

// The build supplies exactly the first 10,000 records, once, in the HTML.
const packed = JSON.parse(document.getElementById('pixelcons-data')!.textContent!);
if (packed.b) {
  const columns = (globalThis as any).__pixelconColumns;
  for (const key of packed.b) packed[key] = columns[packed[key]];
  delete (globalThis as any).__pixelconColumns;
}
const data: {
  contract: string;
  rows: [string, string, string, number, number | null][];
  collections: Record<string, string>;
} = decodeArchive(packed, (globalThis as any).__pixelconIds);
delete (globalThis as any).__pixelconIds;
export const contract = data.contract;
export const pixelcons: Pixelcon[] = data.rows.map(([id, name, creator, date, collection], index) => ({
  id,
  name,
  creator,
  date,
  collection,
  index,
  owner: undefined,
}));
export const byId = new Map(pixelcons.map((pixelcon) => [pixelcon.id, pixelcon]));
export const pixelconIds = pixelcons.map((pixelcon) => pixelcon.id);
export const collections: Collection[] = Object.entries(data.collections).map(([index, name]) => ({
  index: Number(index),
  name,
  pixelconIds: pixelcons.filter((pixelcon) => pixelcon.collection === Number(index)).map((pixelcon) => pixelcon.id),
}));
export const byCollection = new Map(collections.map((collection) => [collection.index, collection]));
