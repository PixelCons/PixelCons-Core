// The existing lossless gallery sheets already contain every bit of each ID.
// Reading them once avoids a second copy of 10,000 256-bit values in the HTML.
export async function readSpriteIds(count, perSheet = 1024, columns = 32) {
  const sheets = new Array(Math.ceil(count / perSheet));
  function visit(rules) {
    for (const rule of rules) {
      const marker = rule.style?.getPropertyValue("--pixelcon-sheet");
      if (marker) sheets[Number(marker)] = rule.style.backgroundImage;
      if (rule.cssRules) visit(rule.cssRules);
    }
  }
  for (const sheet of document.styleSheets) visit(sheet.cssRules);
  for (let index = 0; index < sheets.length; index++) {
    if (!sheets[index]?.startsWith("url("))
      throw new Error("Missing sprite sheet");
  }
  // All sixteen colors have distinct red/green pairs in the existing palette.
  const palette = [
    0x0000, 0x1d2b, 0x7e25, 0x0087, 0xab52, 0x5f57, 0xc2c3, 0xfff1, 0xff00,
    0xffa3, 0xffff, 0x00e7, 0x29ad, 0x8376, 0xff77, 0xffcc,
  ];
  const lookup = new Uint8Array(65536);
  lookup.fill(48);
  palette.forEach((value, index) => {
    lookup[value] = index < 10 ? 48 + index : 87 + index;
  });
  return (
    await Promise.all(
      sheets.map(async (sheet, index) => {
        const image = new Image();
        image.src = sheet.slice(4, -1).replace(/^['"]|['"]$/g, "");
        await image.decode();
        const canvas = document.createElement("canvas");
        const width = image.width,
          height = image.height;
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, width, height).data;
        const tokens = Math.min(perSheet, count - index * perSheet);
        const ascii = new Uint8Array(tokens * 67);
        let cursor = 0;
        for (let token = 0; token < tokens; token++) {
          const x = (token % columns) * 8,
            y = Math.floor(token / columns) * 8;
          ascii[cursor++] = 48;
          ascii[cursor++] = 120;
          for (let row = 0; row < 8; row++) {
            let offset = ((y + row) * width + x) * 4;
            for (let column = 0; column < 8; column++, offset += 4)
              ascii[cursor++] =
                lookup[(pixels[offset] << 8) | pixels[offset + 1]];
          }
          ascii[cursor++] = 10;
        }
        return new TextDecoder()
          .decode(ascii.subarray(0, ascii.length - 1))
          .split("\n");
      }),
    )
  ).flat();
}
