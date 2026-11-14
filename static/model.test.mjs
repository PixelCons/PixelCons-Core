import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script } from "node:vm";
import { decodeArchive, encodeArchive } from "./archive-codec.mjs";
import { unpackPage } from "../scripts/static-page.mjs";
import {
  normalizeId,
  encodeName,
  decodeName,
  detailHash,
  parseRoute,
  openSeaUrl,
} from "./model.mjs";

const archive = JSON.parse(
  await readFile(new URL("../archive/pixelcons.json", import.meta.url)),
);
const id = archive[0].id;

test("links round-trip every archived bytes8 name, including the first token and later tokens", () => {
  for (const pixelcon of archive) {
    const date = Math.floor(pixelcon.date / 1000);
    const route = parseRoute(
      detailHash(pixelcon.id, pixelcon.name, pixelcon.index, date),
    );
    assert.equal(route.id, pixelcon.id);
    assert.equal(route.name ?? "", pixelcon.name);
    assert.equal(route.index, pixelcon.index);
    assert.equal(route.date, date);
  }
  for (const name of [
    "",
    "TinyRobo",
    "é😀",
    "\ufeffA",
    "</script",
    'a&?#"<>',
  ]) {
    assert.equal(decodeName(encodeName(name)), name);
  }
});

test("index and Unix-second date parameters preserve zero and reject invalid numbers", () => {
  const route = parseRoute(detailHash(id, "Smile", 0, 1543779001));
  assert.equal(route.index, 0);
  assert.equal(route.date, 1543779001);
  assert.equal(parseRoute(`#${id}?index=0x2710&date=0x5c045f00`).index, 10000);
  assert.equal(parseRoute(`#${id}?date=0`).date, 0);
  assert.equal(parseRoute(`#${id}?name=536d696c65000000`).name, "Smile");
  assert.equal(parseRoute(`#${id}`).index, undefined);
  assert.equal(parseRoute(`#${id}`).date, undefined);
  for (const value of [
    "",
    "-1",
    "1.5",
    "NaN",
    "Infinity",
    "1e3",
    "9007199254740992",
    "0xzz",
  ]) {
    const parsed = parseRoute(`#${id}?index=${value}&date=${value}`);
    assert.equal(parsed.index, undefined, value);
    assert.equal(parsed.date, undefined, value);
  }
  assert.equal(parseRoute(`#${id}?date=8640000000001`).date, undefined);
  assert.throws(() => detailHash(id, "", -1, 1543779001));
  assert.throws(() => detailHash(id, "", 0, 8640000000001));
});

test("malformed names and IDs fail gracefully, optional 0x prefix works", () => {
  for (const name of [
    "ff00000000000000",
    "c080000000000000",
    "1234",
    "zzzzzzzzzzzzzzzz",
  ]) {
    assert.equal(decodeName(name), null);
    assert.equal(parseRoute(`#${id}?name=${name}`).name, null);
  }
  assert.equal(decodeName("0x536d696c65000000"), "Smile");
  assert.equal(decodeName("0000000000000000"), "");
  assert.throws(() => encodeName("More than eight bytes"));
  for (const invalid of [
    "0x123",
    "0x" + "g".repeat(64),
    "<script>",
    "/details/" + id,
  ]) {
    assert.equal(parseRoute("#" + invalid).page, "invalid");
    assert.equal(normalizeId(invalid), null);
  }
});

test("filter and informational routes are separate from token IDs", () => {
  const route = parseRoute("#?collection=1&creator=0x123&q=Smile");
  assert.equal(route.page, "browse");
  assert.equal(route.params.get("collection"), "1");
  assert.equal(route.params.get("q"), "Smile");
  assert.equal(parseRoute("#").page, "browse");
  assert.equal(parseRoute("#about").page, "about");
  assert.equal(parseRoute("#terms").page, "terms");
});

test("OpenSea asset links preserve all 256 token ID bits", () => {
  assert.equal(
    openSeaUrl("0xcontract", id),
    `https://opensea.io/assets/ethereum/0xcontract/${BigInt(id)}`,
  );
  const maximum = "0x" + "f".repeat(64);
  assert.ok(
    openSeaUrl("0xcontract", maximum).endsWith((2n ** 256n - 1n).toString()),
  );
});

test("build is one self-contained file with exactly the first 10,000 records", async () => {
  const artifact = await readFile(
    new URL("../out/index.html", import.meta.url),
    "utf8",
  );
  const html = unpackPage(artifact);
  const rawData = html.match(
    /<script id="pixelcons-data" type="application\/json">([\s\S]*?)<\/script>/,
  )[1];
  const data = decodeArchive(
    JSON.parse(rawData),
    archive.slice(0, 10000).map((pixelcon) => pixelcon.id),
  );
  assert.equal(data.rows.length, 10000);
  assert.equal(data.rows[0][0], archive[0].id);
  assert.equal(data.rows.at(-1)[0], archive[9999].id);
  assert.ok(!rawData.includes(archive[10000].id));
  assert.ok(!/Unique|Very similar to|derivative/i.test(rawData));
  const markup = html.replace(/<script[\s\S]*?<\/script>/g, "");
  for (const match of markup.matchAll(/(?:src|href)="([^"]*)"/g)) {
    assert.ok(
      /^(data:|#|https:\/\/)/.test(match[1]),
      `External asset: ${match[1]}`,
    );
  }
  assert.ok(
    !/<script[^>]+src=|@import|url\(\s*['"]?(?:https?:|\/)/i.test(html),
  );
  const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].at(-1)[1];
  new Script(script);
  assert.ok(
    !/\bfetch\s*\(|XMLHttpRequest|WebSocket|\bimport\s*\(/.test(script),
  );
});

test("compact archive restores every field exactly, with stored or sprite-derived IDs", () => {
  const selected = archive.slice(0, 10000);
  const expected = selected.map(({ id, name, creator, date, collection }) => [
    id,
    name,
    creator,
    date,
    collection,
  ]);
  for (const includeIds of [true, false]) {
    const packed = encodeArchive(
      selected,
      "contract",
      { 1: "Faces" },
      includeIds,
    );
    const restored = decodeArchive(
      packed,
      includeIds ? undefined : selected.map((pixelcon) => pixelcon.id),
    );
    assert.deepEqual(restored.rows, expected);
    assert.equal(restored.contract, "contract");
    assert.deepEqual(restored.collections, { 1: "Faces" });
  }
});
