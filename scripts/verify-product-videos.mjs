// Real editor/preview/publication operations against an isolated local store.
// Player navigation is stubbed by default for deterministic UI assertions. --live-players
// additionally probes the actual providers; its results are never confused with the stubbed checks.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
import sharp from 'sharp';

const require = createRequire(import.meta.url), { encode } = require('next-auth/jwt');
const project = fileURLToPath(new URL('../', import.meta.url));
const root = await mkdtemp(path.join(os.tmpdir(), 'oaktech-video-ui-'));
const output = process.env.STORE_VERIFY_OUTPUT || await mkdtemp(path.join(os.tmpdir(), 'oaktech-video-results-'));
const storage = path.join(root, 'releases'); await mkdir(storage); await mkdir(output, { recursive: true });
const port = await new Promise((resolve, reject) => { const probe = net.createServer(); probe.once('error', reject); probe.listen(0, '127.0.0.1', () => { const p = probe.address().port; probe.close(() => resolve(p)); }); });
const base = `http://127.0.0.1:${port}`;
const subject = 'isolated-video-admin', issuer = 'http://127.0.0.1:9', secret = randomBytes(32).toString('hex');
const env = { ...process.env, NODE_ENV: 'production', RELEASE_STORAGE_ROOT: storage, CASDOOR_AUTH_ENABLED: 'true', CASDOOR_ISSUER: issuer, CASDOOR_CLIENT_ID: 'test-only', NEXTAUTH_URL: base, NEXTAUTH_SECRET: secret, BASE_URL: base, OAKTECH_ADMIN_SUBJECTS: subject, OAKTECH_ADMIN_EMAILS: '', OAKTECH_ADMIN_USER_IDS: '' };
const report = { version: require('../package.json').version, checks: [], screenshots: [], livePlayers: [], playerNetworkMode: 'deterministic isolated iframe responses except separately recorded live probes', productionWrites: false, loginScope: 'synthetic session accepted only by isolated local server' };
let server, browser, page, visitor, log = '';
const slug = 'video-demo', catalogFile = path.join(storage, 'catalog.json');
const existing = { id: 'isolated-product', slug, category_slug: 'desktop-apps', status: 'beta', visibility: 'published', name_zh: '视频演示商品', name_en: 'Video demo', tagline_zh: '已公开的原始简介', tagline_en: 'Original introduction', description_zh: '原有公开详情', description_en: 'Original description', icon_url: '/gitfinder-2/icon.png', hero_image_url: '/gitfinder-2/hero.svg', supported_platforms: ['macOS'], featured: false };
const initial = { schemaVersion: 1, updatedAt: new Date().toISOString(), products: [existing], releases: [] };
const readCatalog = async () => JSON.parse(await readFile(catalogFile, 'utf8'));
const pass = text => { report.checks.push(text); console.log('PASS ' + text); };
async function start() {
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], { cwd: project, env, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', b => { log = (log + b.toString()).slice(-20000); });
  for (let i = 0; i < 140; i++) { if (server.exitCode !== null) throw new Error('Local server exited'); if ((await fetch(base + '/api/health').catch(() => null))?.ok) return; await new Promise(resolve => setTimeout(resolve, 200)); }
  throw new Error('Local server timeout');
}
async function stop() { if (!server || server.exitCode !== null) return; const child = server; await new Promise(resolve => { const t = setTimeout(() => child.kill('SIGKILL'), 8000); child.once('exit', () => { clearTimeout(t); resolve(); }); child.kill('SIGTERM'); }); }
async function input(selector, value) {
  await page.$eval(selector, (element, value) => { const p = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(p, 'value').set.call(element, value); element.dispatchEvent(new Event('input', { bubbles: true })); }, value);
}
async function status(text) { await page.waitForFunction(text => Array.from(document.querySelectorAll('[role="status"]')).some(node => node.textContent.includes(text)), {}, text); }
async function save() { await page.click('[data-testid="save-product-draft"]'); await status('草稿已保存'); await page.waitForFunction(() => !document.querySelector('[data-testid="save-product-draft"]').disabled); }
async function publish() { await page.click('[data-tab="preview"]'); await page.click('[data-testid="confirm-product-publication"]'); await page.click('[data-testid="publish-product"]'); await status('已发布'); }
async function shot(name, target = page) { const file = path.join(output, name); await target.screenshot({ path: file, fullPage: true }); report.screenshots.push(file); }
const players = ['www.youtube-nocookie.com', 'player.bilibili.com'];
const requests = [];
async function intercept(target) {
  await target.setRequestInterception(true);
  target.on('request', request => {
    const url = new URL(request.url());
    if (url.origin === base || /^(data|blob):/.test(url.protocol)) return request.continue();
    requests.push({ host: url.hostname, type: request.resourceType() });
    if (players.includes(url.hostname) && request.resourceType() === 'document') return request.respond({ status: 200, contentType: 'text/html', body: '<!doctype html><title>Isolated player-navigation fixture</title><p>External media intentionally not fetched in deterministic test.</p>' });
    return request.abort();
  });
}
try {
  await writeFile(catalogFile, JSON.stringify(initial)); await start();
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await puppeteer.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}) });
  page = await browser.newPage(); page.setDefaultTimeout(25000); await page.setViewport({ width: 1440, height: 1050 });
  const errors = []; page.on('pageerror', error => errors.push(error.message)); page.on('dialog', dialog => dialog.accept()); await intercept(page);
  assert.match(await (await fetch(base + `/admin/products/${slug}`)).text(), /admin-access-notice/);
  await page.goto(base + `/admin/products/${slug}`, { waitUntil: 'networkidle0' });
  assert.equal(await page.$('[data-testid="product-video-editor"]'), null);
  const token = await encode({ secret, token: { sub: subject, casdoorSubject: subject, casdoorIssuer: issuer }, maxAge: 3600 });
  await page.setCookie({ name: 'next-auth.session-token', value: token, domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' });
  await page.goto(base + `/admin/products/${slug}`, { waitUntil: 'networkidle0' });
  assert.equal((await page.$$('[role="tablist"] [role="tab"]')).length, 3);
  await page.waitForSelector('[data-testid="product-video-editor"]');
  pass('anonymous users have no editor; administrators get merged product information and three working tabs');

  await page.click('[data-testid="add-product-video"]');
  await input('[data-video-title]', '产品功能演示');
  await input('[data-video-url]', 'https://youtu.be/M7lc1UVf-VE?t=4&si=tracking');
  await page.waitForFunction(() => document.querySelector('[data-video-detection]').textContent.includes('可在商品页内播放'));
  await page.click('[data-add-video-source]');
  await input('[data-edit-source]:nth-child(2) [data-video-url]', 'https://www.bilibili.com/video/BV1B7411m7LV/?p=1');
  await page.click('[data-add-video-source]');
  await input('[data-edit-source]:nth-child(3) [data-video-url]', 'https://vimeo.com/76979871');
  await input('[data-edit-source]:nth-child(3) [data-video-label]', '其他平台');
  const png = path.join(root, 'video-cover.png');
  await sharp({ create: { width: 960, height: 540, channels: 3, background: '#215f50' } }).png().toFile(png);
  await (await page.$('[data-video-poster-upload]')).uploadFile(png); await status('图片已上传');
  await page.waitForSelector('[data-video-poster-preview]');
  const poster = await page.$eval('[data-video-poster-preview]', node => new URL(node.src).pathname);
  await save();
  let state = await readCatalog();
  const video = state.productDrafts[slug].product.videos[0];
  assert.equal(video.sources.length, 3); assert.equal(state.products[0].videos, undefined); assert.equal(video.poster_url, poster);
  assert.equal((await fetch(base + poster)).status, 404);
  assert.deepEqual(state.releases, initial.releases);
  pass('real video links and local poster upload save to a private draft without changing live text or releases');
  await shot('video-editor-desktop.png');

  const thirdPartyBefore = requests.length;
  await page.click('[data-tab="preview"]');
  if (!(await page.$eval('[data-testid="preview-disclosure"]', el => el.open))) await page.click('[data-testid="preview-disclosure"] > summary');
  await page.waitForSelector('[data-testid="product-preview"] [data-video-load]');
  assert.equal((await page.$$('iframe')).length, 0);
  assert.equal(requests.length, thirdPartyBefore, 'preview must not contact video providers before a click');
  await shot('video-preview-desktop.png');
  // The collapsed preview mounts its player lazily after the toggle event.
  await page.waitForSelector('[data-testid="product-preview"] [data-video-load]', { visible: true });
  await page.click('[data-testid="product-preview"] [data-video-load]');
  await page.waitForSelector('iframe[data-video-player="youtube"]');
  let props = await page.$eval('iframe[data-video-player]', node => ({ src: node.src, title: node.title, referrer: node.referrerPolicy, width: node.clientWidth, height: node.clientHeight }));
  assert.equal(new URL(props.src).host, 'www.youtube-nocookie.com'); assert.equal(new URL(props.src).searchParams.get('start'), '4');
  assert.equal(props.referrer, 'strict-origin-when-cross-origin'); assert.ok(props.width >= 200 && props.height >= 200);
  await page.click(`[data-video-source="${video.sources[1].id}"]`);
  assert.equal((await page.$$('iframe')).length, 0, 'changing source removes the previous player');
  // The collapsed preview mounts its player lazily after the toggle event.
  await page.waitForSelector('[data-testid="product-preview"] [data-video-load]', { visible: true });
  await page.click('[data-testid="product-preview"] [data-video-load]');
  await page.waitForSelector('iframe[data-video-player="bilibili"]');
  assert.equal(new URL(await page.$eval('iframe[data-video-player]', node => node.src)).host, 'player.bilibili.com');
  await page.click(`[data-video-source="${video.sources[2].id}"]`);
  assert.equal((await page.$$('iframe')).length, 0);
  assert.equal(await page.$eval(`[data-video-external="${video.sources[2].id}"]`, node => node.target), '_blank');
  await page.click('[data-tab="details"]'); assert.equal((await page.$$('iframe')).length, 0);
  pass('in-page players load only on click, switch sources safely, stop on tab exit, and unknown platforms stay external');

  await page.click('[data-testid="add-product-video"]');
  const nodes = await page.$$('[data-edit-video]'); const secondId = await nodes[1].evaluate(node => node.dataset.editVideo);
  await input(`[data-edit-video="${secondId}"] [data-video-title]`, '安装教程');
  await input(`[data-edit-video="${secondId}"] [data-video-url]`, 'https://youtube.com/shorts/M7lc1UVf-VE');
  await page.click('[aria-label="视频2前移"]'); await save();
  state = await readCatalog(); assert.equal(state.productDrafts[slug].product.videos[0].title, '安装教程');
  await page.goto(base + `/admin/products/${slug}`, { waitUntil: 'networkidle0' });
  assert.equal(await page.$eval('[data-video-title]', node => node.value), '安装教程');
  await page.click('[aria-label="移除视频1"]'); await save();
  await publish();
  state = await readCatalog(); assert.equal(state.products[0].videos.length, 1); assert.equal(state.productDrafts?.[slug], undefined);
  assert.deepEqual(state.releases, initial.releases);
  assert.equal((await fetch(base + poster)).status, 200);
  pass('multi-video ordering survives reload; explicit publication makes the introduction and poster public without new releases');

  const publicContext = await browser.createBrowserContext(); visitor = await publicContext.newPage(); visitor.setDefaultTimeout(25000); await intercept(visitor);
  const count = requests.length;
  await visitor.setViewport({ width: 390, height: 844 });
  await visitor.goto(base + `/zh/products/${slug}`, { waitUntil: 'networkidle0' });
  await visitor.waitForSelector('[data-video-load]');
  assert.equal((await visitor.$$('iframe')).length, 0); assert.equal(requests.length, count);
  assert.ok(await visitor.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await shot('video-public-mobile.png', visitor);
  await visitor.click('[data-video-load]'); await visitor.waitForSelector('iframe[data-video-player="youtube"]');
  const dimensions = await visitor.$eval('iframe', node => ({ width: node.clientWidth, height: node.clientHeight }));
  assert.ok(dimensions.width >= 200 && dimensions.height >= 200);
  await page.click('[data-tab="details"]'); await input('[data-video-title]', '尚未公开的新标题'); await save();
  await visitor.reload({ waitUntil: 'networkidle0' });
  assert.ok((await visitor.$eval('[data-testid="product-video-introductions"]', node => node.textContent)).includes('产品功能演示'));
  assert.ok(!(await visitor.$eval('[data-testid="product-video-introductions"]', node => node.textContent)).includes('尚未公开的新标题'));
  pass('anonymous mobile storefront displays the published video only; later saved edits do not leak');

  await page.click('[data-tab="preview"]');
  if (!(await page.$eval('[data-testid="preview-disclosure"]', el => el.open))) await page.click('[data-testid="preview-disclosure"] > summary');
  // The collapsed preview mounts its player lazily after the toggle event.
  await page.waitForSelector('[data-testid="product-preview"] [data-video-load]', { visible: true });
  await page.click('[data-testid="product-preview"] [data-video-load]');
  await page.click('[data-tab="details"]'); assert.equal((await page.$$('iframe')).length, 0);
  await page.click('[aria-label="移除视频1"]'); await save();
  await visitor.reload({ waitUntil: 'networkidle0' }); assert.ok(await visitor.$('[data-testid="product-video-introductions"]'));
  await publish(); await visitor.reload({ waitUntil: 'networkidle0' }); assert.equal(await visitor.$('[data-testid="product-video-introductions"]'), null);
  assert.equal((await fetch(base + poster)).status, 404);
  // Restore the already validated public fixture only in this temporary store to test restart and live players.
  state = await readCatalog(); state.products[0].videos = [video]; await writeFile(catalogFile, JSON.stringify(state));
  await stop(); await start();
  await visitor.goto(base + `/en/products/${slug}`, { waitUntil: 'networkidle0' });
  await visitor.waitForSelector('[data-video-load]'); assert.equal((await fetch(base + poster)).status, 200);
  assert.deepEqual(errors, []);
  pass('removal remains draft-only until confirmed; service restart retains published video data and its image');

  if (process.argv.includes('--live-players')) {
    const live = await publicContext.newPage(); live.setDefaultTimeout(20000);
    await live.setViewport({ width: 1280, height: 900 });
    for (const source of video.sources.slice(0, 2)) {
      const result = { provider: source.id === video.sources[0].id ? 'youtube' : 'bilibili', iframeRequested: false, playerDocumentLoaded: false, playbackObserved: false };
      try {
        await live.goto(base + `/zh/products/${slug}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
        if (source.id !== video.sources[0].id) await live.click(`[data-video-source="${source.id}"]`);
        await live.click('[data-video-load]'); await live.waitForSelector('iframe'); result.iframeRequested = true;
        const handle = await live.$('iframe'); const frame = await handle.contentFrame();
        await frame.waitForSelector('body', { timeout: 20000 });
        result.playerDocumentLoaded = players.includes(new URL(frame.url()).hostname);
        const button = result.provider === 'youtube' ? '.ytmCuedOverlayPlayButton, .ytp-large-play-button, button[aria-label="播放视频"], button[aria-label="Play video"]' : '.bpx-player-ctrl-play';
        await frame.waitForSelector(button, { timeout: 18000 });
        result.playControlFound = true;
        await handle.scrollIntoView();
        await frame.click(button); result.playClicked = true;
        const playerUrl = new URL(await handle.evaluate(node => node.src));
        const expectedStart = Number(playerUrl.searchParams.get('start') || playerUrl.searchParams.get('t') || 0);
        // Seeking to an initial offset or clearing paused alone is not proof of decoded playback.
        await frame.waitForFunction(start => Array.from(document.querySelectorAll('video')).some(v => v.currentTime > start + 0.25 && v.readyState >= 2 && !v.paused), { timeout: 20000 }, expectedStart);
        result.playbackObserved = true;
      } catch (error) { result.limitation = error.name === 'TimeoutError' ? 'Provider document or video playback did not become ready within the test window; no all-network playback claim.' : error.message.slice(0, 180); }
      const observedFrame = live.frames().find(f => { try { return players.includes(new URL(f.url()).hostname); } catch { return false; } });
      if (observedFrame) result.mediaState = await observedFrame.evaluate(() => ({ videos: Array.from(document.querySelectorAll('video')).map(v => ({ paused: v.paused, readyState: v.readyState, currentTime: v.currentTime, error: v.error?.code ?? null })), errorText: document.querySelector('.ytp-error-content-wrap, .bpx-player-error')?.textContent?.trim().slice(0, 220) || null })).catch(() => null);
      report.livePlayers.push(result); await shot(`live-${result.provider}.png`, live);
      console.log('LIVE ' + JSON.stringify(result));
    }
    await live.close();
  }
  report.status = 'passed';
} catch (error) {
  report.status = 'failed'; report.error = error.stack; process.exitCode = 1;
  if (page) await shot('failure.png').catch(() => {});
} finally {
  await browser?.close().catch(() => {}); await stop(); await rm(root, { recursive: true, force: true });
  await writeFile(path.join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n');
  if (report.status === 'failed') await writeFile(path.join(output, 'server.log'), log);
  console.log(JSON.stringify({ ...report, output }, null, 2));
}
