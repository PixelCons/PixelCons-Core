import { readFile, mkdir, writeFile } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { build } from "esbuild";
import * as sass from "sass";
import sharp from "sharp";
import { encodeName, normalizeId } from "../static/model.mjs";
import { prepareRaster, svgDataURI } from "./static-assets.mjs";
import {
  staticAliases,
  pruneStaticStyles,
  minifyStatic,
} from "./static-bundle.mjs";
import { nativePNGSource } from "./static-native-png.mjs";
import { encodeArchive } from "../static/archive-codec.mjs";
import { packPage } from "./static-page.mjs";
import { pruneUnusedModuleCSS } from "./static-prune.mjs";
import { prepareAtlas } from "./static-atlas.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (file) => readFile(path.join(root, file), "utf8");
const readJSON = async (file) => JSON.parse(await read(file));
const limit = 10000;
const selected = (await readJSON("archive/pixelcons.json"))
  .filter((pixelcon) => pixelcon.index >= 0 && pixelcon.index < limit)
  .sort((a, b) => a.index - b.index);
if (
  selected.length !== limit ||
  selected.some((pixelcon, i) => pixelcon.index !== i)
) {
  throw new Error(
    "The archive must contain every PixelCon index from 0 through 9999",
  );
}
const ids = new Set();
for (const pixelcon of selected) {
  if (!normalizeId(pixelcon.id) || ids.has(pixelcon.id))
    throw new Error("Invalid or duplicate archive ID");
  ids.add(pixelcon.id);
  encodeName(pixelcon.name);
}
const collections = await readJSON("archive/pixelconCollections.json");
const deployments = await readJSON("archive/contracts/deployments.json");
const useSprites = process.env.STATIC_ARCHIVE !== "columns";
const usePacking = process.env.STATIC_PACK !== "0";
const patternMode = process.env.STATIC_PATTERN || "templates";
if (!["templates", "0"].includes(patternMode))
  throw Error("Unsupported pattern mode");
const usePatterns =
  patternMode === "templates" &&
  usePacking &&
  useSprites &&
  process.env.STATIC_ATLAS !== "0" &&
  process.env.STATIC_ASSET_ENVELOPE !== "0";
const atlasColumns = Number(
  process.env.STATIC_ATLAS || (usePatterns ? 32 : 256),
);
if (![0, 32, 64, 100, 128, 256].includes(atlasColumns))
  throw Error("Unsupported atlas width");
const progressive = process.env.STATIC_PROGRESSIVE || "batch";
if (!["batch", "visibility", "0"].includes(progressive))
  throw Error("Unsupported gallery mode");
const data = encodeArchive(
  selected,
  deployments.mainnet.contracts[0].address,
  Object.fromEntries(
    collections.map((collection) => [collection.index, collection.name]),
  ),
  !useSprites,
);
const spriteImages = new Map();
const raster = await prepareRaster(root);
if (atlasColumns)
  raster.set(
    "/images/icon/00000-01024.png",
    await prepareAtlas(selected, atlasColumns, usePatterns),
  );
const useSVG = true;
const dedupe = true;
const assets = new Map();
function asset(url) {
  if (dedupe && url === "/images/card_small.png")
    return "pixelcons:optimized-card";
  if (!assets.has(url)) {
    const file = path.join(root, "public", url);
    if (!existsSync(file)) throw new Error(`Missing static asset ${url}`);
    const mime =
      raster.get(url)?.mime ||
      {
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".ico": "image/x-icon",
      }[path.extname(file)];
    assets.set(
      url,
      useSVG && mime === "image/svg+xml"
        ? svgDataURI(readFileSync(file))
        : `data:${mime};base64,${(raster.get(url)?.buffer || readFileSync(file)).toString("base64")}`,
    );
  }
  return assets.get(url);
}
function embedAssets(source) {
  return source.replace(
    /\/(?:images|icons)\/[\w/.-]+\.(?:png|svg|ico)|\/favicon\.ico/g,
    asset,
  );
}
// Reproduce next/image's default 1x/2x card renditions at build time.
// The other images in lite are ordinary <img> or CSS backgrounds.
const card = readFileSync(path.join(root, "public/images/card_small.png"));
const rendition = async (width) =>
  `data:image/webp;base64,${(await sharp(card).rotate().resize(width, undefined, { withoutEnlargement: true }).webp({ quality: 75 }).toBuffer()).toString("base64")}`;
const [card1x, card2x] = await Promise.all([rendition(256), rendition(640)]);
const optimizedImages = {
  [asset("/images/card_small.png")]: {
    one: card1x,
    two: card2x,
  },
};
const dataExports = {
  "pixelcons.json": "pixelcons",
  "pixelconIds.json": "pixelconIds",
  "pixelconCollections.json": "collections",
};
const result = await build({
  absWorkingDir: root,
  entryPoints: ["static/entry.tsx"],
  outfile: "out/app.js",
  bundle: true,
  write: false,
  minify: true,
  platform: "browser",
  target: "es2020",
  format: "iife",
  alias: process.env.STATIC_RUNTIME === "react" ? {} : staticAliases,
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "inline",
  plugins: [
    {
      name: "single-file-lite",
      setup(bundle) {
        bundle.onResolve({ filter: /^ethers$/ }, () => ({
          path: path.join(root, "static/shims/ethers.mjs"),
        }));
        bundle.onResolve({ filter: /^ultra-lite:images$/ }, () => ({
          path: "images",
          namespace: "ultra-lite",
        }));
        bundle.onLoad({ filter: /.*/, namespace: "ultra-lite" }, () => ({
          contents: `export default ${JSON.stringify(optimizedImages)};`,
          loader: "js",
        }));
        bundle.onResolve(
          { filter: /^next\/(link|head|image|router)$/ },
          ({ path: module }) => ({
            path: path.join(
              root,
              module === "next/router"
                ? "static/router.tsx"
                : `static/shims/${module.slice(5)}.tsx`,
            ),
          }),
        );
        bundle.onLoad(
          { filter: /archive\/pixelcon(s|Ids|Collections)\.json$/ },
          ({ path: file }) => ({
            contents: `export {${dataExports[path.basename(file)]} as default} from ${JSON.stringify(path.join(root, "static/data.ts"))};`,
            loader: "js",
            resolveDir: root,
          }),
        );
        bundle.onLoad({ filter: /\.scss$/ }, ({ path: file }) => {
          let source = pruneStaticStyles(readFileSync(file, "utf8"));
          // The other sprite classes address tokens outside the bundled gallery.
          source = source.replace(
            /\.archive(\d+)\s*\{[^}]*\}/g,
            (rule, index) =>
              Number(index) >= Math.ceil(limit / 1024) ? "" : rule,
          );
          if (atlasColumns)
            source = source.replace(
              /\.archive(\d+)\s*\{[^}]*\}/g,
              (rule, index) =>
                Number(index)
                  ? ""
                  : rule.replace(
                      "background-size: 3200%;",
                      `background-size: ${atlasColumns * 100}% ${Math.ceil(limit / atlasColumns) * 100}%;`,
                    ),
            );
          if (
            progressive === "visibility" &&
            file.endsWith("/pages/index/pixelcons.module.scss")
          )
            source += "\n.pixelcon { content-visibility: auto; }";
          if (useSprites)
            source = source.replace(
              /\.archive(\d+)\s*\{/g,
              (_match, index) => `.archive${index}{--pixelcon-sheet:${index};`,
            );
          const compiled = sass.compileString(source, {
            url: new URL("file://" + file),
            loadPaths: [root],
            logger: sass.Logger.silent,
          });
          const compiledCSS =
            process.env.STATIC_PRUNE === "0"
              ? compiled.css
              : pruneUnusedModuleCSS(compiled.css, file);
          const css = useSprites
            ? compiledCSS.replace(
                /url\((['"]?)(\/images\/icon\/(\d{5})-\d{5}\.png)\1\)/g,
                (_match, _quote, url, start) => {
                  const index = Number(start) / 1024;
                  spriteImages.set(index, asset(url));
                  return _match;
                },
              )
            : compiledCSS;
          return {
            contents: embedAssets(css),
            loader: file.endsWith(".module.scss") ? "local-css" : "css",
            resolveDir: path.dirname(file),
          };
        });
        bundle.onLoad({ filter: /\.[jt]sx?$/ }, ({ path: file }) => {
          if (
            !file.startsWith(path.join(root, "src") + path.sep) &&
            !file.startsWith(path.join(root, "static") + path.sep)
          )
            return;
          let source = readFileSync(file, "utf8")
            .replace(
              dedupe ? /<link rel="icon" href="\/favicon.ico" \/>/g : /(?!) /g,
              "",
            )
            .replace(
              "import {ethers} from 'ethers';",
              "import * as ethers from 'ethers';",
            );
          if (
            file === path.join(root, "src/components/pages/index/pixelcons.tsx")
          ) {
            if (atlasColumns)
              source = source
                .replace("Math.floor(pixelcon.index / 1024)", "0")
                .replace(
                  "(pixelcon.index % 1024) % 32",
                  `pixelcon.index % ${atlasColumns}`,
                )
                .replace(
                  "Math.floor((pixelcon.index % 1024) / 32)",
                  `Math.floor(pixelcon.index / ${atlasColumns})`,
                )
                .replace("(x / 31)", `(x / ${atlasColumns - 1})`)
                .replace(
                  "(y / 31)",
                  `(y / ${Math.ceil(limit / atlasColumns) - 1})`,
                );
            if (progressive === "batch")
              source =
                "import Progressive from " +
                JSON.stringify(path.join(root, "static/progressive.tsx")) +
                ";\n" +
                source.replace(
                  "<div className={styles.container}>{renderPixelcons}</div>",
                  "<Progressive className={styles.container}>{renderPixelcons}</Progressive>",
                );
          }
          if (file === path.join(root, "src/lib/imagedata.ts"))
            source = nativePNGSource(source);
          return {
            contents: embedAssets(source),
            loader: path.extname(file).slice(1),
            resolveDir: path.dirname(file),
          };
        });
      },
    },
  ],
});
let script = result.outputFiles.find((file) => file.path.endsWith(".js")).text;
let styles = result.outputFiles.find((file) => file.path.endsWith(".css")).text;
if (useSprites && !usePatterns) {
  if (spriteImages.size !== (atlasColumns ? 1 : Math.ceil(limit / 1024)))
    throw new Error("Missing gallery sprites");
  const bootstrap = (await read("static/sprite-ids.mjs")).replace(
    /^export /gm,
    "",
  );
  script = `(async()=>{${bootstrap}\nglobalThis.__pixelconIds=await readSpriteIds(${limit}${atlasColumns ? "," + limit + "," + atlasColumns : ""});\n${script}})()`;
}
({ script, styles } = await minifyStatic(script, styles));
const json = JSON.stringify(data)
  .replace(/</g, "\\u003c")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");
const notices = (
  await Promise.all(
    ["node_modules/preact/LICENSE", "node_modules/clsx/license"].map(read),
  )
).join("\n\n");
const page = `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PixelCons</title><link rel="icon" href="${asset("/favicon.ico")}"><style>${styles}</style><script id="third-party-notices" type="text/plain">${notices}</script></head><body><div id="__next"></div><noscript>Enable JavaScript to browse PixelCons. No wallet connection is needed.</noscript><script id="pixelcons-data" type="application/json">${json}</script><script>${script}</script></body></html>\n`;
const html = usePacking ? await packPage(page) : page;
await mkdir(path.join(root, "out"), { recursive: true });
await writeFile(path.join(root, "out/index.html"), html);
console.log(
  `Built out/index.html (${Buffer.byteLength(html).toLocaleString()} bytes), ${limit.toLocaleString()} gallery records, original lite components/styles, ${assets.size} embedded assets.`,
);
