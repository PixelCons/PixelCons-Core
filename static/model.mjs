// Shared by the offline page and its tests. No RPC, image, or framework dependencies.
export function normalizeId(id) {
  return /^0x[0-9a-f]{64}$/i.test(id) ? id.toLowerCase() : null;
}

export function encodeName(name) {
  const bytes = new TextEncoder().encode(name);
  if (bytes.length > 8) throw new Error("PixelCon names must fit in bytes8");
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .padEnd(16, "0");
}

export function decodeName(raw) {
  const hex = raw.replace(/^0x/i, "");
  if (!/^[0-9a-f]{16}$/i.test(hex)) return null;
  const unpadded = hex.replace(/(?:00)+$/, "");
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      Uint8Array.from(unpadded.match(/../g) || [], (byte) =>
        parseInt(byte, 16),
      ),
    );
  } catch {
    return null;
  }
}

function unsignedInteger(value, maximum = Number.MAX_SAFE_INTEGER) {
  if (
    value === undefined ||
    value === null ||
    !/^(?:\d+|0x[0-9a-f]+)$/i.test(String(value))
  )
    return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 && number <= maximum
    ? number
    : undefined;
}

const maximumDateSeconds = 8640000000000;

export function detailHash(id, name = "", index = undefined, date = undefined) {
  const normalized = normalizeId(id);
  if (!normalized) throw new Error("Invalid PixelCon ID");
  const params = new URLSearchParams();
  for (const [key, value, maximum] of [
    ["index", index, Number.MAX_SAFE_INTEGER],
    ["date", date, maximumDateSeconds],
  ]) {
    if (value === undefined) continue;
    const parsed = unsignedInteger(value, maximum);
    if (parsed === undefined) throw new Error(`Invalid PixelCon ${key}`);
    params.set(key, String(parsed));
  }
  if (name) params.set("name", encodeName(name));
  return `#${normalized}${params.size ? `?${params}` : ""}`;
}

export function parseRoute(hash) {
  const [path, query = ""] = hash.replace(/^#/, "").split("?");
  const params = new URLSearchParams(query);
  if (!path) return { page: "browse", params };
  if (path === "about" || path === "terms") return { page: path };
  const id = normalizeId(path);
  if (!id) return { page: "invalid" };
  const rawName = params.get("name");
  return {
    page: "details",
    id,
    name: rawName === null ? undefined : decodeName(rawName),
    index: unsignedInteger(params.get("index")),
    date: unsignedInteger(params.get("date"), maximumDateSeconds),
  };
}

export function openSeaUrl(contract, id) {
  if (!normalizeId(id)) throw new Error("Invalid PixelCon ID");
  return `https://opensea.io/assets/ethereum/${contract}/${BigInt(id).toString(10)}`;
}
