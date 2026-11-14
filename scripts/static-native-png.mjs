// Static-browser-only transform; keep the source archiver's Uint8Array PNG API untouched.
export function nativePNGSource(source) {
  const block =
    "  const image = new Uint8Array(upng.encode([dataArray.buffer], width, height, 0));\n  const icon = `data:image/png;base64,${Buffer.from(image).toString('base64')}`;";
  if (source.split(block).length !== 3)
    throw new Error("Expected the two icon/identicon PNG encode blocks");
  return (
    source
      .replace("import upng from 'upng-js';", "")
      .replaceAll(
        block,
        "  const icon = encodeBrowserPNG(dataArray, width, height);",
      ) +
    `
// One reusable native encoder; pixel and identicon generation/caches above are unchanged.
let browserPNGCanvas: HTMLCanvasElement;
function encodeBrowserPNG(data: Uint8Array, width: number, height: number): string {
  browserPNGCanvas ||= document.createElement('canvas');
  if (browserPNGCanvas.width !== width) browserPNGCanvas.width = width;
  if (browserPNGCanvas.height !== height) browserPNGCanvas.height = height;
  browserPNGCanvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(data), width, height), 0, 0);
  return browserPNGCanvas.toDataURL('image/png');
}
`
  );
}
