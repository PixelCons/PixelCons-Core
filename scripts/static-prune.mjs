import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
const root = new URL("../", import.meta.url).pathname;
const used = new Map();
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.[jt]sx?$/.test(file)) {
      const source = fs.readFileSync(file, "utf8");
      for (const match of source.matchAll(
        /import\s+(\w+)\s+from\s+['"]([^'"]+\.module\.scss)['"]/g,
      )) {
        const key = path.resolve(path.dirname(file), match[2]);
        if (used.get(key) === null) continue;
        if (new RegExp("\\b" + match[1] + "\\s*\\[").test(source)) {
          used.set(key, null);
          continue;
        }
        const set = used.get(key) || new Set();
        for (const ref of source.matchAll(
          new RegExp("\\b" + match[1] + "\\.(\\w+)", "g"),
        ))
          set.add(ref[1]);
        used.set(key, set);
      }
    }
  }
}
walk(path.join(root, "src"));
walk(path.join(root, "static"));
export function pruneUnusedModuleCSS(css, file) {
  if (!file.endsWith(".module.scss")) return css;
  const names = used.get(file);
  if (!names) return css;
  const ast = postcss.parse(css);
  ast.walkRules((rule) => {
    const selectors = rule.selectors.filter((selector) => {
      if (/:(?:is|not|where|has|global)\(/.test(selector)) return true;
      return [...selector.matchAll(/\.([_a-zA-Z][\w-]*)/g)].every((match) =>
        names.has(match[1]),
      );
    });
    if (!selectors.length) rule.remove();
    else rule.selectors = selectors;
  });
  return ast.toString();
}
