// UI verification for the user's empty-video-title scenario. Disposable local data only.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import puppeteer from 'puppeteer';
import sharp from 'sharp';
const require = createRequire(import.meta.url), { encode } = require('next-auth/jwt');
const root = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(path.join(os.tmpdir(), 'oaktech-editor-layout-'));
const storage = path.join(temp, 'releases'); await mkdir(storage);
const output = process.env.STORE_VERIFY_OUTPUT || path.join(root, '.local-verification/product-layout/browser'); await mkdir(output, { recursive: true });
const port = await new Promise((resolve, reject) => { const s = net.createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const base = `http://127.0.0.1:${port}`, secret = randomBytes(32).toString('hex'), issuer = 'http://127.0.0.1:9', subject = 'isolated-layout-admin';
const env = { ...process.env, NODE_ENV: 'production', RELEASE_STORAGE_ROOT: storage, CASDOOR_AUTH_ENABLED: 'true', CASDOOR_ISSUER: issuer, CASDOOR_CLIENT_ID: 'isolated-layout', NEXTAUTH_URL: base, NEXTAUTH_SECRET: secret, OAKTECH_ADMIN_SUBJECTS: subject, OAKTECH_ADMIN_USER_IDS: '', OAKTECH_ADMIN_EMAILS: '', OAKTECH_RELEASE_WRITE_TOKEN: randomBytes(32).toString('hex'), BASE_URL: base };
const original = { id: 'layout-open-play', slug: 'open-play', category_slug: 'productivity-tools', status: 'released', visibility: 'published', name_zh: 'OpenPlay（隔离测试）', name_en: 'OpenPlay test', tagline_zh: '这是测试服务，不是真实商品', tagline_en: 'Isolated test server', description_zh: '原来公开的说明', description_en: 'Independent English copy', icon_url: '/open-play/icon.png', hero_image_url: '/open-play/icon.png', gallery_urls: [], videos: [], supported_platforms: ['macOS', 'Windows'], featured: false };
const video = { id: 'video-screenshot', title: '', poster_url: '', sources: [{ id: 'source-bili', label: '', url: 'https://www.bilibili.com/video/BV1wGYy6UEDW/' }] };
const draft = { ...original, description_zh: '新写的中文介绍，尚未公开。', videos: [video] };
await writeFile(path.join(storage, 'catalog.json'), JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(), products: [original], productDrafts: { 'open-play': { product: draft, revision: 1, updatedAt: new Date().toISOString() } }, releases: [] }));
const report = { version: require('../package.json').version, checks: [], screenshots: [], layout: [], productionWrites: false, scope: 'Loopback server; disposable OpenPlay fixtures; synthetic local session; third-party players blocked.' };
let server, browser, page, logs = ''; const errors = [];
const request = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
const data = async () => JSON.parse(await readFile(path.join(storage, 'catalog.json'), 'utf8'));
const pass = text => { report.checks.push(text); console.log('PASS ' + text); };
const shot = async name => { await page.screenshot({ path: path.join(output, name + '.png'), fullPage: true }); report.screenshots.push(name + '.png'); };
const click = selector => page.locator(selector).click();
async function fill(selector, value) { await page.$eval(selector, (el, text) => { const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, text); el.dispatchEvent(new Event('input', { bubbles: true })); }, value); }
async function waitStatus(text) { await page.waitForFunction(t => [...document.querySelectorAll('[role="status"]')].some(el => el.textContent.includes(t)), {}, text); }
async function tab(name) { await click(`[data-tab="${name}"]`); await page.waitForSelector(`#panel-${name}`, { visible: true }); }
try {
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', b => logs = (logs + b.toString()).slice(-20000));
  let ready = false; for (let i = 0; i < 120; i++) { if (server.exitCode !== null) throw new Error(logs); if ((await request(base + '/api/health').catch(() => null))?.ok) { ready = true; break; } await new Promise(r => setTimeout(r, 200)); } assert.ok(ready);
  assert.match(await (await request(base + '/admin/products/open-play')).text(), /admin-access-notice/);
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await puppeteer.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}), args: ['--disable-background-networking'] });
  page = await browser.newPage(); page.setDefaultTimeout(25000); page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  await page.setExtraHTTPHeaders({ 'accept-language': 'zh-CN,zh;q=0.9' });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.setRequestInterception(true); page.on('request', r => r.url().startsWith(base) || /^(data:|blob:)/.test(r.url()) ? r.continue() : r.abort());
  await browser.setCookie({ name: 'next-auth.session-token', value: await encode({ secret, token: { sub: subject, casdoorSubject: subject, casdoorIssuer: issuer }, maxAge: 3600 }), domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' });
  await page.setViewport({ width: 1440, height: 960 }); await page.goto(base + '/admin/products/open-play', { waitUntil: 'domcontentloaded' }); await page.waitForSelector('[data-testid="product-details-layout"]');
  assert.equal(await page.$eval('[data-video-title]', el => el.value), '');
  assert.notEqual(await page.$eval('[data-video-title]', el => el.getAttribute('aria-invalid')), 'true');
  assert.match(await page.$eval('[data-video-title-help]', el => el.textContent), /留空不影响发布/);
  assert.match(await page.$eval('[data-testid="product-state-line"]', el => el.textContent), /线上介绍：已公开.*草稿已保存，待发布/);
  const editorOrder = await page.evaluate(() => {
    const video = document.querySelector('[data-testid="product-video-editor"]');
    const description = document.querySelector('[data-testid="product-description-panel"]');
    const footer = document.querySelector('[data-testid="product-details-footer"]');
    const follows = (first, second) => Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
    return {
      chineseDescriptionInTopPanel: Boolean(document.querySelector('[data-testid="product-copy-panel"] textarea[name="description_zh"]')),
      englishDescriptionInTopPanel: Boolean(document.querySelector('[data-testid="product-english-fields"] textarea[name="description_en"]')),
      videoBeforeDescription: follows(video, description),
      descriptionBeforeFooter: follows(description, footer),
      descriptionTop: description.getBoundingClientRect().top + scrollY,
      videoBottom: video.getBoundingClientRect().bottom + scrollY,
    };
  });
  assert.equal(editorOrder.chineseDescriptionInTopPanel, false); assert.equal(editorOrder.englishDescriptionInTopPanel, false);
  assert.equal(editorOrder.videoBeforeDescription, true); assert.equal(editorOrder.descriptionBeforeFooter, true); assert.ok(editorOrder.descriptionTop >= editorOrder.videoBottom - 1);
  pass('detailed Chinese and English descriptions are edited after screenshots/video and immediately before publication actions');
  assert.doesNotMatch(await (await request(base + '/zh/products/open-play')).text(), /video-screenshot|新写的中文介绍/);
  pass('the actual screenshot condition is explicit: valid link plus optional empty title is a saved draft, not published content');
  for (const width of [1440, 1024, 390, 320]) {
    await page.setViewport({ width, height: 960 });
    const metrics = await page.evaluate(() => { const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top: r.top + scrollY, left: r.left, width: r.width, bottom: r.bottom + scrollY }; }; return { width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth + 1, copy: rect('[data-testid="product-copy-panel"]'), media: rect('[data-testid="product-media-panel"]'), details: rect('[data-testid="product-details-layout"]'), inputFontSize: getComputedStyle(document.querySelector('input[name="name_zh"]')).fontSize }; });
    assert.equal(metrics.overflow, false); assert.ok(parseFloat(metrics.inputFontSize) >= 14);
    if (width >= 1024) { assert.ok(Math.abs(metrics.copy.top - metrics.media.top) < 2); assert.ok(metrics.media.left > metrics.copy.left); } else assert.ok(metrics.media.top >= metrics.copy.bottom - 1);
    report.layout.push(metrics); await shot('editor-' + width);
  }
  pass('desktop uses two clear columns, phone stacks them, readable fields and 320/390/1024/1440px layouts have no horizontal overflow');
  await page.setViewport({ width: 1440, height: 960 }); await page.$eval('[data-prepare-product-footer]', el => el.scrollIntoView({ block: 'center' }));
  assert.ok(await page.$eval('[data-testid="product-action-bar"]', el => { const r = el.getBoundingClientRect(); return r.top >= 55 && r.bottom < innerHeight; }));
  await click('[data-prepare-product-footer]'); await page.waitForSelector('[data-publication-scope="product"]', { visible: true });
  assert.equal(await page.$eval('[data-testid="publish-product"]', el => el.disabled), false);
  assert.equal(await page.$('[data-testid="confirm-product-publication"]'), null, 'product publication has no redundant checkbox');
  assert.equal(await page.$('[data-testid="product-publication-issues"]'), null);
  assert.equal((await data()).releases.length, 0);
  pass('persistent actions lead to product confirmation without requiring a video title');
  await tab('details');
  await fill('[data-video-title]', 'OpenPlay 功能演示'); await fill('textarea[name="description_zh"]', '新的完整商品介绍与视频说明。');
  await click('[data-testid="prepare-product-publication"]'); await waitStatus('草稿已保存');
  await page.waitForFunction(() => !document.querySelector('[data-testid="publish-product"]').disabled);
  assert.match(await page.$eval('[data-testid="publication-video-count"]', el => el.textContent), /线上 0 段 → 本次 1 段/);
  assert.equal((await data()).productDrafts['open-play'].product.videos[0].title, 'OpenPlay 功能演示');
  assert.doesNotMatch(await (await request(base + '/zh/products/open-play')).text(), /新的完整商品介绍/);
  await click('[data-testid="publish-product"]'); await page.waitForSelector('[data-testid="product-publication-success"]');
  const saved = await data(); assert.equal(saved.products[0].description_zh, '新的完整商品介绍与视频说明。'); assert.equal(saved.products[0].videos.length, 1); assert.equal(saved.releases.length, 0); assert.equal(saved.productDrafts?.['open-play'], undefined);
  const html = await (await request(base + '/zh/products/open-play')).text(); assert.match(html, /新的完整商品介绍与视频说明/); assert.match(html, /data-video-id="video-screenshot"/); assert.match(html, /data-video-autoload="true"/); assert.doesNotMatch(html, /data-video-load=/);
  assert.match(await (await request(base + '/en/products/open-play')).text(), /data-video-id="video-screenshot"/);
  pass('filling the title and explicitly confirming publishes the introduction and shared video without creating or publishing any software');
  await tab('details'); await fill('textarea[name="description_zh"]', '仅预览，不保存。'); const beforePreview = await data(); await click('[data-preview-product]'); await page.waitForSelector('[data-testid="product-preview"] .product-detail-grid', { visible: true }); assert.deepEqual(await data(), beforePreview); await tab('details'); assert.equal(await page.$eval('textarea[name="description_zh"]', el => el.value), '仅预览，不保存。');
  pass('pure preview and tab switches retain unsaved inputs and do not write or publish them');
  const poster = path.join(temp, 'test-image.png'); await sharp({ create: { width: 480, height: 270, channels: 3, background: { r: 65, g: 95, b: 130 } } }).png().toFile(poster);
  await (await page.$('[data-upload="gallery_urls"]')).uploadFile(poster); await waitStatus('图片已上传'); await page.waitForFunction(() => !document.querySelector('[data-testid="save-product-draft"]').disabled);
  await (await page.$('[data-video-poster-upload]')).uploadFile(poster); await waitStatus('图片已上传'); await page.waitForSelector('[data-video-poster-preview]');
  await click('[data-add-video-source]'); const links = await page.$$('[data-video-url]'); assert.equal(links.length, 2); await links[1].evaluate(el => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, 'https://www.youtube.com/watch?v=jNQXAC9IVRw'); el.dispatchEvent(new Event('input', { bubbles: true })); });
  await click('[data-save-product-footer]'); await waitStatus('草稿已保存');
  const later = await data(); assert.equal(later.products[0].gallery_urls.length, 0); assert.equal(later.productDrafts['open-play'].product.gallery_urls.length, 1); assert.equal(later.productDrafts['open-play'].product.videos[0].sources.length, 2);
  for (const width of [1440, 390, 320]) { await page.setViewport({ width, height: 960 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await shot('editor-with-media-' + width); }
  assert.deepEqual(errors, []);
  pass('compact image uploads and additional video sources still save only to drafts; populated phone layout remains usable');
  report.status = 'passed';
} catch (error) { report.status = 'failed'; report.error = error.stack; process.exitCode = 1; if (page) await shot('failure').catch(() => {}); }
finally {
  await browser?.close().catch(() => {});
  if (server && server.exitCode === null) await new Promise(resolve => { const t = setTimeout(() => server.kill('SIGKILL'), 8000); server.once('exit', () => { clearTimeout(t); resolve(); }); server.kill('SIGTERM'); });
  await rm(temp, { recursive: true, force: true }); report.pageErrors = errors;
  await writeFile(path.join(output, 'result.json'), JSON.stringify(report, null, 2)); if (report.status !== 'passed') await writeFile(path.join(output, 'server.log'), logs);
  process.stdout.write(JSON.stringify({ ...report, output }, null, 2) + '\n', () => process.exit(report.status === 'passed' ? 0 : 1));
}
