import { gzipAsync } from "@gfx/zopfli";
import { gzipSync, gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";

// Expensive search happens only during builds, and is cached by exact input.
// Every result remains ordinary gzip for the browser's native decoder.
export async function compressStatic(bytes) {
  if (process.env.STATIC_COMPRESSION === "fast")
    return gzipSync(bytes, { level: 9 });
  const key = createHash("sha256")
    .update("zopfli-v1:15,15-unlimited,30-unlimited:")
    .update(bytes)
    .digest("hex");
  const directory = new URL("../cache/static-compression/", import.meta.url);
  const file = new URL(key + ".gz", directory);
  try {
    const cached = await readFile(file);
    if (gunzipSync(cached).equals(Buffer.from(bytes))) return cached;
  } catch {
    /* Missing or stale cache entries are regenerated. */
  }
  let best = gzipSync(bytes, { level: 9 });
  for (const options of [
    { numiterations: 15 },
    { numiterations: 15, blocksplittingmax: 0 },
    { numiterations: 30, blocksplittingmax: 0 },
  ]) {
    const compressed = Buffer.from(await gzipAsync(bytes, options));
    if (compressed.length < best.length) best = compressed;
  }
  await mkdir(directory, { recursive: true });
  await writeFile(file, best);
  return best;
}
