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
const output = process.env.STORE_VERIFY_OUTPUT || path.join(root, '.local-verification/release-import/browser');
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
  for (const endpoint of ['github','remote']) { const response = await fetch(base+'/api/admin/releases/'+endpoint,{method:'POST',headers:{'content-type':'application/json','x-oaktech-admin-upload':'1'},body:'{}'}); assert.equal(response.status,403); }
  pass('remote and GitHub endpoints deny anonymous requests');
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

  await page.goto(base + '/admin/products/sample-tool?tab=versions', { waitUntil: 'networkidle0' });
  await fill('[data-testid="github-source"]', 'cli/cli');
  await page.click('[data-testid="github-inspect"]');
  await page.waitForFunction(() => document.querySelector('input[name="version"]').value.length > 0, { timeout: 60000 });
  const version = await page.$eval('input[name="version"]', e => e.value);
  assert.ok(await page.$eval('textarea[name="notes_zh"]', e => e.value.length > 0));
  await shot('github-source-desktop.png');
  pass('live public GitHub release populates version, title, notes and assets');
  await page.click('[data-testid="release-details-form"] button[type="submit"]');
  await page.waitForFunction(() => location.search.includes('saved=1'));
  const release = (await catalog()).releases.find(r => r.product_slug === 'sample-tool' && r.version === version);
  const scope = `#release-${release.id}`;
  await page.waitForSelector(scope + ' [data-remote-file]', { timeout: 60000 });
  const assetName = await page.$$eval(scope + ' [data-remote-file]', rows => rows.map(r => r.dataset.remoteFile).find(n => /checksums.*txt$/.test(n)));
  assert.ok(assetName);
  const row = scope + ` [data-remote-file="${assetName}"]`;
  await page.click(row + ' input[type="checkbox"]');
  const inputs = await page.$$(row + ' input:not([type="checkbox"])');
  for (let i=0; i<3; i++) { await inputs[i].click({ clickCount: 3 }); await inputs[i].type(['linux','any','manifest'][i]); }
  await page.click(scope + ' [data-testid="import-remote-files"]');
  await page.waitForFunction(selector => /已导入|下载超时/.test(document.querySelector(selector)?.textContent ?? ''), { timeout: 60000 }, row);
  if (!(await page.$eval(row,e=>e.textContent.includes('已导入')))) {
    report.networkRetry = 'One real GitHub download timeout; explicit UI retry';
    await page.click(scope + ' [data-testid="import-remote-files"]');
    await page.waitForFunction(selector => document.querySelector(selector)?.textContent.includes('已导入'), { timeout: 60000 }, row);
  }

  const first = (await catalog()).releases.find(r => r.id === release.id);
  assert.equal(first.status, 'draft'); assert.equal(first.release_artifacts.length, 1);
  const bytes = await readFile(path.join(storage, first.release_artifacts[0].storage_path));
  assert.equal(createHash('sha512').update(bytes).digest('hex'), first.release_artifacts[0].sha512);
  pass('GitHub asset is downloaded by server, stored unchanged with matching hash, and stays draft');
  async function api(body) { return page.evaluate(async body => { const r = await fetch('/api/admin/releases/remote', {method:'POST', headers:{'content-type':'application/json','x-oaktech-admin-upload':'1'}, body:JSON.stringify(body)}); return {status:r.status, data:await r.json()}; }, body); }
  const metadata = {releaseId:release.id, fileName:'README.md', platform:'linux', architecture:'any',packageKind:'text'};
  const denied = await api({...metadata,url:'https://127.0.0.1/private'});
  assert.equal(denied.status,400); assert.equal(denied.data.error,'PUBLIC_HOST_REQUIRED');
  await page.$$eval(scope + ' [role="group"] button', buttons => buttons.find(b=>b.textContent==='下载链接').click());
  await fill(scope + ' [data-testid="remote-file-url"]', 'https://raw.githubusercontent.com/cli/cli/trunk/README.md');
  await page.click(scope + ' [data-testid="add-remote-url"]');
  const linkRow = scope + ' [data-remote-file="README.md"]';
  const linkInputs = await page.$$(linkRow + ' input:not([type="checkbox"])');
  for (let i=0;i<3;i++) { await linkInputs[i].click({clickCount:3}); await linkInputs[i].type(['linux','any','text'][i]); }
  await page.click(scope + ' [data-testid="import-remote-files"]');
  await page.waitForFunction(selector=>document.querySelector(selector)?.textContent.includes('已导入'),{timeout:60000},linkRow);
  const duplicate = await api({...metadata,url:'https://raw.githubusercontent.com/cli/cli/trunk/README.md'});
  assert.equal(duplicate.status,409);
  pass('HTTPS direct link stores a second file; internal addresses and duplicate slots are rejected');
  await page.reload({waitUntil:'networkidle0'});
  await page.waitForFunction(selector => !document.querySelector(selector)?.disabled, {timeout:60000},scope + ' [data-testid="github-inspect"]');
  await page.$$eval(scope + ' [role="group"] button', buttons => buttons.find(b=>b.textContent==='本地上传').click());
  const file = path.join(temp,'sample-windows-x64.zip'); await writeFile(file,Buffer.from('isolated-local-upload'));
  await (await page.$(scope+' input[name="file"]')).uploadFile(file);
  await page.$$eval(scope + ' [role="group"] button', buttons => buttons.find(b=>b.textContent==='GitHub Release').click());
  await page.$$eval(scope + ' [role="group"] button', buttons => buttons.find(b=>b.textContent==='本地上传').click());
  assert.ok(await page.$(scope + ' [data-queue-file]'));
  await page.click(scope + ' [data-testid="artifact-upload"] button[type="submit"]');
  await page.waitForFunction(selector => document.querySelector(selector)?.textContent.includes('已上传'),{},scope+' [data-queue-file]');
  const mixed = (await catalog()).releases.find(r=>r.id===release.id);
  assert.equal(mixed.release_artifacts.length,3); assert.equal(mixed.status,'draft');
  pass('local upload supplements remote files in the same draft');
  await page.setViewport({width:390,height:844}); await shot('import-mobile.png');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.setViewport({width:1440,height:1000}); await shot('import-mixed-desktop.png');
  await browser.setCookie({name:'oaktech-language-preference',value:'en',domain:'127.0.0.1',path:'/',sameSite:'Lax'});
  await page.goto(base+'/admin/products/sample-tool?tab=versions&release='+release.id,{waitUntil:'networkidle0'});
  assert.match(await page.$eval(scope+' [data-testid="remote-release-import"]',e=>e.textContent),/Import release files/);
  assert.match(await page.$eval(scope+' [data-testid="remote-release-import"]',e=>e.textContent),/Local upload/);
  pass('mobile layout fits viewport, source switching retains local queue, and English import controls render');
  assert.deepEqual(errors,[]); report.status='passed';
} catch (error) { report.status = 'failed'; report.error = error.stack; process.exitCode = 1; if (page) await shot('failure.png').catch(() => {}); }
finally {
  await browser?.close().catch(() => {});
  if (server && server.exitCode === null) await new Promise(resolve => { const timer = setTimeout(() => server.kill('SIGKILL'), 8000); server.once('exit', () => { clearTimeout(timer); resolve(); }); server.kill('SIGTERM'); });
  await rm(temp, { recursive: true, force: true }); report.pageErrors = errors; report.uploadRequestCount = requests.length;
  await writeFile(path.join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n'); if (report.status === 'failed') await writeFile(path.join(output, 'server.log'), logs);
  // Assertions, artifact writes and browser/server cleanup have all completed.
  process.stdout.write(JSON.stringify(report, null, 2) + '\n', () => process.exit(report.status === 'passed' ? 0 : 1));
}
