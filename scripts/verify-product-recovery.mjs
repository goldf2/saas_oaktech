// Isolated verification of a persisted two-product catalog upgraded by the production startup migration.
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const project = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(path.join(os.tmpdir(), "oaktech-recovery-ui-"));
const output = process.env.STORE_VERIFY_OUTPUT || await mkdtemp(path.join(os.tmpdir(), "oaktech-recovery-results-"));
await mkdir(output, { recursive: true });
const legacyProduct = (slug, name, icon, category) => ({
  id: `existing-${slug}`, slug, name_en: name, name_zh: name,
  category_slug: category, status: "beta", visibility: "published", tagline_en: "Existing product", tagline_zh: "已有商品",
  description_en: "Existing catalog content", description_zh: "原目录商品资料保持不变", icon_url: icon,
  hero_image_url: icon, supported_platforms: ["macOS", "Windows"], featured: false,
});
const before = {
  schemaVersion: 1, updatedAt: "2026-09-03T00:00:00Z",
  products: [legacyProduct("x-tweet-extractor", "X 推文提取器", "/x-tweet-extractor/store-logo-128.png", "browser-extensions"), legacyProduct("gitfinder-2", "GitFinder 2", "/gitfinder-2/icon.png", "desktop-apps")],
  releases: [],
};
const originalBytes = `${JSON.stringify(before)}\n`;
await writeFile(path.join(temporary, "catalog.json"), originalBytes);
const port = await new Promise((resolve) => {
  const probe = net.createServer();
  probe.listen(0, "127.0.0.1", () => { const address = probe.address(); probe.close(() => resolve(address.port)); });
});
const base = `http://127.0.0.1:${port}`;
const environment = {
  ...process.env, NODE_ENV: "production", RELEASE_STORAGE_ROOT: temporary,
  CASDOOR_AUTH_ENABLED: "true", CASDOOR_ISSUER: "http://127.0.0.1:9", CASDOOR_CLIENT_ID: "isolated-test",
  NEXTAUTH_URL: base, NEXTAUTH_SECRET: randomBytes(32).toString("hex"), BASE_URL: base,
};
let server;
let browser;
let log = "";
const report = { checks: [], screenshots: [], status: "running", output, fixture: "temporary persistent catalog originally containing only X and GitFinder" };
const check = (name) => { report.checks.push(name); console.log(`PASS ${name}`); };
try {
  const startup = spawnSync(process.execPath, ["scripts/restore-product-listings.mjs"], { cwd: project, env: environment, encoding: "utf8" });
  assert.equal(startup.status, 0, startup.stderr);
  const migration = JSON.parse(startup.stdout);
  assert.equal(migration.status, "applied");
  assert.equal(await readFile(path.join(temporary, migration.backupPath), "utf8"), originalBytes);
  const after = JSON.parse(await readFile(path.join(temporary, "catalog.json"), "utf8"));
  assert.equal(after.products.length, 4);
  assert.deepEqual(after.products.slice(0, 2), before.products);
  assert.deepEqual(after.releases, before.releases);
  check("production startup command migrates 2 to 4 listings with an exact backup and unchanged releases");

  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], { cwd: project, env: environment, stdio: ["ignore", "pipe", "pipe"] });
  for (const stream of [server.stdout, server.stderr]) stream.on("data", (data) => { log = (log + data.toString()).slice(-20000); });
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server failed: ${log}`);
    if ((await fetch(`${base}/api/health`).catch(() => null))?.ok) { ready = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  assert.ok(ready);
  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  browser = await puppeteer.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setRequestInterception(true);
  page.on("request", (request) => request.url().startsWith(base) || /^(data|blob):/.test(request.url()) ? request.continue() : request.abort());
  await page.setViewport({ width: 1440, height: 1000 });
  const screenshot = async (name) => { const file = path.join(output, name); await page.screenshot({ path: file, fullPage: true }); report.screenshots.push(file); };
  for (const locale of ["zh", "en"]) {
    const response = await page.goto(`${base}/${locale}`, { waitUntil: "networkidle0" });
    assert.equal(response.status(), 200);
    for (const slug of ["open-play", "chanxu-tradingview"]) await page.waitForSelector(`main a[href="/${locale}/products/${slug}"]`);
    await screenshot(`catalog-${locale}.png`);
  }
  check("both live localized storefronts display Auth and Chanxu from the migrated persistent catalog");
  for (const [slug, title, icon] of [["open-play", "认证管理工具", "/open-play/icon.png"], ["chanxu-tradingview", "缠论工具", "/chanxu-tradingview/icon-chanxu-v2.png"]]) {
    await page.setViewport({ width: 390, height: 844 });
    assert.equal((await page.goto(`${base}/zh/products/${slug}`, { waitUntil: "networkidle0" })).status(), 200);
    assert.ok((await page.$eval("h1", (element) => element.textContent)).includes(title));
    const images = await page.$$eval("main img", (items) => items.map((item) => ({ src: item.src, loaded: item.complete && item.naturalWidth > 0 })));
    assert.ok(images.every((item) => item.loaded));
    assert.ok(images.some((image) => { const url = new URL(image.src); return (url.searchParams.get("url") || url.pathname) === icon; }));
    assert.equal(await page.$("main a[download]"), null, "no unverified package download fabricated");
    assert.match(await page.$eval("main", (element) => element.textContent), /目前还没有可用的已验证下载/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await screenshot(`${slug}-mobile.png`);
    check(`${slug} details render their own title and image; no package or version is invented`);
  }
  for (const [category, slug] of [["desktop-apps", "open-play"], ["trading-tools", "chanxu-tradingview"]]) {
    assert.equal((await page.goto(`${base}/categories/${category}`, { waitUntil: "networkidle0" })).status(), 200);
    await page.waitForSelector(`main a[href$="/products/${slug}"]`);
  }
  check("each listing appears in its own category");
  assert.deepEqual(errors, []);
  const rerun = spawnSync(process.execPath, ["scripts/restore-product-listings.mjs"], { cwd: project, env: environment, encoding: "utf8" });
  assert.equal(JSON.parse(rerun.stdout).status, "already-applied");
  check("subsequent startup sees the completion marker and performs no second repair");
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error.stack;
  process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill("SIGTERM");
  if (server && server.exitCode === null) await new Promise((resolve) => { server.once("exit", resolve); setTimeout(resolve, 3000).unref(); });
  await rm(temporary, { recursive: true, force: true });
  await writeFile(path.join(output, "result.json"), JSON.stringify(report, null, 2));
  if (report.status === "failed") await writeFile(path.join(output, "server.log"), log);
  console.log(JSON.stringify(report, null, 2));
}
