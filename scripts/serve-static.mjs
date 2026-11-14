import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

// Serve only the generated HTML. No source, archive, or credentials are exposed.
const file = new URL("../out/index.html", import.meta.url);
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 3000);
await readFile(file).catch(() => {
  throw new Error("Build the site first with npm run build");
});
createServer(async (request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  if (pathname === "/" || pathname === "/index.html") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(request.method === "HEAD" ? undefined : await readFile(file));
  } else {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, host, () => console.log(`PixelCons: http://${host}:${port}`));
