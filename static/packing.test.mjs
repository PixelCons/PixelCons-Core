import { test } from "node:test";
import assert from "node:assert/strict";
import { gzipSync } from "node:zlib";
import { encode, decode } from "../scripts/static-byte-text.mjs";
import {
  encodeAssetEnvelope,
  decodeAssetEnvelope,
  browserAssetEnvelope,
} from "../scripts/static-asset-envelope.mjs";
import { unpackPage } from "../scripts/static-page.mjs";
import { encodeArchive, decodeArchive } from "./archive-codec.mjs";

test("HTML byte transport preserves every byte and partial final groups through UTF-8", () => {
  const source = Uint8Array.from(
    { length: 4096 },
    (_, i) => (i * 73 + (i >> 3)) & 255,
  );
  for (let length = 0; length <= source.length; length++) {
    const bytes = source.subarray(0, length);
    const text = encode(bytes);
    assert.ok(!/[\0\r<]/.test(text));
    assert.deepEqual(decode(Buffer.from(text).toString("utf8"), length), bytes);
  }
});

test("binary assets preserve SVG and raster content without replacing ordinary token text", async () => {
  const png = "data:image/png;base64,iVBORw0KGgo=";
  const svg =
    "data:image/svg+xml,%3Csvg%3E%3Ctext%3E%C3%A9%3C%2Ftext%3E%3C%2Fsvg%3E";
  const html = `<p>~A0~</p><img src="${png}"><img src="${png}"><img src="${svg}">`;
  const envelope = encodeAssetEnvelope(html);
  const restored = decodeAssetEnvelope(envelope);
  assert.ok(restored.includes("<p>~A0~</p>"));
  const uris = [...restored.matchAll(/src="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.equal(uris[0], png);
  assert.equal(uris[1], png);
  assert.equal(
    Buffer.from(uris[2].split(",")[1], "base64").toString(),
    "<svg><text>é</text></svg>",
  );
  const browserHTML = browserAssetEnvelope(envelope);
  const blobs = [...browserHTML.matchAll(/src="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.ok(browserHTML.includes("<p>~A0~</p>"));
  assert.equal(blobs[0], blobs[1]);
  const raster = await fetch(blobs[0]);
  assert.equal(raster.headers.get("content-type"), "image/png");
  assert.deepEqual(
    Buffer.from(await raster.arrayBuffer()),
    Buffer.from("iVBORw0KGgo=", "base64"),
  );
  assert.equal(
    await (await fetch(blobs[2])).text(),
    "<svg><text>é</text></svg>",
  );
  for (const url of new Set(blobs)) URL.revokeObjectURL(url);
});

test("the unpacker reads the previous Base64 gzip format and uncompressed HTML", () => {
  const html = "<!doctype html><p>PixelCons é</p>";
  assert.equal(unpackPage(html), html);
  assert.equal(
    unpackPage(
      `<script id="pixelcons-page" type="application/gzip">${gzipSync(html).toString("base64")}</script>`,
    ),
    html,
  );
});

test("binary metadata restores byte columns and JSON without mutating archive fields", () => {
  const records = [
    {
      id: "0x" + "9".repeat(64),
      name: "</script",
      creator: "0x" + "ab".repeat(20),
      date: 1000,
      index: 0,
      collection: 3,
    },
  ];
  const packed = encodeArchive(records, "contract", { 3: "Faces" });
  const json = JSON.stringify(packed).replace(/</g, "\\u003c");
  const html = `<script id="pixelcons-data" type="application/json">${json}</script>`;
  const previous = process.env.STATIC_METADATA_BINARY;
  try {
    process.env.STATIC_METADATA_BINARY = "1";
    const bytes = encodeAssetEnvelope(html);
    assert.equal(bytes.subarray(0, 4).toString(), "PCA3");
    const unpacked = decodeAssetEnvelope(bytes);
    assert.equal(unpacked, html);
    const browserHTML = browserAssetEnvelope(bytes);
    const columns = JSON.parse(browserHTML.match(/>([\s\S]*?)<\/script>/)[1]);
    for (const key of columns.b)
      columns[key] = globalThis.__pixelconColumns[columns[key]];
    assert.deepEqual(decodeArchive(columns), decodeArchive(packed));
    assert.ok(browserHTML.includes("\\u003c/script"));
  } finally {
    delete globalThis.__pixelconColumns;
    if (previous === undefined) delete process.env.STATIC_METADATA_BINARY;
    else process.env.STATIC_METADATA_BINARY = previous;
  }
});

test("compact archive preserves unusual names, address spelling and repeated decoding", () => {
  const records = [
    {
      id: "0x" + "1".repeat(64),
      name: "A\nB",
      creator: "0xAb" + "01".repeat(19),
      date: 1000,
      index: 0,
      collection: null,
    },
    {
      id: "0x" + "2".repeat(64),
      name: "~A0~",
      creator: "0x" + "ab".repeat(20),
      date: 0,
      index: 1,
      collection: 3,
    },
  ];
  const packed = encodeArchive(records, "contract", { 3: "Faces" });
  const before = structuredClone(packed);
  const expected = records.map(({ id, name, creator, date, collection }) => [
    id,
    name,
    creator,
    date,
    collection,
  ]);
  for (let i = 0; i < 2; i++)
    assert.deepEqual(decodeArchive(packed).rows, expected);
  assert.deepEqual(packed, before);
});
