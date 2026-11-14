// Binary images, template dictionaries, and metadata avoid Base64 in compressed HTML.
// These helpers are build-time only; stringify browserAssetEnvelope to embed the reader.
const assetPattern =
  /data:image\/(?:png|webp|x-icon|x-pixelcons-template);base64,[A-Za-z0-9+/=]+|data:image\/svg\+xml,[^\s"'()<>`\\]+/g;
const types = [
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/x-icon",
  "application/octet-stream",
  "image/x-pixelcons-template",
];
export function encodeAssetEnvelope(html) {
  if (html.includes("~PCASSET~")) throw Error("Asset marker collision");
  const assets = [],
    lookup = new Map();
  const body = html.replace(assetPattern, (uri) => {
    let index = lookup.get(uri);
    if (index === undefined) {
      index = assets.length;
      lookup.set(uri, index);
      const match = uri.match(/^data:([^;,]+)(;base64)?,(.*)$/s);
      assets.push({
        type: types.indexOf(match[1]),
        bytes: match[2]
          ? Buffer.from(match[3], "base64")
          : Buffer.from(decodeURIComponent(match[3])),
      });
    }
    return "~PCASSET~" + index + "~";
  });
  let textBody = body;
  let binaryMetadata = false;
  if (process.env.STATIC_METADATA_BINARY !== "0") {
    textBody = body.replace(
      /(<script id="pixelcons-data" type="application\/json">)([\s\S]*?)(<\/script>)/,
      (_, start, json, end) => {
        const packed = JSON.parse(json),
          keys = [];
        for (const key of ["a", "c", "d", "g", "ni"]) {
          if (typeof packed[key] !== "string" || !packed[key]) continue;
          const bytes = Buffer.from(packed[key], "base64");
          packed[key] = assets.length;
          assets.push({ type: 4, bytes });
          keys.push(key);
        }
        if (!keys.length) return start + json + end;
        packed.b = keys;
        binaryMetadata = true;
        return start + JSON.stringify(packed).replace(/</g, "\\u003c") + end;
      },
    );
  }
  const text = Buffer.from(textBody),
    header = Buffer.alloc(10);
  header.write(binaryMetadata ? "PCA3" : "PCA2");
  header.writeUInt32LE(text.length, 4);
  header.writeUInt16LE(assets.length, 8);
  const parts = [header, text];
  for (const { type, bytes } of assets) {
    const record = Buffer.alloc(5);
    record.writeUInt8(type);
    record.writeUInt32LE(bytes.length, 1);
    parts.push(record, bytes);
  }
  return Buffer.concat(parts);
}
export function decodeAssetEnvelope(input) {
  const bytes = Buffer.from(input);
  const signature = bytes.subarray(0, 4).toString();
  if (signature !== "PCA1" && signature !== "PCA2" && signature !== "PCA3")
    return bytes.toString("utf8");
  const length = bytes.readUInt32LE(4),
    count = bytes.readUInt16LE(8),
    uris = [];
  let offset = 10 + length;
  for (let i = 0; i < count; i++) {
    const kind = bytes[offset],
      type = types[kind],
      size = bytes.readUInt32LE(offset + 1);
    offset += 5;
    uris.push(
      kind === 4
        ? bytes.subarray(offset, offset + size).toString("base64")
        : "data:" +
            type +
            ";base64," +
            bytes.subarray(offset, offset + size).toString("base64"),
    );
    offset += size;
  }
  return bytes
    .subarray(10, 10 + length)
    .toString("utf8")
    .replace(
      signature !== "PCA1" ? /~PCASSET~(\d+)~/g : /~A(\d+)~/g,
      (_, index) => uris[Number(index)],
    )
    .replace(
      /(<script id="pixelcons-data" type="application\/json">)([\s\S]*?)(<\/script>)/,
      (_, start, json, end) => {
        const packed = JSON.parse(json);
        if (packed.b) {
          for (const key of packed.b) packed[key] = uris[packed[key]];
          delete packed.b;
        }
        return start + JSON.stringify(packed).replace(/</g, "\\u003c") + end;
      },
    );
}
export function browserAssetEnvelope(input, renderPattern) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input),
    view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 4) return new TextDecoder().decode(bytes);
  const signature = view.getUint32(0);
  if (
    signature !== 0x50434131 &&
    signature !== 0x50434132 &&
    signature !== 0x50434133
  )
    return new TextDecoder().decode(bytes);
  const length = view.getUint32(4, true),
    count = view.getUint16(8, true),
    types = ["image/png", "image/webp", "image/svg+xml", "image/x-icon"],
    uris = [];
  let offset = 10 + length;
  for (let i = 0; i < count; i++) {
    const kind = view.getUint8(offset),
      type = types[kind],
      size = view.getUint32(offset + 1, true);
    offset += 5;
    if (kind === 4) {
      (globalThis.__pixelconColumns ||= [])[i] = bytes.subarray(
        offset,
        offset + size,
      );
    }
    uris.push(
      kind === 4
        ? ""
        : kind === 5
          ? renderPattern(bytes.subarray(offset, offset + size))
          : URL.createObjectURL(
              new Blob([bytes.subarray(offset, offset + size)], { type }),
            ),
    );
    offset += size;
  }
  return new TextDecoder()
    .decode(bytes.subarray(10, 10 + length))
    .replace(
      signature !== 0x50434131 ? /~PCASSET~(\d+)~/g : /~A(\d+)~/g,
      (_, index) => uris[Number(index)],
    );
}
