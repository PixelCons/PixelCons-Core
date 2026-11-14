import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import { chromium } from "playwright";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { unpackPage } from "./static-page.mjs";
import { detailHash } from "../static/model.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "artifacts/static-parity");
await mkdir(output, { recursive: true });
const archive = JSON.parse(
  await readFile(path.join(root, "archive/pixelcons.json"), "utf8"),
);
const lite = process.env.LITE_URL || "http://localhost:3001";
const html = await readFile(path.join(root, "out/index.html"));
const archiveContract = JSON.parse(
  unpackPage(html.toString()).match(
    /type="application\/json">([\s\S]*?)<\/script>/,
  )[1],
).contract;
const server = createServer((_request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  response.end(html);
}).listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const ultra = `http://127.0.0.1:${server.address().port}`;
const executablePath =
  process.env.CHROME_PATH ||
  (existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined);
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--no-sandbox"],
});
const report = [];
const preview = (page) =>
  page
    .getByText("1 of 26", { exact: true })
    .locator("..")
    .locator("xpath=following-sibling::div[1]");
async function compare(pages, label) {
  const shots = await Promise.all(pages.map((page) => page.screenshot()));
  const [expected, actual] = shots.map((shot) => PNG.sync.read(shot));
  const diff = new PNG({ width: expected.width, height: expected.height });
  const pixels = pixelmatch(
    expected.data,
    actual.data,
    diff.data,
    expected.width,
    expected.height,
    { threshold: 0.1 },
  );
  await Promise.all([
    writeFile(path.join(output, `${label}-lite.png`), shots[0]),
    writeFile(path.join(output, `${label}-ultra.png`), shots[1]),
    writeFile(path.join(output, `${label}-diff.png`), PNG.sync.write(diff)),
  ]);
  report.push({ label, differentPixels: pixels });
  console.log(`${label}: ${pixels} differing pixels`);
}
async function verifyDeepScroll(page) {
  const last = page.locator('a[href^="#0x"]').nth(9999);
  await last.scrollIntoViewIfNeeded();
  const deepScroll = await page.evaluate(() => scrollY);
  await last.click();
  await page.getByText("#9999", { exact: true }).waitFor();
  await page.goBack();
  await page.waitForFunction(
    () => document.querySelectorAll('a[href^="#0x"]').length === 10000,
  );
  await page.waitForTimeout(150);
  assert.ok(
    Math.abs(deepScroll - (await page.evaluate(() => scrollY))) < 2,
    "Progressive gallery lost deep history scroll",
  );
}
try {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 900, height: 900 },
    { width: 1280, height: 900 },
    { width: 2200, height: 1000 },
    { width: 1280, height: 900, scale: 2 },
  ]) {
    for (const route of [
      "",
      "?collection=1",
      "?creator=" + archive[0].creator,
      "?collection=1&creator=" + archive[0].creator,
      "details/" + archive[0].id,
      "about",
      "terms",
    ]) {
      const contextOptions = {
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: viewport.scale || 1,
      };
      const contexts = await Promise.all([
        browser.newContext(contextOptions),
        browser.newContext(contextOptions),
      ]);
      try {
        const pages = await Promise.all(
          contexts.map((context) => context.newPage()),
        );
        const errors = [];
        for (const page of pages)
          page.on("pageerror", (error) => errors.push(error.message));
        const requests = [];
        pages[1].on("request", (request) => {
          if (/^https?:/.test(request.url())) requests.push(request.url());
        });
        const hash = route.startsWith("details/")
          ? "#" + archive[0].id
          : "#" + route;
        await Promise.all([
          pages[0].goto(lite + "/" + route),
          pages[1].goto(ultra + "/" + hash),
        ]);
        if (!route || route.startsWith("?")) {
          const expectedLinks = route.includes("collection=") ? 0 : 1;
          await pages[1].waitForFunction(
            (count) =>
              document.querySelectorAll(".gallery-end").length === count,
            expectedLinks,
          );
          const params = new URLSearchParams(route);
          const expectedCount = archive.filter(
            (p) =>
              p.index < 10000 &&
              (!params.has("collection") ||
                p.collection === Number(params.get("collection"))) &&
              (!params.has("creator") || p.creator === params.get("creator")),
          ).length;
          await pages[1].waitForFunction(
            (count) =>
              document.querySelectorAll('a[href^="#0x"]').length === count,
            expectedCount,
          );
        }
        await Promise.all(
          pages.map(async (page) => {
            await page.waitForFunction(() => document.querySelector("main a"));
            await page.waitForTimeout(150);
            // Exclude only the explicitly requested OpenSea additions and Next's development badge.
            await page.addStyleTag({
              content:
                "nextjs-portal, .gallery-end { display:none !important; }",
            });
            await page.waitForFunction(() =>
              Array.from(document.images).every((image) => image.complete),
            );
          }),
        );
        const name = !route
          ? "gallery"
          : route === "about" || route === "terms"
            ? route
            : route.startsWith("details/")
              ? "details"
              : route.includes("&")
                ? "combined-filter"
                : route.includes("creator")
                  ? "creator-filter"
                  : "collection-filter";
        if (name === "gallery") {
          // Normalize the requested cutoff, including the centered last row.
          await pages[0]
            .locator('a[href^="/details/"]')
            .nth(9999)
            .evaluate((last) => {
              while (last.nextElementSibling) last.nextElementSibling.remove();
            });
        }
        const label = `${viewport.width}${viewport.scale ? "-2x" : ""}-${name}`;
        await compare(pages, label);
        if (name === "details") {
          const states = await Promise.all(
            pages.map((page) =>
              preview(page).evaluate((node) => ({
                width: node.getBoundingClientRect().width,
                transition: getComputedStyle(node).transition,
              })),
            ),
          );
          assert.deepEqual(
            states[1],
            states[0],
            "Collection transition differs",
          );
          await Promise.all(pages.map((page) => preview(page).hover()));
          await Promise.all(pages.map((page) => page.waitForTimeout(180)));
          const widths = await Promise.all(
            pages.map((page) =>
              preview(page).evaluate(
                (node) => node.getBoundingClientRect().width,
              ),
            ),
          );
          assert.equal(
            widths[1],
            widths[0],
            "Expanded collection width differs",
          );
          await compare(pages, `${label}-hover`);
        }
        if (name === "gallery") {
          const links = [
            pages[0].locator('a[href^="/details/"]'),
            pages[1].locator('a[href^="#0x"]'),
          ];
          const bounds = await Promise.all(
            links.map((nodes) =>
              nodes.evaluateAll((anchors) =>
                anchors.slice(0, 10000).map((node) => {
                  const { x, y, width, height } = node.getBoundingClientRect();
                  return { index: node.textContent, x, y, width, height };
                }),
              ),
            ),
          );
          assert.equal(bounds[1].length, 10000);
          const visibleLinks = await pages[1]
            .locator('a[href^="#0x"]')
            .evaluateAll((anchors) =>
              anchors.slice(0, 10000).map((node) => node.getAttribute("href")),
            );
          assert.deepEqual(
            visibleLinks,
            archive
              .slice(0, 10000)
              .map((pixelcon) =>
                detailHash(
                  pixelcon.id,
                  pixelcon.name,
                  pixelcon.index,
                  pixelcon.date / 1000,
                ),
              ),
            "Sprite-derived IDs or URL metadata differ from the archive",
          );
          assert.deepEqual(
            bounds[1],
            bounds[0],
            "Gallery geometry differs within the first 10,000",
          );
          await Promise.all(
            pages.map((page) =>
              page
                .locator('a[href="https://opensea.io/collection/pixelcons"]')
                .first()
                .locator("div")
                .hover(),
            ),
          );
          await compare(pages, `${label}-opensea-hover`);
        }
        assert.deepEqual(errors, []);
        assert.equal(
          requests.length,
          1,
          "Single-file website made supporting network requests",
        );
      } finally {
        await Promise.all(contexts.map((context) => context.close()));
      }
    }
  }
  // Navigation and unknown-token rendering must work from the file alone, offline.
  const context = await browser.newContext({
    offline: true,
    viewport: { width: 390, height: 844 },
  });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(pathToFileURL(path.join(root, "out/index.html")).href);
    await page.waitForFunction(
      () => document.querySelectorAll('a[href^="#0x"]').length === 10000,
    );
    const item = page.locator('a[href^="#0x"]').nth(100);
    await item.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => scrollY);
    await item.click();
    await page.getByText("#100", { exact: true }).waitFor();
    const linkMetadata = await page.evaluate(() =>
      Object.fromEntries(new URLSearchParams(location.hash.split("?")[1])),
    );
    assert.equal(linkMetadata.index, "100");
    assert.equal(
      linkMetadata.date,
      String(Math.floor(archive[100].date / 1000)),
    );
    await page.goBack();
    await page.waitForFunction(
      () => document.querySelectorAll('a[href^="#0x"]').length === 10000,
    );
    await page.waitForTimeout(150);
    assert.ok(
      Math.abs(before - (await page.evaluate(() => scrollY))) < 2,
      "Back navigation lost gallery scroll",
    );
    await verifyDeepScroll(page);
    await page.evaluate((id) => {
      location.hash = "#" + id;
    }, archive[0].id);
    await page.getByText("1 of 26", { exact: true }).waitFor();
    await page.getByRole("link", { name: "Creator", exact: true }).click();
    const creatorCount = archive.filter(
      (p) => p.index < 10000 && p.creator === archive[0].creator,
    ).length;
    await page.waitForFunction(
      (count) =>
        location.hash.includes("creator=") &&
        document.querySelectorAll('a[href^="#0x"]').length === count,
      creatorCount,
    );
    // Filter chip close links use history replacement, as in lite.
    const close = page
      .locator('a[href="#"]')
      .filter({ has: page.locator("div") })
      .first();
    await close.locator("div").click();
    await page.waitForFunction(
      () => document.querySelectorAll('a[href^="#0x"]').length === 10000,
    );
    await verifyDeepScroll(page);
    await page.evaluate(
      ({ id, date }) => {
        location.hash =
          "#" + id + "?name=54696e79526f626f&index=10000&date=" + date;
      },
      { id: archive[10000].id, date: Math.floor(archive[10000].date / 1000) },
    );
    await page.getByText("TinyRobo", { exact: true }).waitFor();
    await page.getByText("#10000", { exact: true }).waitFor();
    const dateText = await page.evaluate((timestamp) => {
      const date = new Date(timestamp);
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return (
        String(date.getDate()).padStart(2, "0") +
        " " +
        months[date.getMonth()] +
        " " +
        date.getFullYear()
      );
    }, archive[10000].date);
    await page.getByText(dateText, { exact: true }).waitFor();
    assert.equal(
      await page.getByText("View on OpenSea", { exact: true }).count(),
      0,
    );
    const assetLinks = page.locator(
      'a[href^="https://opensea.io/assets/ethereum/"]',
    );
    assert.equal(await assetLinks.count(), 1);
    assert.equal(
      await assetLinks.getAttribute("href"),
      `https://opensea.io/assets/ethereum/${archiveContract}/${BigInt(archive[10000].id)}`,
    );
    await page.evaluate((id) => {
      location.hash = "#" + id + "?name=3c7363726970743e";
    }, archive[10000].id);
    await page.getByText("<script>", { exact: true }).waitFor();
    assert.equal(await page.locator("span script").count(), 0);
    await page.evaluate((id) => {
      location.hash = "#" + id + "?name=ff00000000000000";
    }, archive[10000].id);
    await page.getByRole("status").waitFor();
    assert.deepEqual(errors, []);
    console.log(
      "Offline file navigation, scroll restoration, filters, name bytes, later tokens: passed",
    );
  } finally {
    await context.close();
  }
  assert.ok(
    report.every((item) => item.differentPixels === 0),
    "Unexpected visual differences; see artifacts/static-parity",
  );
} finally {
  await writeFile(
    path.join(output, "report.json"),
    JSON.stringify(report, null, 2),
  );
  await browser.close();
  server.close();
}
