import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { trimUnusedSpriteCells, strongerPNG } from "./static-raster-extra.mjs";

export function svgDataURI(bytes) {
  const svg = bytes
    .toString("utf8")
    .replace(/<\?xml[^?]*\?>\s*/g, "")
    .replace(/\s+version="1\.1"/g, "")
    .replace(/>\s+</g, "><")
    .trim();
  return (
    "data:image/svg+xml," +
    svg.replace(
      /[%#"'()<>\\\s?]/g,
      (char) => "%" + char.charCodeAt(0).toString(16).padStart(2, "0"),
    )
  );
}
export function decodeICO(buffer) {
  if (
    buffer.readUInt16LE(0) !== 0 ||
    buffer.readUInt16LE(2) !== 1 ||
    buffer.readUInt16LE(4) !== 1
  )
    throw new Error("Expected one ICO image");
  const entry = 6,
    length = buffer.readUInt32LE(entry + 8),
    offset = buffer.readUInt32LE(entry + 12);
  const dib = buffer.subarray(offset, offset + length);
  if (
    dib.readUInt32LE(0) !== 40 ||
    dib.readUInt16LE(14) !== 32 ||
    dib.readUInt32LE(16) !== 0
  )
    throw new Error("Unsupported ICO DIB");
  const width = dib.readInt32LE(4),
    height = dib.readInt32LE(8) / 2;
  const pixels = Buffer.alloc(width * height * 4),
    maskStride = Math.ceil(width / 32) * 4,
    maskOffset = 40 + width * height * 4;
  let hasAlpha = false;
  for (let i = 40 + 3; i < maskOffset; i += 4) if (dib[i]) hasAlpha = true;
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const source = 40 + ((height - 1 - y) * width + x) * 4,
        target = (y * width + x) * 4;
      pixels[target] = dib[source + 2];
      pixels[target + 1] = dib[source + 1];
      pixels[target + 2] = dib[source];
      pixels[target + 3] = hasAlpha
        ? dib[source + 3]
        : dib[maskOffset + (height - 1 - y) * maskStride + (x >> 3)] &
            (0x80 >> (x % 8))
          ? 0
          : 255;
    }
  return { pixels, width, height };
}
export async function prepareRaster(root) {
  const files = [
    "/images/header.png",
    "/images/showcase.png",
    "/images/card_small.png",
  ];
  for (let i = 0; i < 10; i++)
    files.push(
      "/images/icon/" +
        String(i * 1024).padStart(5, "0") +
        "-" +
        String((i + 1) * 1024).padStart(5, "0") +
        ".png",
    );
  const result = new Map(),
    report = [];
  for (const file of files) {
    let original = await readFile(path.join(root, "public", file));
    if (file === "/images/icon/09216-10240.png")
      original = await trimUnusedSpriteCells(original, 9216);
    const raw = await sharp(original).ensureAlpha().raw().toBuffer();
    const png = await sharp(original).png({ compressionLevel: 9 }).toBuffer();
    const palette = await sharp(original)
      .png({ compressionLevel: 9, palette: true, effort: 10 })
      .toBuffer();
    const webp = await sharp(original)
      .webp({ lossless: true, effort: 6 })
      .toBuffer();
    const candidates = [
      { buffer: original, mime: "image/png", method: "original" },
    ];
    for (const [method, mime, buffer] of [
      ["png", "image/png", png],
      ["palette", "image/png", palette],
      ["webp", "image/webp", webp],
    ]) {
      if (raw.equals(await sharp(buffer).ensureAlpha().raw().toBuffer()))
        candidates.push({ method, mime, buffer });
    }
    const extra = await strongerPNG(file, raw);
    if (extra) candidates.push(extra);
    const best = candidates.sort(
      (a, b) => a.buffer.length - b.buffer.length,
    )[0];
    result.set(file, best);
    report.push({
      file,
      before: original.length,
      after: best.buffer.length,
      method: best.method,
    });
  }
  const ico = await readFile(path.join(root, "public/favicon.ico"));
  const { pixels, width, height } = decodeICO(ico);
  let png = await sharp(pixels, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();
  const extra = await strongerPNG("/favicon.ico", pixels);
  if (extra && extra.buffer.length < png.length) png = extra.buffer;
  result.set("/favicon.ico", {
    buffer: png,
    mime: "image/png",
    method: "ico-png",
  });
  report.push({
    file: "/favicon.ico",
    before: ico.length,
    after: png.length,
    method: "ico-png",
  });
  return result;
}
