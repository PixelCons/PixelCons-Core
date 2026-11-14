import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import { gzipSync, brotliCompressSync } from "node:zlib";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  if (i < 0) return fallback;
  const value = args[i + 1];
  args.splice(i, 2);
  return value;
};
const iterations = Number(option("--iterations", "7"));
const cpu = Number(option("--cpu", "1"));
const reportPath = option("--report", "");
if (!args.length)
  throw new Error(
    "Usage: node scripts/benchmark-static.mjs [--iterations 7] [--cpu 4] [--report path.json] candidate.html ...",
  );
const candidates = await Promise.all(
  args.map(async (file) => {
    const html = await readFile(file);
    return {
      file: path.resolve(file),
      bytes: html.length,
      gzipBytes: gzipSync(html, { level: 9 }).length,
      brotliBytes: brotliCompressSync(html).length,
      samples: [],
    };
  }),
);
const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ||
    (existsSync("/usr/bin/google-chrome")
      ? "/usr/bin/google-chrome"
      : undefined),
  headless: true,
  args: ["--no-sandbox"],
});
try {
  for (let iteration = 0; iteration < iterations; iteration++) {
    for (let offset = 0; offset < candidates.length; offset++) {
      const candidate = candidates[(offset + iteration) % candidates.length];
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        offline: true,
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const session = await context.newCDPSession(page);
      await session.send("Emulation.setCPUThrottlingRate", { rate: cpu });
      await session.send("Performance.enable");
      await page.addInitScript(() => {
        window.__staticBenchmark = {};
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries())
            if (entry.name === "first-contentful-paint")
              window.__staticBenchmark.fcp = entry.startTime;
        }).observe({ type: "paint", buffered: true });
        let started = false;
        const observer = new MutationObserver(async () => {
          if (started) return;
          const tile = document.querySelector('a[href^="#0x"] > div');
          if (!tile) return;
          const background = getComputedStyle(tile).backgroundImage;
          if (!background.startsWith("url(")) return;
          started = true;
          observer.disconnect();
          window.__staticBenchmark.galleryDOM = performance.now();
          const image = new Image();
          image.src = background.slice(4, -1).replace(/^['"]|['"]$/g, "");
          await image.decode();
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              window.__staticBenchmark.firstArt = performance.now();
            }),
          );
        });
        observer.observe(document, { childList: true, subtree: true });
        const complete = new MutationObserver(() => {
          if (document.querySelectorAll('a[href^="#0x"]').length === 10000) {
            window.__staticBenchmark.fullGallery = performance.now();
            complete.disconnect();
          }
        });
        complete.observe(document, { childList: true, subtree: true });
      });
      const start = performance.now();
      await page.goto(pathToFileURL(candidate.file).href);
      await page.waitForFunction(
        () => window.__staticBenchmark?.firstArt !== undefined,
        null,
        { timeout: 30000 },
      );
      await page.waitForFunction(
        () => document.querySelectorAll('a[href^="#0x"]').length === 10000,
      );
      const sample = await page.evaluate(() => ({
        ...window.__staticBenchmark,
        count: document.querySelectorAll('a[href^="#0x"]').length,
      }));
      sample.wall = performance.now() - start;
      const { metrics } = await session.send("Performance.getMetrics");
      sample.cpu = Object.fromEntries(
        metrics
          .filter((metric) =>
            [
              "TaskDuration",
              "ScriptDuration",
              "LayoutDuration",
              "RecalcStyleDuration",
              "JSHeapUsedSize",
            ].includes(metric.name),
          )
          .map((metric) => [metric.name, metric.value]),
      );
      if (errors.length || sample.count !== 10000)
        throw new Error(
          JSON.stringify({ candidate: candidate.file, errors, sample }),
        );
      candidate.samples.push(sample);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
const percentile = (values, p) =>
  values.toSorted((a, b) => a - b)[
    Math.min(values.length - 1, Math.floor(values.length * p))
  ];
const report = {
  cpu,
  iterations,
  measuredAt: new Date().toISOString(),
  candidates: candidates.map((candidate) => ({
    ...candidate,
    medianFirstArt: percentile(
      candidate.samples.map((s) => s.firstArt),
      0.5,
    ),
    p90FirstArt: percentile(
      candidate.samples.map((s) => s.firstArt),
      0.9,
    ),
    medianFCP: percentile(
      candidate.samples.map((s) => s.fcp),
      0.5,
    ),
    medianGalleryDOM: percentile(
      candidate.samples.map((s) => s.galleryDOM),
      0.5,
    ),
    medianFullGallery: percentile(
      candidate.samples.map((s) => s.fullGallery),
      0.5,
    ),
    medianTaskDuration: percentile(
      candidate.samples.map((s) => s.cpu.TaskDuration),
      0.5,
    ),
  })),
};
if (reportPath)
  await writeFile(reportPath, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
