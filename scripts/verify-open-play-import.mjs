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
const output = process.env.STORE_VERIFY_OUTPUT || path.join(root, '.local-verification/open-play-import/browser');
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
  await page.waitForSelector(`#release-${release.id}[open] [data-testid="remote-release-import"]`);
  await page.$$eval(`#release-${release.id} [role="group"] button`, buttons => buttons.find(b => b.textContent === "本地上传").click());
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

  const originalDir=process.env.OPEN_PLAY_GITHUB_FIXTURE_DIR;
  assert.ok(originalDir,'Set OPEN_PLAY_GITHUB_FIXTURE_DIR to original v0.6.6.13 GitHub assets');
  const names=['open-play-0.6.6.13-macos.zip','open-play-0.6.6.13-windows-x64.zip','appcast.xml','windows.json'];
  const r=await createVersion('open-play','0.6.6.13');const scope=`#release-${r.id}`;
  await queueFiles(r.id,names.map(n=>path.join(originalDir,n)));
  await page.click(scope+' [data-testid="artifact-upload"] button[type="submit"]');
  await waitText('上传完成 4 个文件');
  await page.waitForFunction(id=>!document.querySelector(`[data-preview-release="${id}"]`).disabled,{},r.id);
  await page.click(`[data-preview-release="${r.id}"]`);await page.click('[data-testid="confirm-software-publication"]');await page.click('[data-testid="publish-software"]');
  await waitText('appcast-website.xml','alert');
  assert.equal((await catalog()).releases.find(x=>x.id===r.id).status,'draft');
  await shot('wrong-github-feed-explained.png');
  pass('real GitHub-specific feeds reproduce metadata mismatch and show the correct website replacement; draft remains private');
  await switchTab('versions');
  for(const name of ['appcast.xml','windows.json']) {
    await page.click(scope+` [data-remove-artifact="${name}"]`);
    await page.waitForFunction(selector=>!document.querySelector(selector),{},scope+` [data-remove-artifact="${name}"]`);
    await page.waitForFunction(()=>!document.querySelector('[data-tab="versions"]').disabled);
  }
  assert.equal((await catalog()).releases.find(x=>x.id===r.id).release_artifacts.length,2);
  pass('remove only the two incorrect draft feeds while preserving both original packages');
  await page.$$eval(scope+' [role="group"] button',bs=>bs.find(b=>b.textContent==='GitHub Release').click());
  await fill(scope+' [data-testid="github-source"]','https://github.com/goldf2/open-play-releases/releases/tag/v0.6.6.13');
  await page.click(scope+' [data-testid="github-inspect"]');
  await page.waitForSelector(scope+' [data-remote-file="appcast.xml"]',{timeout:60000});
  for(const [name,source] of [['appcast.xml','appcast-website.xml'],['windows.json','windows-website.json']]){
    const row=scope+` [data-remote-file="${name}"]`;
    assert.match(await page.$eval(row,e=>e.textContent),new RegExp(source));
    assert.equal(await page.$eval(row+' input[type="checkbox"]',e=>e.checked),true);
  }
  assert.equal(await page.$$eval(scope+' [data-remote-file] input[type="checkbox"]',xs=>xs.filter(x=>x.checked).length),2);
  await shot('website-feed-mapping.png');
  await page.click(scope+' [data-testid="import-remote-files"]');
  await page.waitForFunction(selector=>document.querySelector(selector)?.textContent.includes('本次导入'),{timeout:90000},scope+' [data-testid="remote-release-import"]');
  if((await catalog()).releases.find(x=>x.id===r.id).release_artifacts.length!==4){
    report.networkRetry=true;await page.click(scope+' [data-testid="import-remote-files"]');
    await page.waitForFunction(scope=>['appcast.xml','windows.json'].every(name=>document.querySelector(scope+` [data-remote-file="${name}"]`)?.textContent.includes('已导入，待发布')),{timeout:90000},scope);
  }
  const restored=(await catalog()).releases.find(x=>x.id===r.id);assert.equal(restored.release_artifacts.length,4);
  for(const [name,source] of [['appcast.xml','appcast-website.xml'],['windows.json','windows-website.json']]){
    const a=restored.release_artifacts.find(x=>x.file_name===name);
    assert.deepEqual(await readFile(path.join(storage,a.storage_path)),await readFile(path.join(originalDir,source)));
  }
  pass('live GitHub website feeds map to canonical names without changing signed bytes; packages are not downloaded again');
  await page.waitForFunction(id=>!document.querySelector(`[data-preview-release="${id}"]`).disabled,{},r.id);
  await page.click(`[data-preview-release="${r.id}"]`);await page.click('[data-testid="confirm-software-publication"]');await page.click('[data-testid="publish-software"]');
  await waitText('软件版本已发布');
  assert.equal((await catalog()).releases.find(x=>x.id===r.id).status,'published');
  for(const name of names){const endpoint=name.endsWith('.zip')?'/downloads/'+name:'/updates/open-play/'+name;const response=await fetch(base+endpoint);assert.equal(response.status,200);const expected=await readFile(path.join(storage,'open-play/stable/0.6.6.13',name));assert.deepEqual(Buffer.from(await response.arrayBuffer()),expected);}
  pass('real v0.6.6.13 pinned signatures pass full publication and four public endpoints serve original bytes in isolated storage');
  await switchTab('versions');assert.equal(await page.$(scope+' [data-remove-artifact]'),null);
  await page.setViewport({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await shot('published-mobile.png');
  pass('published files offer no draft removal and mobile layout stays within viewport');
  assert.deepEqual(errors,[]);report.status='passed';
} catch (error) { report.status = 'failed'; report.error = error.stack; process.exitCode = 1; if (page) await shot('failure.png').catch(() => {}); }
finally {
  await browser?.close().catch(() => {});
  if (server && server.exitCode === null) await new Promise(resolve => { const timer = setTimeout(() => server.kill('SIGKILL'), 8000); server.once('exit', () => { clearTimeout(timer); resolve(); }); server.kill('SIGTERM'); });
  await rm(temp, { recursive: true, force: true }); report.pageErrors = errors; report.uploadRequestCount = requests.length;
  await writeFile(path.join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n'); if (report.status === 'failed') await writeFile(path.join(output, 'server.log'), logs);
  // Assertions, artifact writes and browser/server cleanup have all completed.
  process.stdout.write(JSON.stringify(report, null, 2) + '\n', () => process.exit(report.status === 'passed' ? 0 : 1));
}
