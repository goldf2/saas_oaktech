// Real Chromium + HTTP against disposable loopback fixtures. Never writes production data.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer';
const require = createRequire(import.meta.url), { encode } = require('next-auth/jwt');
const root = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(path.join(os.tmpdir(), 'oaktech-links-ui-'));
const storage = path.join(temp, 'releases');
const output = path.resolve(process.env.LINK_VERIFY_OUTPUT || path.join(root, '.local-verification/download-links/browser'));
await mkdir(storage); await mkdir(output, { recursive: true });
const port = await new Promise((resolve, reject) => { const s = net.createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const base = `http://127.0.0.1:${port}`, secret = randomBytes(32).toString('hex'), issuer = 'http://127.0.0.1:9', subject = 'link-test-admin';
const env = { ...process.env, NODE_ENV: 'production', RELEASE_STORAGE_ROOT: storage, CASDOOR_AUTH_ENABLED: 'true', CASDOOR_ISSUER: issuer, CASDOOR_CLIENT_ID: 'isolated', NEXTAUTH_URL: base, NEXTAUTH_SECRET: secret, BASE_URL: base, OAKTECH_ADMIN_SUBJECTS: subject, OAKTECH_ADMIN_USER_IDS: '', OAKTECH_ADMIN_EMAILS: '' };
const github = 'https://github.com/goldf2/open-play-releases/releases';
const replacement = 'https://github.com/goldf2/GitFinder/releases';
const product = (slug, extra = {}) => ({ id: slug, slug, category_slug: 'utility-tools', status: 'released', visibility: 'published', name_zh: `链接测试 · ${slug}`, name_en: `Link fixture · ${slug}`, tagline_zh: '仅用于隔离回归验证', tagline_en: 'Isolated regression fixture only', description_zh: '测试本站安装包与GitHub来源的独立展示。', description_en: 'Tests separate store packages and GitHub links.', icon_url: '/gitfinder-2/icon.png', hero_image_url: '/gitfinder-2/hero.svg', gallery_urls: [], videos: [], supported_platforms: ['macOS', 'Windows'], featured: false, ...extra });
const release = (id, version, status, current) => ({ id, product_slug: 'local-app', version, status, is_current: current, channel: 'stable', published_at: status === 'published' ? `2026-01-0${version[0]}T00:00:00Z` : null, title_zh: `版本${version}`, title_en: `Version ${version}`, notes_zh: '隔离测试更新', notes_en: 'Isolated test update', release_artifacts: [] });
const old = release('local-v1', '1.0.0', 'published', false);
const metadata = release('local-v2', '2.0.0', 'published', true);
const draft = release('local-v3', '3.0.0', 'draft', true);
const bytes = new Map();
async function artifact(r, name, kind, platform, body) {
  const relative = `local-app/stable/${r.version}/${name}`, content = Buffer.from(body);
  await mkdir(path.dirname(path.join(storage, relative)), { recursive: true }); await writeFile(path.join(storage, relative), content);
  const publicPath = `/releases/${relative}`; bytes.set(publicPath, content);
  r.release_artifacts.push({ id: name, release_id: r.id, platform, architecture: platform === 'Windows' ? 'x64' : 'arm64', package_kind: kind, file_name: name, storage_path: relative, public_path: publicPath, size_bytes: content.length, sha512: createHash('sha512').update(content).digest('hex'), content_type: kind === 'manifest' ? 'application/json' : 'application/zip' });
}
await artifact(old, 'installer-mac.zip', 'zip', 'macOS', 'isolated macOS fixture bytes, not an actual installer');
await artifact(old, 'installer-windows.zip', 'zip', 'Windows', 'isolated Windows fixture bytes, not an actual installer');
await artifact(metadata, 'updates.json', 'manifest', 'universal', '{}');
await artifact(draft, 'PRIVATE-DRAFT.zip', 'zip', 'macOS', 'private test fixture');
const file = path.join(storage, 'catalog.json');
await writeFile(file, JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(), products: [product('local-app', { github_url: github }), product('open-play'), product('no-sources'), product('private-app', { visibility: 'draft' })], releases: [draft, metadata, old] }));
const catalog = async () => JSON.parse(await readFile(file, 'utf8'));
const request = (url, init = {}) => fetch(url, { ...init, signal: AbortSignal.timeout(15000), headers: { 'accept-language': 'zh-CN', ...init.headers } });
const report = { version: require('../package.json').version, checks: [], screenshots: [], productionWrites: false, scope: 'Disposable loopback catalog and synthetic test-only login; fixture bytes are not real software packages.' };
let server, browser, page, logs = ''; const errors = [];
const pass = title => { report.checks.push(title); console.log('PASS ' + title); };
async function goto(route) { report.stage = route; await page.goto(base + route, { waitUntil: 'domcontentloaded' }); await page.waitForSelector('main h1', { visible: true }); await page.waitForFunction(() => document.readyState === 'complete'); }
async function click(selector) { await page.waitForSelector(selector, { visible: true }); await page.locator(selector).click(); }
async function fill(selector, value) { await page.$eval(selector, (e, v) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(e, v); e.dispatchEvent(new Event('input', { bubbles: true })); }, value); }
async function save() { await click('[data-testid="save-product-draft"]'); await page.waitForFunction(() => [...document.querySelectorAll('[role="status"]')].some(e => e.textContent.includes('草稿已保存'))); await page.waitForFunction(() => !document.querySelector('[data-testid="save-product-draft"]').disabled); }
async function publish() { await click('[data-testid="prepare-product-publication"]'); await page.waitForSelector('[data-testid="publish-product"]', { visible: true }); await click('[data-testid="publish-product"]'); await page.waitForSelector('[data-testid="product-publication-success"]'); }
try {
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', b => { logs = (logs + b).slice(-30000); });
  let ready = false;
  for (let i = 0; i < 100; i++) { if (server.exitCode !== null) throw new Error(logs); if ((await request(base + '/api/health').catch(() => null))?.ok) { ready = true; break; } await new Promise(r => setTimeout(r, 200)); }
  assert.ok(ready, 'isolated server must start');
  const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser = await puppeteer.launch({ headless: true, ...(existsSync(chrome) ? { executablePath: chrome } : {}), args: ['--disable-background-networking'] });
  page = await browser.newPage(); page.setDefaultTimeout(30000); page.on('dialog', d => d.accept()); await page.setExtraHTTPHeaders({ 'accept-language': 'zh-CN' });
  page.on('pageerror', e => errors.push({ url: page.url(), message: e.message }));
  await page.setRequestInterception(true); page.on('request', r => { const u = new URL(r.url()); return u.origin === base || ['data:', 'blob:'].includes(u.protocol) ? r.continue() : r.abort(); });
  for (const locale of ['zh', 'en']) for (const width of [1440, 390, 320]) {
    await page.setViewport({ width, height: 960 }); await goto(`/${locale}/products/local-app`);
    assert.equal((await page.$$('a.store-download-action')).length, 2);
    const links = await page.$$eval('a.store-download-action', nodes => nodes.map(e => e.getAttribute('href')));
    assert.deepEqual(links.sort(), old.release_artifacts.map(a => a.public_path).sort());
    assert.deepEqual((await page.$$eval('[data-testid="download-address"] input', nodes => nodes.map(e => e.value))).sort(), links.map(link => base + link).sort());
    assert.equal(await page.$eval('[data-testid="product-github-link"]', e => e.href), github);
    assert.match(await page.$eval('[data-testid="product-github-link"]', e => e.rel), /noopener/);
    assert.match(await page.$eval('#downloads', e => e.textContent), /1\.0\.0/);
    assert.doesNotMatch(await page.$eval('main', e => e.textContent), /PRIVATE-DRAFT|updates\.json/);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal overflow');
    await page.screenshot({ path: path.join(output, `${locale}-${width}.png`), fullPage: true }); report.screenshots.push(`${locale}-${width}.png`);
    pass(`${locale}/${width}: two real local hrefs, GitHub, older public installer fallback, no private/metadata download or overflow`);
  }
  await goto('/zh/products/local-app');
  await page.evaluate(() => { window.__copiedDownload = ''; Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__copiedDownload = value; } } }); });
  await click('[data-testid="download-address"] button');
  await page.waitForFunction(() => document.querySelector('[data-testid="download-address"] [role="status"]').textContent.includes('地址已复制'));
  assert.equal(await page.evaluate(() => window.__copiedDownload), base + old.release_artifacts[0].public_path);
  await page.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined }); });
  await click('[data-testid="download-address"] button');
  await page.waitForFunction(() => document.querySelector('[data-testid="download-address"] [role="status"]').textContent.includes('手动复制'));
  assert.ok(await page.$eval('[data-testid="download-address"] input', e => e.selectionStart === 0 && e.selectionEnd === e.value.length));
  pass('complete copyable store URLs, copy handler and clipboard-denied manual selection verified without changing the OS clipboard');
  for (const a of old.release_artifacts) {
    const response = await request(base + a.public_path); assert.equal(response.status, 200); assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes.get(a.public_path));
    assert.match(response.headers.get('content-disposition'), /attachment/);
    assert.equal((await request(base + a.public_path, { method: 'HEAD' })).status, 200);
    const partial = await request(base + a.public_path, { headers: { Range: 'bytes=0-6' } }); assert.equal(partial.status, 206); assert.deepEqual(Buffer.from(await partial.arrayBuffer()), bytes.get(a.public_path).subarray(0, 7));
  }
  assert.equal((await request(base + draft.release_artifacts[0].public_path)).status, 404);
  assert.equal((await request(base + '/zh/products/private-app')).status, 404);
  pass('download GET bytes, attachment, HEAD and Range verified; draft artifact and draft product remain 404');
  for (const locale of ['zh', 'en']) {
    await goto(`/${locale}/products/open-play`); assert.equal(await page.$('a.store-download-action'), null);
    assert.equal(await page.$eval('[data-testid="product-github-link"]', e => e.href), github);
    assert.match(await page.$eval('.app-get-unavailable', e => e.textContent), locale === 'zh' ? /本站暂无安装包/ : /No store installer/);
    await goto(`/${locale}/products/no-sources`); assert.equal(await page.$('[data-testid="product-github-link"]'), null); assert.equal(await page.$('a.store-download-action'), null);
    pass(`${locale}: GitHub-only and unconfigured products have truthful empty states, not fabricated links`);
  }
  await browser.setCookie({ name: 'next-auth.session-token', value: await encode({ secret, token: { sub: subject, casdoorSubject: subject, casdoorIssuer: issuer }, maxAge: 3600 }), domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' });
  await page.setViewport({ width: 1440, height: 960 }); await goto('/admin/products/local-app');
  assert.equal(await page.$eval('input[name="github_url"]', e => e.value), github);
  await fill('input[name="github_url"]', replacement); await save();
  let data = await catalog(); assert.equal(data.products[0].github_url, github); assert.equal(data.productDrafts['local-app'].product.github_url, replacement);
  await click('[data-preview-product]');
  if (!await page.$eval('[data-testid="preview-disclosure"]', e => e.open)) await click('[data-testid="preview-disclosure"] > summary');
  await page.waitForSelector('[data-testid="product-preview"] [data-testid="github-download-source"]'); assert.match(await page.$eval('[data-testid="product-preview"] [data-testid="github-download-source"]', e => e.textContent), /goldf2\/GitFinder\/releases/);
  assert.equal((await page.$$('[data-testid="product-preview"] a.store-download-action')).length, 0);
  assert.deepEqual(await catalog(), data); pass('editor saves a private GitHub draft; preview shows that URL without downloads or publication');
  const beforeReleases = data.releases; await publish(); data = await catalog(); assert.equal(data.products[0].github_url, replacement); assert.deepEqual(data.releases, beforeReleases);
  await goto('/zh/products/local-app'); assert.equal(await page.$eval('[data-testid="product-github-link"]', e => e.href), replacement);
  pass('explicit product publication updates the public link without changing software releases');
  await goto('/admin/products/local-app'); const beforeInvalid = await catalog();
  await fill('input[name="github_url"]', 'https://example.com/not-github'); await click('[data-testid="save-product-draft"]');
  await page.waitForFunction(() => [...document.querySelectorAll('[role="alert"]')].some(e => e.textContent.includes('GitHub'))); assert.deepEqual(await catalog(), beforeInvalid);
  pass('invalid GitHub host is rejected by the real editor and does not mutate the catalog');
  await goto('/admin/products/open-play'); await fill('input[name="github_url"]', ''); await save(); await publish();
  assert.equal((await catalog()).products.find(p => p.slug === 'open-play').github_url, '');
  await goto('/zh/products/open-play'); assert.equal(await page.$('[data-testid="product-github-link"]'), null);
  pass('clearing and publishing removes even a known-product default GitHub link');
  assert.deepEqual(errors, []); pass('no browser runtime or hydration errors'); report.ok = true;
} catch (error) { report.ok = false; report.error = error.stack; report.pageErrors = errors; if (page) { report.failedUrl = page.url(); report.failedPage = await page.$eval('main', e => e.innerText).catch(() => 'unavailable'); await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {}); } console.error(error); process.exitCode = 1; }
finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
  await writeFile(path.join(output, 'server.log'), logs);
  if (browser) await browser.close();
  if (server && server.exitCode === null) server.kill('SIGTERM');
  await rm(temp, { recursive: true, force: true });
}
