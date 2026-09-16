// Run after npm run build. Uses an isolated store and synthetic local-only session;
// never contacts a real identity provider, writes production data, or publishes real software.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const require = createRequire(import.meta.url);
const { encode } = require("next-auth/jwt");
const project = fileURLToPath(new URL("../", import.meta.url));
const temporary = await mkdtemp(path.join(os.tmpdir(), "oaktech-store-ui-"));
const storage = path.join(temporary, "releases");
const output = process.env.STORE_VERIFY_OUTPUT || await mkdtemp(path.join(os.tmpdir(), "oaktech-store-ui-results-"));
await mkdir(storage, { recursive: true });
await mkdir(output, { recursive: true });
const port = await new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.once("error", reject);
  probe.listen(0, "127.0.0.1", () => { const address = probe.address(); probe.close(() => resolve(address.port)); });
});
const base = `http://127.0.0.1:${port}`;
const secret = randomBytes(32).toString("hex");
const issuer = "http://127.0.0.1:9";
const subject = "isolated-store-ui-test";
const report = { version: require("../package.json").version, checks: [], screenshots: [], loginScope: "synthetic local session; not a real Casdoor login" };
let serverLog = "";
let browser;
let page;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-H", "127.0.0.1", "-p", String(port)], {
  cwd: project,
  env: { ...process.env, NODE_ENV: "production", RELEASE_STORAGE_ROOT: storage, CASDOOR_AUTH_ENABLED: "true", CASDOOR_ISSUER: issuer, CASDOOR_CLIENT_ID: "isolated-test", NEXTAUTH_URL: base, NEXTAUTH_SECRET: secret, OAKTECH_ADMIN_SUBJECTS: subject, OAKTECH_ADMIN_USER_IDS: "", OAKTECH_ADMIN_EMAILS: "", OAKTECH_RELEASE_WRITE_TOKEN: randomBytes(32).toString("hex"), BASE_URL: base },
  stdio: ["ignore", "pipe", "pipe"],
});
for (const stream of [server.stdout, server.stderr]) stream.on("data", (data) => { serverLog = (serverLog + data.toString()).slice(-16000); });
const check = (name) => { report.checks.push(name); console.log(`PASS ${name}`); };
const catalog = async () => JSON.parse(await readFile(path.join(storage, "catalog.json"), "utf8"));

async function fillForm(selector, values) {
  await page.$eval(selector, (form, values) => {
    for (const [name, value] of Object.entries(values)) {
      const element = form.elements.namedItem(name);
      if (!element) throw new Error(`Missing field: ${name}`);
      element.value = value;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }, values);
}
async function screenshot(name) {
  const destination = path.join(output, name);
  await page.screenshot({ path: destination, fullPage: true });
  report.screenshots.push(destination);
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error(`Local server exited: ${serverLog}`);
    const response = await fetch(`${base}/api/health`).catch(() => null);
    if (response?.ok) { ready = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert.ok(ready, "local server ready");
  for (const route of ["/admin", "/admin/products", "/admin/products/new", "/admin/releases"]) {
    const response = await fetch(`${base}${route}`);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /admin-access-notice/);
    assert.doesNotMatch(html, /name="(?:slug|release_id|product_slug)"/);
  }
  assert.equal((await fetch(`${base}/api/admin/releases/import`, { method: "POST", body: "{}" })).status, 401);
  check("anonymous visitors get an access notice, never administrator forms or import access");

  const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  browser = await puppeteer.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}), args: ["--disable-background-networking"] });
  page = await browser.newPage();
  page.setDefaultTimeout(20000);
  await page.setViewport({ width: 1440, height: 1000 });
  const runtimeErrors = [];
  const uploadOffsets = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    const url = request.url();
    if (url.startsWith(`${base}/api/admin/releases/upload?`)) uploadOffsets.push(Number(new URL(url).searchParams.get("offset")));
    if (url.startsWith(base) || url.startsWith("data:") || url.startsWith("blob:")) request.continue();
    else request.abort();
  });
  const normalSubject = "isolated-normal-store-user";
  const normalToken = await encode({ secret, token: { sub: normalSubject, casdoorSubject: normalSubject, casdoorIssuer: issuer }, maxAge: 3600 });
  await browser.setCookie({ name: "next-auth.session-token", value: normalToken, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" });
  await page.goto(`${base}/admin/products/new`, { waitUntil: "networkidle0" });
  assert.match(await page.$eval("h1", (element) => element.textContent), /没有商品管理权限/);
  assert.equal(await page.$('input[name="slug"]'), null);
  const forbiddenUpload = await page.evaluate(async () => (await fetch("/api/admin/releases/upload", { method: "POST", headers: { "x-oaktech-admin-upload": "1" }, body: "not-authorized" })).status);
  assert.equal(forbiddenUpload, 403);
  check("signed-in nonadministrators receive a clear permission message and cannot upload");
  const token = await encode({ secret, token: { sub: subject, casdoorSubject: subject, casdoorIssuer: issuer }, maxAge: 3600 });
  await browser.setCookie({ name: "next-auth.session-token", value: token, domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" });
  await page.goto(`${base}/admin/products/new`, { waitUntil: "networkidle0" });
  assert.match(await page.$eval("h1", (element) => element.textContent), /商品/);

  const product = { slug: "store-regression-tool", category_slug: "browser-extensions", status: "beta", visibility: "published", icon_url: "/gitfinder-2/icon.png", hero_image_url: "/gitfinder-2/hero.svg", name_en: "Store regression fixture", name_zh: "商城发布测试", tagline_en: "Local test fixture only", tagline_zh: "仅用于本地发布验证", description_en: "Synthetic package used to verify the store workflow.", description_zh: "用于验证商品、发布与下载闭环的本地测试数据。", supported_platforms: "Chrome" };
  await fillForm("main form", product);
  await page.$eval("main form", (form) => form.requestSubmit());
  await page.waitForFunction(() => location.search.includes("saved=1"));
  const original = (await catalog()).products.find((item) => item.slug === product.slug);
  assert.ok(original?.id);
  check("product creation persists bilingual content and visibility");

  await page.goto(`${base}/admin/products/new`, { waitUntil: "networkidle0" });
  await fillForm("main form", { ...product, name_en: "Must not overwrite" });
  await page.$eval("main form", (form) => form.requestSubmit());
  await page.waitForFunction(() => [...document.querySelectorAll('[role="alert"]')].some((element) => element.textContent.includes("已存在")));
  assert.deepEqual((await catalog()).products.find((item) => item.slug === product.slug), original);
  assert.equal(await page.$eval('main input[name="slug"]', (element) => element.value), product.slug, "validation errors preserve entered values");
  check("duplicate product shows inline feedback without overwriting or clearing inputs");
  await screenshot("products-desktop.png");

  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle0" });
  await page.waitForSelector('[data-testid="store-admin-panel"] a[href="/admin/products/new"]');
  const chanxuCard = '[data-product-slug="chanxu-tradingview"]';
  const authCard = '[data-product-slug="open-play"]';
  assert.match(await page.$eval(chanxuCard, (element) => element.textContent), /缠序.*交易研究工具|交易研究工具.*缠序/);
  assert.match(await page.$eval(authCard, (element) => element.textContent), /已发布/);
  const imagePath = async (selector) => {
    const url = new URL(await page.$eval(`${selector} img`, (image) => image.src));
    return url.searchParams.get("url") || url.pathname;
  };
  assert.equal(await imagePath(chanxuCard), "/chanxu-tradingview/icon-chanxu-v2.png");
  assert.equal(await imagePath(authCard), "/open-play/icon.png");
  await screenshot("dashboard-products-desktop.png");
  check("Dashboard shows separate Chanxu and released Open Play cards with the correct images");

  await page.setViewport({ width: 390, height: 844 });
  await page.click('[data-testid="mobile-menu-trigger"]');
  await page.waitForSelector('[role="dialog"] a[href="/admin"]');
  await screenshot("mobile-admin-menu.png");
  await page.click('[role="dialog"] a[href="/admin"]');
  await page.waitForFunction(() => location.pathname === "/admin");
  await page.waitForSelector('[role="dialog"]', { hidden: true });
  await page.waitForSelector('main a[href="/admin/products/new"]');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await screenshot("admin-overview-mobile.png");
  check("mobile menu reaches the administration overview and its Add product action");

  const liveCatalog = await catalog();
  const reducedCatalog = structuredClone(liveCatalog);
  reducedCatalog.products = reducedCatalog.products.filter((item) => !["open-play", "chanxu-tradingview"].includes(item.slug));
  await writeFile(path.join(storage, "catalog.json"), JSON.stringify(reducedCatalog));
  await page.goto(`${base}/dashboard`, { waitUntil: "networkidle0" });
  assert.equal(await page.$(chanxuCard), null);
  assert.equal(await page.$(authCard), null);
  check("Dashboard never invents missing products from the static seed catalog");
  for (const [slug, category, icon] of [["open-play", "desktop-apps", "/open-play/icon.png"], ["chanxu-tradingview", "trading-tools", "/chanxu-tradingview/icon-chanxu-v2.png"]]) {
    await page.goto(`${base}/admin/products/new?template=${slug}`, { waitUntil: "networkidle0" });
    assert.equal(await page.$eval('input[name="slug"]', (input) => input.value), slug);
    assert.equal(await page.$eval('input[name="category_slug"]', (input) => input.value), category);
    assert.equal(await page.$eval('input[name="icon_url"]', (input) => input.value), icon);
    assert.equal(await page.$eval('select[name="visibility"]', (select) => select.value), "draft");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  }
  await screenshot("new-product-chanxu-mobile.png");
  assert.equal((await catalog()).products.length, reducedCatalog.products.length, "opening templates must not insert or publish products");
  await writeFile(path.join(storage, "catalog.json"), JSON.stringify(liveCatalog));
  await page.setViewport({ width: 1440, height: 1000 });
  check("Chanxu and Auth templates stay separate, default to draft and do not mutate the catalog");


  await page.goto(`${base}/admin/releases`, { waitUntil: "networkidle0" });
  await page.$eval("details", (element) => { element.open = true; });
  await fillForm("details[open] form", { product_slug: product.slug, version: "1.0.0.1", channel: "stable", title_en: "Local verification", title_zh: "本地验证版本", notes_en: "Isolated test release", notes_zh: "仅在隔离本地目录发布" });
  await page.$eval("details[open] form", (form) => form.requestSubmit());
  await page.waitForFunction(() => location.search.includes("saved=1") && location.search.includes("release="));
  const releaseId = new URL(page.url()).searchParams.get("release");
  const detail = `#release-${releaseId}`;
  await page.waitForSelector(`${detail}[open]`);
  assert.equal(await page.$eval(`${detail} input[name="version"]`, (element) => element.readOnly), true);
  check("four-part draft creation opens the saved release and locks its identity");

  const fixtureBytes = Buffer.alloc(9 * 1024 * 1024, 0x5a);
  const fixture = path.join(temporary, "fixture-chrome.zip");
  await writeFile(fixture, fixtureBytes);
  const uploadForm = `${detail} form:has(input[type="file"])`;
  await fillForm(uploadForm, { platform: "chrome", architecture: "universal", package_kind: "zip" });
  await (await page.$(`${uploadForm} input[type="file"]`)).uploadFile(fixture);
  await page.$eval(uploadForm, (form) => form.requestSubmit());
  await page.waitForFunction(() => [...document.querySelectorAll('[role="status"]')].some((element) => element.textContent.includes("上传完成")));
  assert.deepEqual(uploadOffsets, [0, 8 * 1024 * 1024]);
  assert.equal(await page.$eval(`${uploadForm} input[type="file"]`, (element) => element.files.length), 0);
  const stored = (await catalog()).releases.find((item) => item.id === releaseId);
  assert.equal(stored.release_artifacts.length, 1);
  const artifact = stored.release_artifacts[0];
  assert.equal(artifact.size_bytes, fixtureBytes.length);
  assert.equal(artifact.sha512, createHash("sha512").update(fixtureBytes).digest("hex"));
  assert.equal((await fetch(`${base}${artifact.public_path}`)).status, 404);
  check("9 MiB browser upload uses 8 MiB chunks, verifies SHA-512 and resets safely");
  check("uploaded draft packages remain private");

  await page.waitForFunction((id) => [...(document.getElementById(`release-${id}`)?.querySelectorAll("button") ?? [])].some((button) => button.textContent === "校验并发布"), {}, releaseId);
  await page.$eval(detail, (element) => [...element.querySelectorAll("button")].find((button) => button.textContent === "校验并发布").click());
  await page.waitForFunction(() => location.search.includes("published=1"));
  assert.equal((await catalog()).releases.find((item) => item.id === releaseId).status, "published");
  check("generic browser-extension package publishes through the real administrator UI");
  await screenshot("releases-desktop.png");

  const download = await fetch(`${base}${artifact.public_path}`);
  assert.equal(download.status, 200);
  assert.equal(createHash("sha512").update(Buffer.from(await download.arrayBuffer())).digest("hex"), artifact.sha512);
  const range = await fetch(`${base}${artifact.public_path}`, { headers: { range: "bytes=8388608-8388671" } });
  assert.equal(range.status, 206);
  assert.equal((await range.arrayBuffer()).byteLength, 64);
  assert.equal(range.headers.get("content-range"), `bytes 8388608-8388671/${fixtureBytes.length}`);
  const head = await fetch(`${base}${artifact.public_path}`, { method: "HEAD", headers: { range: "bytes=0-1" } });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("content-length"), String(fixtureBytes.length));
  assert.equal((await fetch(`${base}/releases/${product.slug}/stable/latest.yml`)).status, 404);
  check("anonymous full download, Range 206, HEAD and generic-package manifest behavior");

  await page.setViewport({ width: 390, height: 844 });
  await page.goto(`${base}/admin/releases?release=${releaseId}`, { waitUntil: "networkidle0" });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "mobile admin has no horizontal overflow");
  await screenshot("releases-mobile.png");
  await page.goto(`${base}/zh/products/${product.slug}`, { waitUntil: "networkidle0" });
  await page.waitForSelector(`a[href="${artifact.public_path}"]`);
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "mobile storefront has no horizontal overflow");
  await screenshot("product-download-mobile.png");
  await page.goto(`${base}/zh/products/${product.slug}/releases`, { waitUntil: "networkidle0" });
  await page.waitForSelector(`a[href="${artifact.public_path}"]`);
  assert.deepEqual(runtimeErrors, []);
  check("mobile admin, product page and release history show working downloads without runtime errors");
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error.stack;
  if (page) await screenshot("failure.png").catch(() => {});
  process.exitCode = 1;
} finally {
  await browser?.close().catch(() => {});
  server.kill("SIGTERM");
  await new Promise((resolve) => { if (server.exitCode !== null) resolve(); else { server.once("exit", resolve); setTimeout(resolve, 3000).unref(); } });
  await rm(temporary, { recursive: true, force: true });
  await writeFile(path.join(output, "result.json"), `${JSON.stringify(report, null, 2)}\n`);
  if (report.status === "failed") await writeFile(path.join(output, "server.log"), serverLog);
  console.log(JSON.stringify({ ...report, output }, null, 2));
}
