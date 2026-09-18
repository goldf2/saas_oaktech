// Real UI and existing server actions, with a local synthetic session and temporary catalog only.
// Optional OPEN_PLAY_RELEASE_FIXTURE_DIR points to four already public, signed website artifacts.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
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
const root = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(path.join(os.tmpdir(), 'oaktech-release-flow-')), storage = path.join(temp, 'releases');
const output = process.env.STORE_VERIFY_OUTPUT || path.join(root, '.local-verification/release-ui/browser');
await mkdir(storage, { recursive: true }); await mkdir(output, { recursive: true });
const port = await new Promise((resolve, reject) => { const s = net.createServer(); s.once('error', reject); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => resolve(p)); }); });
const base = `http://127.0.0.1:${port}`, secret = randomBytes(32).toString('hex'), subject = 'isolated-release-ui', issuer = 'http://127.0.0.1:9';
const env = { ...process.env, NODE_ENV: 'production', RELEASE_STORAGE_ROOT: storage, CASDOOR_AUTH_ENABLED: 'true', CASDOOR_ISSUER: issuer, CASDOOR_CLIENT_ID: 'ui-test', NEXTAUTH_URL: base, NEXTAUTH_SECRET: secret, OAKTECH_ADMIN_SUBJECTS: subject, OAKTECH_ADMIN_EMAILS: '', OAKTECH_ADMIN_USER_IDS: '', OAKTECH_RELEASE_WRITE_TOKEN: randomBytes(32).toString('hex'), BASE_URL: base };
const report = { version: require('../package.json').version, checks: [], screenshots: [], foreignRequests: [], scope: 'isolated browser/server only; synthetic test session; no production writes or real accounts' };
const fixture = (slug, name) => ({ id: slug, slug, category_slug: 'desktop-apps', status: 'released', visibility: 'published', name_zh: name, name_en: name, tagline_zh: '测试商品', tagline_en: 'Test product', description_zh: '本地发布验证', description_en: 'Local release validation', icon_url: '', hero_image_url: '', gallery_urls: [], supported_platforms: ['macOS', 'Windows'], featured: false });
let server, browser, page, logs = '', blockedUpload = false, delayUpload = false;
const requests = [], errors = [];
const catalog = async () => JSON.parse(await readFile(path.join(storage, 'catalog.json'), 'utf8'));
const pass = name => { report.checks.push(name); console.log('PASS: ' + name); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fill(selector, value) { await page.$eval(selector, (input, value) => { const proto = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(input, value); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); }, value); }
async function shot(name) { await page.evaluate(() => window.scrollTo(0, 0)); await sleep(100); await page.screenshot({ path: path.join(output, name), fullPage: true }); report.screenshots.push(name); }
async function waitText(text, role = 'status') { await page.waitForFunction((text, role) => Array.from(document.querySelectorAll(`[role="${role}"]`)).some(e => e.textContent.includes(text)), {}, text, role); }
async function createVersion(slug, version, title = '启动检查与发光提醒') {
  await page.goto(`${base}/admin/products/${slug}?tab=versions`, { waitUntil: 'networkidle0' });
  await page.$eval('[data-testid="new-product-release"]', x => { x.open = true; });
  const form = '[data-testid="new-product-release"] [data-testid="release-details-form"]';
  await fill(form + ' input[name="version"]', version); await fill(form + ' input[name="title_zh"]', title); await fill(form + ' textarea[name="notes_zh"]', '版本发布测试：保留原始文件，不改用户数据。');
  await page.click(form + ' button[type="submit"]');
  await page.waitForFunction(() => location.search.includes('saved=1') && location.search.includes('release='));
  const release = (await catalog()).releases.find(r => r.product_slug === slug && r.version === version);
  await page.waitForSelector(`#release-${release.id}[open] [data-testid="artifact-upload"]`); return release;
}
async function switchTab(tab) {
  const selector = `[data-tab="${tab}"]`;
  await page.$eval(selector, e => e.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.click(selector);
  await page.waitForFunction(tab => document.querySelector(`[data-tab="${tab}"]`)?.getAttribute('aria-selected') === 'true', {}, tab);
}
async function queueFiles(id, files) {
  const selector = `#release-${id} input[name="file"]`;
  await (await page.$(selector)).uploadFile(...files);
  await page.waitForSelector(`#release-${id} [data-queue-file]`);
}
try {
  await writeFile(path.join(storage, 'catalog.json'), JSON.stringify({ schemaVersion: 1, updatedAt: new Date().toISOString(), products: [fixture('open-play', 'open play 认证管理工具'), fixture('sample-tool', '示例工具')], releases: [] }));
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(port)], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
  [server.stdout, server.stderr].forEach(s => s.on('data', d => { logs = (logs + d).slice(-22000); }));
  for (let i = 0; i < 160; i++) { if (server.exitCode !== null) throw Error(logs); if ((await fetch(base + '/api/health').catch(() => null))?.ok) break; await sleep(200); }
  assert.match(await (await fetch(base + '/admin/products/open-play')).text(), /admin-access-notice/);
  browser = await puppeteer.launch({ headless: true, ...(existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome') ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' } : {}), args: ['--disable-background-networking'] });
  browser.on('disconnected', () => { report.browserExit = { code: browser.process()?.exitCode, signal: browser.process()?.signalCode }; });
  page = await browser.newPage(); page.setDefaultTimeout(25000); await page.setViewport({ width: 1440, height: 1050 }); await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  page.on('pageerror', e => errors.push(e.message)); page.on('dialog', d => d.accept());
  await page.setRequestInterception(true);
  page.on('request', async r => {
    if (!r.url().startsWith(base) && !/^(blob:|data:)/.test(r.url())) { report.foreignRequests.push(r.url()); await r.abort(); return; }
    if (r.url().includes('/api/admin/releases/upload?')) {
      requests.push({ offset: new URL(r.url()).searchParams.get('offset'), final: new URL(r.url()).searchParams.get('final') });
      if (blockedUpload) { blockedUpload = false; await r.abort('failed'); return; }
      if (delayUpload) await sleep(500);
    }
    await r.continue();
  });
  await browser.setCookie({ name: 'next-auth.session-token', value: await encode({ secret, token: { sub: subject, casdoorSubject: subject, casdoorIssuer: issuer }, maxAge: 3600 }), domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' });
  await page.goto(base + '/admin/products/open-play?tab=versions', { waitUntil: 'networkidle0' });
  assert.ok(await page.$('[data-testid="upload-awaiting-release"]')); assert.equal(await page.$eval('[data-testid="upload-awaiting-release"] button', b => b.disabled), true);
  assert.equal(await page.$eval('[data-testid="new-product-release"] input[name="version"]', x => x.value), '');
  assert.match(await page.$eval('h1 + p', p => p.textContent), /商品：已上架.*软件：尚无已发布版本/);
  await shot('release-empty-desktop.png');
  pass('upload step is visible before save, version input is not a false default, and product visibility is distinct from software publication');
  const form = '[data-testid="new-product-release"] [data-testid="release-details-form"]';
  await page.click('[data-testid="new-product-release"] [data-testid="release-reuse-chinese"]');
  assert.ok(await page.$(form + ' input[name="title_en"]')); assert.equal(await page.$eval(form, f => f.checkValidity()), false);
  await page.click('[data-testid="new-product-release"] [data-testid="release-reuse-chinese"]');
  pass('English defaults are explicit; independent English fields are visible when required');

  await switchTab('preview');
  assert.ok(await page.$('[data-testid="product-publication-issues"]')); assert.equal(await page.$eval('[data-testid="confirm-product-publication"]', x => x.disabled), true);
  await switchTab('details');
  for (const field of ['icon_url', 'hero_image_url']) {
    const file = path.join(temp, field + '.png'); await sharp({ create: { width: 320, height: 200, channels: 3, background: { r: 25, g: 135, b: 108 } } }).png().toFile(file);
    await (await page.$(`[data-upload="${field}"]`)).uploadFile(file); await waitText('图片已上传'); await page.waitForFunction(() => !document.querySelector('[data-testid="save-product-draft"]').disabled);
  }
  await page.click('[data-testid="save-product-draft"]'); await waitText('草稿已保存');
  pass('missing product artwork blocks confirmation early; real local media upload and draft save satisfy the unchanged server prerequisites');

  const r = await createVersion('open-play', '0.6.6.13');
  assert.equal(r.title_en, r.title_zh); assert.equal(r.notes_en, r.notes_zh);
  assert.equal(await page.$eval(`[data-preview-release="${r.id}"]`, b => b.disabled), true);
  await switchTab('preview'); assert.equal(await page.$eval(`[data-release-select="${r.id}"]`, b => b.disabled), true);
  assert.ok(await page.$('[data-testid="metadata-only-notice"]')); await switchTab('versions');
  pass('Chinese-only version saves with deliberate bilingual fallback, stays in product context, and missing artifacts prevent software publication');
  const savedForm = `#release-${r.id} [data-testid="release-details-form"]`;
  await fill(savedForm + ' input[name="title_zh"]', '  更新后的版本标题  ');
  await page.click(savedForm + ' button[type="submit"]');
  await page.waitForSelector(`#release-${r.id} input[name="file"]`);
  await page.waitForFunction(id => { const input = document.querySelector(`#release-${id} input[name="file"]`); return !!input && !input.disabled; }, {}, r.id);
  assert.equal((await catalog()).releases.find(x => x.id === r.id).title_zh, '更新后的版本标题');
  pass('saving an existing version normalizes surrounding whitespace without leaving the upload step falsely locked');


  const signed = process.env.OPEN_PLAY_RELEASE_FIXTURE_DIR;
  if (signed) {
    const names = ['open-play-0.6.6.13-macos.zip', 'open-play-0.6.6.13-windows-x64.zip', 'appcast.xml', 'windows.json'];
    const files = names.map(n => path.join(signed, n)); for (const f of files) assert.ok(existsSync(f));
    await queueFiles(r.id, files);
    assert.equal((await page.$$(`#release-${r.id} [data-queue-file]`)).length, 4);
    for (const [name, platform, arch, kind] of [[names[0], 'macos', 'arm64', 'zip'], [names[1], 'windows', 'x64', 'zip'], [names[2], 'macos', 'arm64', 'manifest'], [names[3], 'windows', 'x64', 'manifest']]) {
      const row = `#release-${r.id} [data-queue-file="${name}"]`; assert.equal(await page.$eval(row + ' input[name="platform"]', x => x.value), platform); assert.equal(await page.$eval(row + ' input[name="architecture"]', x => x.value), arch); assert.equal(await page.$eval(row + ' input[name="package_kind"]', x => x.value), kind);
    }
    await queueFiles(r.id, [files[0]]); await waitText('已在', 'alert');
    assert.equal((await page.$$(`#release-${r.id} [data-queue-file]`)).length, 4);
    await shot('release-upload-queue.png');
    pass('multi-file selection suggests all four exact native slots and rejects a duplicate file without uploading');
    delayUpload = true; const uploadForm = `#release-${r.id} [data-testid="artifact-upload"] form`;
    await page.$eval(uploadForm, f => { f.requestSubmit(); f.requestSubmit(); });
    await page.waitForFunction(() => document.querySelector('[data-tab="preview"]').disabled);
    await waitText('上传完成 4 个文件'); delayUpload = false;
    await page.waitForFunction(id => !document.querySelector(`[data-preview-release="${id}"]`).disabled, {}, r.id);
    assert.equal(requests.length, 4); let live = (await catalog()).releases.find(x => x.id === r.id); assert.equal(live.release_artifacts.length, 4); assert.equal(live.status, 'draft');
    for (const a of live.release_artifacts) assert.equal((await fetch(base + a.public_path)).status, 404);
    await shot('release-files-ready.png');
    pass('one batch uploads four actual signed files exactly once, locks navigation while busy, and keeps all files private');
    await page.click(`[data-preview-release="${r.id}"]`);
    await page.waitForFunction(id => document.querySelector(`[data-release-select="${id}"]`).checked, {}, r.id);
    assert.equal(await page.$eval('[data-testid="confirm-product-publication"]', x => x.checked), false);
    assert.equal(await page.$eval('[data-testid="publish-product"]', x => x.disabled), true);
    assert.equal(await page.$('[data-testid="product-preview"] a[download]'), null);
    await shot('release-review-desktop.png');
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]); await shot('release-review-dark.png');
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await page.setViewport({ width: 390, height: 844 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); await shot('release-review-mobile.png'); await page.setViewport({ width: 1440, height: 1050 });
    pass('continue selects the ready version, explains final validation, exposes no draft downloads, and requires explicit confirmation across desktop/mobile');
    const feed = live.release_artifacts.find(a => a.file_name === 'windows.json'); const feedPath = path.join(storage, feed.storage_path), bytes = await readFile(feedPath); const corrupt = Buffer.from(bytes); corrupt[10] ^= 1; await writeFile(feedPath, corrupt);
    await page.click('[data-testid="confirm-product-publication"]'); await page.click('[data-testid="publish-product"]');
    await page.waitForFunction(() => Array.from(document.querySelectorAll('[role="alert"]')).some(e => e.getBoundingClientRect().height > 0));
    assert.equal((await catalog()).releases.find(x => x.id === r.id).status, 'draft');
    const failure = await page.evaluate(() => Array.from(document.querySelectorAll('[role="alert"]')).filter(e => e.getBoundingClientRect().height > 0).map(e => e.textContent).join(' '));
    assert.doesNotMatch(failure, /补齐中文|补齐发布检查|尚未保存/); report.hashRejectionMessage = failure;
    await writeFile(feedPath, bytes);
    pass('actual backend hash/signature protection still rejects a changed file without public promotion');
    if (!await page.$eval('[data-testid="confirm-product-publication"]', x => x.checked)) await page.click('[data-testid="confirm-product-publication"]');
    console.log('CHECKPOINT: retry publication after restoring the original signed bytes');
    await page.waitForFunction(()=>!document.querySelector('[data-testid="publish-product"]').disabled);
    await page.click('[data-testid="publish-product"]'); await waitText('已发布');
    live = (await catalog()).releases.find(x => x.id === r.id); assert.equal(live.status, 'published');
    for (const a of live.release_artifacts) { const response = await fetch(base + a.public_path); assert.equal(response.status, 200); assert.equal(createHash('sha512').update(Buffer.from(await response.arrayBuffer())).digest('hex'), a.sha512); }
    assert.equal((await fetch(base + '/updates/open-play/appcast.xml')).status, 200);
    await switchTab('versions'); await shot('release-published-files.png');
    pass('confirmed publication uses existing real validation and exposes exact files and old updater aliases only after success');
  } else report.signedPublication = 'not run: provide OPEN_PLAY_RELEASE_FIXTURE_DIR for actual public signed files';

  const generic = await createVersion('sample-tool', '1.0.0', '通用分片上传');
  const pkg = path.join(temp, 'sample-linux-x64.zip'); await writeFile(pkg, Buffer.alloc(9 * 1024 ** 2, 90));
  await queueFiles(generic.id, [pkg]); blockedUpload = true;
  const gf = `#release-${generic.id} [data-testid="artifact-upload"] form`; const before = requests.length;
  await page.$eval(gf, f => f.requestSubmit()); await waitText('无法确认', 'alert'); await sleep(500);
  assert.equal(requests.length, before + 1); assert.equal(await page.$eval(gf + ' button[type="submit"]', x => x.disabled), true);
  pass('interrupted upload becomes uncertain with no automatic retry and preserves the selected file for reconciliation');
  await page.click(`[aria-label="从队列移除 sample-linux-x64.zip"]`); await queueFiles(generic.id, [pkg]);
  await page.$eval(gf, f => f.requestSubmit()); await waitText('上传完成 1 个文件');
  assert.deepEqual(requests.slice(-2).map(x => x.offset), ['0', String(8 * 1024 ** 2)]);
  pass('manual retry after reconciliation uploads 8+1 MiB with exact server-confirmed chunks');
  const beforeCatalog = await catalog(); await page.goto(base + '/admin/products/sample-tool?tab=versions', { waitUntil: 'networkidle0' });
  await page.$eval('[data-testid="new-product-release"]', x => { x.open = true; });
  await fill(form + ' input[name="version"]', '1.0.0'); await fill(form + ' input[name="title_zh"]', '重复输入保留'); await fill(form + ' textarea[name="notes_zh"]', '重复版本必须拒绝');
  await page.click(form + ' button[type="submit"]'); await waitText('已存在', 'alert');
  assert.equal(await page.$eval(form + ' input[name="title_zh"]', x => x.value), '重复输入保留');
  assert.equal((await catalog()).releases.length, beforeCatalog.releases.length);
  await switchTab('details'); await fill('input[name="tagline_zh"]', '测试切换保留'); await switchTab('versions');
  assert.equal(await page.$eval(form + ' input[name="title_zh"]', x => x.value), '重复输入保留');
  pass('server validation errors preserve inputs; switching/editing product tabs does not unmount unsaved version data');
  await page.focus('[data-tab="versions"]'); await page.keyboard.press('ArrowRight'); assert.equal(await page.$eval('[data-tab="preview"]', x => x.getAttribute('aria-selected')), 'true');
  assert.equal(await page.$eval('[data-testid="publish-product"]', x => x.disabled), true);
  pass('keyboard tabs work and unresolved product/version edits cannot be published');
  assert.deepEqual(errors, []); assert.deepEqual(report.foreignRequests, []); report.status = 'passed';
} catch (error) { report.status = 'failed'; report.error = error.stack; process.exitCode = 1; if (page) await shot('failure.png').catch(() => {}); }
finally {
  await browser?.close().catch(() => {});
  if (server && server.exitCode === null) await new Promise(resolve => { const timer = setTimeout(() => server.kill('SIGKILL'), 8000); server.once('exit', () => { clearTimeout(timer); resolve(); }); server.kill('SIGTERM'); });
  await rm(temp, { recursive: true, force: true }); report.pageErrors = errors; report.uploadRequestCount = requests.length;
  await writeFile(path.join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n'); if (report.status === 'failed') await writeFile(path.join(output, 'server.log'), logs);
  console.log(JSON.stringify(report, null, 2));
}
