import { minify } from "terser";
import { transform } from "lightningcss";

export const staticAliases = {
  react: new URL("../static/shims/react-direct.ts", import.meta.url).pathname,
  "react-dom": new URL("../static/shims/dom-direct.ts", import.meta.url)
    .pathname,
  "react-dom/client": new URL(
    "../static/shims/client-direct.ts",
    import.meta.url,
  ).pathname,
  "react/jsx-runtime": "preact/jsx-runtime",
};

export function pruneStaticStyles(source) {
  return source.replace(
    /\/\* Derivative elements \*\/[\s\S]*?(?=\n}\n@media)/,
    "",
  );
}

export async function minifyStatic(script, styles) {
  const result = await minify(script, {
    ecma: 2020,
    compress: { passes: 3 },
    mangle: {
      properties: {
        regex:
          /^(pixelcon(Id|Ids|s)?|archiveData|derivativeOf|isSpacer|showDates|linkCreator|maxChars|abbrChars|showIdenticon|unarchived(Name|Index|Date))$/,
        keep_quoted: true,
      },
    },
    format: { comments: /@license|@preserve|^!/ },
  });
  return {
    script: result.code.replace(/<\/script/gi, "<\\/script"),
    styles: transform({
      filename: "style.css",
      code: Buffer.from(styles),
      minify: true,
      targets: {
        chrome: 106 << 16,
        firefox: 113 << 16,
        safari: (16 << 16) | (4 << 8),
      },
    }).code.toString(),
  };
}
