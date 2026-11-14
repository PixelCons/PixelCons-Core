import { gunzipSync } from "node:zlib";
import { minify } from "terser";
import {
  encode as encodeByteText,
  decode as decodeByteText,
} from "./static-byte-text.mjs";
import {
  encodeAssetEnvelope,
  decodeAssetEnvelope,
  browserAssetEnvelope,
} from "./static-asset-envelope.mjs";
import { compressStatic } from "./static-compress.mjs";
import { renderPatterns } from "./static-patterns.mjs";

export async function packPage(html) {
  const binary = process.env.STATIC_ASSET_ENVELOPE !== "0";
  const bytes = await compressStatic(
    binary ? encodeAssetEnvelope(html) : Buffer.from(html),
  );
  const dense = process.env.STATIC_TEXT_ENCODING !== "base64";
  const payload = dense ? encodeByteText(bytes) : bytes.toString("base64");
  const patterns = html.includes("data:image/x-pixelcons-template;")
    ? "," + renderPatterns.toString()
    : "";
  const boot = `(async()=>{const n=document.getElementById('pixelcons-page');let b;if(n.dataset.encoding==='u7')b=(${decodeByteText.toString()})(n.textContent,+n.dataset.size);else{const s=n.textContent;if(Uint8Array.fromBase64)b=Uint8Array.fromBase64(s);else{const x=atob(s);b=new Uint8Array(x.length);for(let i=0;i<x.length;i++)b[i]=x.charCodeAt(i)}}const a=new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());const h=(${browserAssetEnvelope.toString()})(a${patterns});document.open();document.write(h);document.close()})().catch(()=>{document.body.textContent='This file requires a current browser.'})`;
  const script = (
    await minify(boot, { ecma: 2020, compress: { passes: 2 }, mangle: true })
  ).code;
  const attributes = dense
    ? ` data-encoding="u7" data-size="${bytes.length}"`
    : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>PixelCons</title><style>html,body{background:#000;color:#ddd;margin:0}</style></head><body><noscript>Enable JavaScript to browse PixelCons. No wallet connection is needed.</noscript><script id="pixelcons-page" type="application/gzip"${attributes}>${payload}</script><script>${script}</script></body></html>`;
}

export function unpackPage(html) {
  const packed = html.match(
    /<script id="pixelcons-page" type="application\/gzip"([^>]*)>([\s\S]*?)<\/script>/,
  );
  if (!packed) return html;
  const dense = /data-encoding="u7"/.test(packed[1]);
  const bytes = dense
    ? decodeByteText(packed[2], Number(packed[1].match(/data-size="(\d+)"/)[1]))
    : Buffer.from(packed[2], "base64");
  return decodeAssetEnvelope(gunzipSync(bytes));
}
