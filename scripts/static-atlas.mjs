import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { encodePatterns } from "./static-patterns.mjs";

export async function prepareAtlas(pixelcons, columns, patterns = false) {
  const source = await readFile(
    new URL("../src/lib/utils.ts", import.meta.url),
    "utf8",
  );
  const palette = JSON.parse(
    source
      .match(/export const colorPalette = (\[[\s\S]*?\n\]);/)[1]
      .replace(/\/\/[^\n]*/g, "")
      .replace(/,\s*]/g, "]"),
  );
  if (patterns)
    return {
      buffer: encodePatterns(pixelcons, palette, columns),
      mime: "image/x-pixelcons-template",
      method: "templates",
      columns,
      rows: Math.ceil(pixelcons.length / columns),
    };
  const rows = Math.ceil(pixelcons.length / columns),
    width = columns * 8,
    height = rows * 8;
  const pixels = Buffer.alloc(width * height * 4);
  for (let i = 3; i < pixels.length; i += 4) pixels[i] = 255;
  for (let token = 0; token < pixelcons.length; token++) {
    const id = pixelcons[token].id.slice(2),
      left = (token % columns) * 8,
      top = Math.floor(token / columns) * 8;
    for (let p = 0; p < 64; p++) {
      const target = ((top + (p >> 3)) * width + left + (p & 7)) * 4,
        rgb = palette[parseInt(id[p], 16)];
      for (let channel = 0; channel < 3; channel++)
        pixels[target + channel] = rgb[channel];
    }
  }
  const image = sharp(pixels, { raw: { width, height, channels: 4 } });
  const buffer = await image.webp({ lossless: true, effort: 6 }).toBuffer();
  if (!pixels.equals(await sharp(buffer).ensureAlpha().raw().toBuffer()))
    throw Error("Atlas pixels changed");
  return { buffer, mime: "image/webp", method: "atlas", columns, rows };
}
