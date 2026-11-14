import { readFile } from "node:fs/promises";
import sharp from "sharp";
// Clear only cells outside the gallery limit, preserving the sheet's 256x256 layout.
export async function trimUnusedSpriteCells(
  original,
  firstIndex,
  limit = 10000,
) {
  const { data, info } = await sharp(original)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const kept = Math.max(0, Math.min(1024, limit - firstIndex));
  if (kept === 1024) return original;
  for (let token = kept; token < 1024; token++) {
    const left = (token % 32) * 8,
      top = Math.floor(token / 32) * 8;
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 8; x++) {
        const p = ((top + y) * info.width + left + x) * 4;
        data[p] = data[p + 1] = data[p + 2] = 0;
        data[p + 3] = 255;
      }
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();
}
// Precomputed with oxipng6; no WASM/optimizer code is shipped to the browser.
// Validate every pixel against fresh source data before selecting a cache entry.
export async function strongerPNG(file, expectedRGBA) {
  const name =
    file === "/favicon.ico"
      ? "favicon.png"
      : file === "/images/icon/01024-02048.png"
        ? "icon-01024-02048.png"
        : null;
  if (!name) return null;
  const buffer = await readFile(
    new URL("./asset-cache/" + name, import.meta.url),
  );
  return expectedRGBA.equals(await sharp(buffer).ensureAlpha().raw().toBuffer())
    ? { buffer, mime: "image/png", method: "oxipng6-cache" }
    : null;
}
