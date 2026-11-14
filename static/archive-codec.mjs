// Columnar archive: each creator once, creation times as second deltas,
// and names/collections stored only for records that have them.
function encodeOriginal(pixelcons, contract, collections, includeIds = true) {
  const creators = [...new Set(pixelcons.map((pixelcon) => pixelcon.creator))];
  const lookup = new Map(creators.map((creator, index) => [creator, index]));
  let previous = 0;
  return {
    v: 1,
    contract,
    ...(includeIds
      ? { ids: pixelcons.map((pixelcon) => pixelcon.id.slice(2)).join("") }
      : {}),
    creators,
    c: pixelcons.map((pixelcon) => lookup.get(pixelcon.creator)),
    d: pixelcons.map((pixelcon) => {
      const seconds = pixelcon.date / 1000;
      const delta = seconds - previous;
      previous = seconds;
      return delta;
    }),
    n: pixelcons
      .filter((pixelcon) => pixelcon.name)
      .map((pixelcon) => [pixelcon.index, pixelcon.name]),
    g: pixelcons
      .filter((pixelcon) => pixelcon.collection != null)
      .map((pixelcon) => [pixelcon.index, pixelcon.collection]),
    collections,
  };
}

function decodeOriginal(packed, spriteIds = undefined) {
  if (packed.rows) return packed;
  if (packed.v !== 1) throw new Error("Unsupported archive version");
  const ids =
    spriteIds ||
    Array.from(
      { length: packed.c.length },
      (_, index) => "0x" + packed.ids.slice(index * 64, index * 64 + 64),
    );
  if (ids.length !== packed.c.length)
    throw new Error("Incomplete PixelCon IDs");
  let date = 0;
  const rows = packed.c.map((creator, index) => [
    ids[index],
    "",
    packed.creators[creator],
    (date += packed.d[index]) * 1000,
    null,
  ]);
  for (const [index, name] of packed.n) rows[index][1] = name;
  for (const [index, collection] of packed.g) rows[index][4] = collection;
  return { contract: packed.contract, rows, collections: packed.collections };
}

function bytes64(bytes) {
  let text = "";
  for (let i = 0; i < bytes.length; i += 8192)
    text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
}
function un64(text) {
  if (text instanceof Uint8Array) return text;
  if (Uint8Array.fromBase64) return Uint8Array.fromBase64(text);
  const source = atob(text),
    bytes = new Uint8Array(source.length);
  for (let i = 0; i < source.length; i++) bytes[i] = source.charCodeAt(i);
  return bytes;
}
function addressBytes(creators) {
  const bytes = new Uint8Array(creators.length * 20);
  let cursor = 0;
  for (const creator of creators)
    for (let i = 2; i < 42; i += 2)
      bytes[cursor++] = parseInt(creator.slice(i, i + 2), 16);
  return bytes64(bytes);
}
function addresses(text) {
  const bytes = un64(text),
    ascii = new Uint8Array((bytes.length / 20) * 43),
    hex = new TextEncoder().encode("0123456789abcdef");
  let cursor = 0;
  for (let i = 0; i < bytes.length; i += 20) {
    ascii[cursor++] = 48;
    ascii[cursor++] = 120;
    for (let j = i; j < i + 20; j++) {
      ascii[cursor++] = hex[bytes[j] >> 4];
      ascii[cursor++] = hex[bytes[j] & 15];
    }
    ascii[cursor++] = 10;
  }
  return new TextDecoder()
    .decode(ascii.subarray(0, ascii.length - 1))
    .split("\n");
}
function varints(values) {
  const bytes = [];
  for (let value of values) {
    while (value >= 128) {
      bytes.push((value % 128) | 128);
      value = Math.floor(value / 128);
    }
    bytes.push(value);
  }
  return bytes64(Uint8Array.from(bytes));
}
function unvarints(text) {
  const bytes = un64(text),
    values = [];
  let value = 0,
    scale = 1;
  for (const byte of bytes) {
    value += (byte & 127) * scale;
    if (byte & 128) scale *= 128;
    else {
      values.push(value);
      value = 0;
      scale = 1;
    }
  }
  return values;
}
function gaps(values) {
  let previous = 0;
  return values.map((value) => {
    const gap = value - previous;
    previous = value;
    return gap;
  });
}
function ungaps(values) {
  let sum = 0;
  return values.map((value) => (sum += value));
}

export function encodeArchive(...args) {
  const p = encodeOriginal(...args);
  const frequency = new Uint32Array(p.creators.length);
  for (const creator of p.c) frequency[creator]++;
  const order = p.creators
    .map((creator, index) => [creator, index, frequency[index]])
    .sort((a, b) => b[2] - a[2] || a[1] - b[1]);
  const remap = [];
  order.forEach((entry, index) => {
    remap[entry[1]] = index;
  });
  p.creators = order.map((entry) => entry[0]);
  p.c = varints(p.c.map((index) => remap[index]));
  if (p.creators.every((creator) => /^0x[0-9a-f]{40}$/.test(creator))) {
    p.a = addressBytes(p.creators);
    delete p.creators;
  }
  if (p.d.every((value) => Number.isSafeInteger(value) && value >= 0))
    p.d = varints(p.d);
  const names = p.n;
  if (names.every((entry) => !entry[1].includes("\n"))) {
    p.ni = varints(gaps(names.map((entry) => entry[0])));
    p.n = names.map((entry) => entry[1]).join("\n");
  }
  const groups = [];
  let previousIndex = 0;
  for (const [index, collection] of p.g) {
    groups.push(index - previousIndex, collection);
    previousIndex = index;
  }
  p.g = varints(groups);
  return p;
}
export function decodeArchive(p, ids) {
  p = { ...p };
  if (p.rows) return p;
  if (p.a) {
    p.creators = addresses(p.a);
  }
  if (typeof p.c === "string" || p.c instanceof Uint8Array) {
    if (p.u) {
      const bytes = un64(p.c);
      p.c = Array.from(
        { length: bytes.length / 2 },
        (_, index) => bytes[index * 2] | (bytes[index * 2 + 1] << 8),
      );
    } else p.c = unvarints(p.c);
  }
  if (typeof p.d === "string" || p.d instanceof Uint8Array)
    p.d = unvarints(p.d);
  if (typeof p.g === "string" || p.g instanceof Uint8Array) {
    const groups = unvarints(p.g);
    p.g = [];
    let index = 0;
    for (let i = 0; i < groups.length; i += 2) {
      index += groups[i];
      p.g.push([index, groups[i + 1]]);
    }
  }
  if (p.ni) {
    const indices = ungaps(unvarints(p.ni)),
      names = p.n.split("\n");
    p.n = indices.map((index, i) => [index, names[i]]);
  }
  return decodeOriginal(p, ids);
}
