import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { encodePatterns, renderPatterns } from "../scripts/static-patterns.mjs";

test("template artwork restores every ID and RGB pixel across all 10,000 records", async () => {
  const archive = JSON.parse(
    await readFile(
      new URL("../archive/pixelcons.json", import.meta.url),
      "utf8",
    ),
  ).slice(0, 10000);
  const palette = Array.from({ length: 16 }, (_, i) => [i * 13, i * 7, i * 3]);
  for (const columns of [32, 100]) {
    const bytes = encodePatterns(archive, palette, columns);
    let image;
    const context = {
      Uint8Array,
      Uint8ClampedArray,
      DataView,
      TextDecoder,
      ImageData: class {
        constructor(data, width, height) {
          this.data = data;
          this.width = width;
          this.height = height;
        }
      },
      document: {
        createElement: () => ({
          getContext: () => ({
            putImageData: (value) => {
              image = value;
            },
          }),
          toDataURL: () => "data:image/png;base64,fixture",
        }),
      },
    };
    const render = runInNewContext(
      "(" + renderPatterns.toString() + ")",
      context,
    );
    assert.equal(render(bytes), "data:image/png;base64,fixture");
    assert.deepEqual(
      Array.from(context.__pixelconIds),
      archive.map((p) => p.id),
    );
    assert.equal(image.width, columns * 8);
    assert.equal(image.height, Math.ceil(archive.length / columns) * 8);
    for (let token = 0; token < archive.length; token++) {
      const id = archive[token].id.slice(2),
        x = (token % columns) * 8,
        y = Math.floor(token / columns) * 8;
      for (let p = 0; p < 64; p++) {
        const offset = ((y + (p >> 3)) * image.width + x + (p & 7)) * 4;
        const color = palette[parseInt(id[p], 16)];
        for (let c = 0; c < 3; c++)
          assert.equal(image.data[offset + c], color[c]);
        assert.equal(image.data[offset + 3], 255);
      }
    }
  }
});
