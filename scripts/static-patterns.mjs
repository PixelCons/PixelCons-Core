// A build-time palette-normalized template dictionary. The browser reader below
// restores the exact ID and RGB artwork; names, indexes, and metadata stay separate.
// Header: count u32, columns u16, template count u32, reference bytes u32,
// then two format flags. Next: 16 RGB colors, 32-byte templates, varint references,
// and the concatenated per-token palettes packed as four-bit color indexes.
export function encodePatterns(pixelcons, palette, columns = 32) {
  const records = pixelcons.map((pixelcon) => {
    const colors = [],
      lookup = new Map();
    let pattern = "";
    for (const char of pixelcon.id.slice(2)) {
      if (!lookup.has(char)) {
        lookup.set(char, colors.length);
        colors.push(parseInt(char, 16));
      }
      pattern += lookup.get(char).toString(16);
    }
    return { pattern, colors };
  });
  const keys = [...new Set(records.map((record) => record.pattern))].sort();
  const lookup = new Map(keys.map((key, index) => [key, index]));
  const references = [];
  for (const record of records) {
    let value = lookup.get(record.pattern);
    while (value >= 128) {
      references.push((value & 127) | 128);
      value = Math.floor(value / 128);
    }
    references.push(value);
  }
  const colors = records.flatMap((record) => record.colors),
    packedColors = Buffer.alloc(Math.ceil(colors.length / 2));
  for (let i = 0; i < colors.length; i++)
    packedColors[i >> 1] |= colors[i] << (i & 1 ? 0 : 4);
  const header = Buffer.alloc(16);
  header.writeUInt32LE(pixelcons.length, 0);
  header.writeUInt16LE(columns, 4);
  header.writeUInt32LE(keys.length, 6);
  header.writeUInt32LE(references.length, 10);
  header[14] = 1;
  header[15] = 1;
  return Buffer.concat([
    header,
    Buffer.from(palette.flat()),
    Buffer.from(keys.join(""), "hex"),
    Buffer.from(references),
    packedColors,
  ]);
}

// This self-contained reader is embedded only when template artwork is used.
export function renderPatterns(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(0, true),
    columns = view.getUint16(4, true),
    entries = view.getUint32(6, true);
  const start = 64,
    references = start + entries * 32,
    colorsStart = references + view.getUint32(10, true);
  const width = columns * 8,
    height = Math.ceil(count / columns) * 8;
  const pixels = new Uint8ClampedArray(width * height * 4),
    ascii = new Uint8Array(count * 67),
    sizes = new Uint8Array(entries),
    tileColors = new Uint8Array(16);
  pixels.fill(255);
  let ref = references,
    colorCursor = colorsStart * 2,
    cursor = 0;
  for (let token = 0; token < count; token++) {
    let index = 0,
      shift = 0,
      byte;
    do {
      byte = bytes[ref++];
      index |= (byte & 127) << shift;
      shift += 7;
    } while (byte & 128);
    const pattern = start + index * 32;
    let size = sizes[index];
    if (!size) {
      for (let i = 0; i < 32; i++)
        size = Math.max(size, bytes[pattern + i] >> 4, bytes[pattern + i] & 15);
      sizes[index] = ++size;
    }
    for (let i = 0; i < size; i++, colorCursor++)
      tileColors[i] =
        (bytes[colorCursor >> 1] >> (colorCursor & 1 ? 0 : 4)) & 15;
    const x = (token % columns) * 8,
      y = Math.floor(token / columns) * 8;
    ascii[cursor++] = 48;
    ascii[cursor++] = 120;
    for (let p = 0; p < 64; p++) {
      const color =
        tileColors[(bytes[pattern + (p >> 1)] >> (p & 1 ? 0 : 4)) & 15];
      ascii[cursor++] = color < 10 ? 48 + color : 87 + color;
      const target = ((y + (p >> 3)) * width + x + (p & 7)) * 4,
        rgb = 16 + color * 3;
      pixels[target] = bytes[rgb];
      pixels[target + 1] = bytes[rgb + 1];
      pixels[target + 2] = bytes[rgb + 2];
    }
    ascii[cursor++] = 10;
  }
  globalThis.__pixelconIds = new TextDecoder()
    .decode(ascii.subarray(0, ascii.length - 1))
    .split("\n");
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas
    .getContext("2d")
    .putImageData(new ImageData(pixels, width, height), 0, 0);
  return canvas.toDataURL("image/png");
}
