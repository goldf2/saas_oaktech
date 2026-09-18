// Layout measurements use an isolated catalog and a disposable local test identity.
// No production requests, real sessions, uploads or publication are performed here.
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

const require = createRequire(import.meta.url), { encode } = require('next-auth/jwt');
const ownRoot = fileURLToPath(new URL('../', import.meta.url));
const project = process.env.COMPACT_BASELINE_PROJECT || ownRoot;
const baselineMode = Boolean(process.env.COMPACT_BASELINE_PROJECT);
const output = process.env.STORE_VERIFY_OUTPUT || path.join(ownRoot, '.local-verification/compact/layout');
const temp = await mkdtemp(path.join(os.tmpdir(), 'oaktech-compact-'));
const storage = path.join(temp, 'releases'); await mkdir(storage); await mkdir(output, { recursive: true });
const port = await new Promise((resolve, reject) => { const socket = net.createServer(); socket.once('error', reject); socket.listen(0, '127.0.0.1', () => { const n = socket.address().port; socket.close(() => resolve(n)); }); });
const base = `http://127.0.0.1:${port}`, secret = randomBytes(32).toString('hex'), subject = 'isolated-compact-layout', issuer = 'http://127.0.0.1:9';
const env = { ...process.env, NODE_ENV: 'production', RELEASE_STORAGE_ROOT: storage, CASDOOR_AUTH_ENABLED: 'true', CASDOOR_ISSUER: issuer, CASDOOR_CLIENT_ID: 'layout-test', NEXTAUTH_URL: base, NEXTAUTH_SECRET: secret, OAKTECH_ADMIN_SUBJECTS: subject, OAKTECH_ADMIN_EMAILS: '', OAKTECH_ADMIN_USER_IDS: '', OAKTECH_RELEASE_WRITE_TOKEN: randomBytes(32).toString('hex'), BASE_URL: base };
const product = { id: 'compact-fixture', slug: 'open-play', category_slug: 'desktop-apps', status: 'released', visibility: 'published', name_zh: 'open play 认证管理工具', name_en: 'open play', tagline_zh: '紧凑布局检查', tagline_en: 'Layout test', description_zh: '隔离测试，没有生产操作。', description_en: 'Isolated layout test.', icon_url: '/fixture-icon.png', hero_image_url: '/fixture-cover.png', gallery_urls: [], videos: [], supported_platforms: ['macOS', 'Windows'], featured: false };
const release = { id: 'layout-release', product_slug: 'open-play', version: '0.6.6.13', channel: 'stable', status: 'draft', is_current: false, published_at: null, title_zh: '启动检测与更新提醒', title_en: '启动检测与更新提醒', notes_zh: '后台检查更新，发现新版时显示柔和亮点。', notes_en: '后台检查更新，发现新版时显示柔和亮点。', release_artifacts: [] };
for (const [name, platform, architecture, kind] of [['open-play-0.6.6.13-macos.zip','macos','arm64','zip'], ['open-play-0.6.6.13-windows-x64.zip','windows','x64','zip'], ['appcast.xml','macos','arm64','manifest'], ['windows.json','windows','x64','manifest']]) {
  release.release_artifacts.push({ id: name, release_id: release.id, file_name: name, platform, architecture, package_kind: kind, size_bytes: kind === 'zip' ? 4200000 : 2000, sha512: 'a'.repeat(128), storage_path: `open-play/stable/${release.version}/${name}`, public_path: `/releases/open-play/stable/${release.version}/${name}`, content_type: 'application/octet-stream' });
}
async function catalog(releases) { await writeFile(path.join(storage,'catalog.json'), JSON.stringify({schemaVersion:1,updatedAt:new Date().toISOString(),products:[product],releases})); }
let server, browser, page, logs = ''; const errors = [], foreign = [];
const report = { version: JSON.parse(await readFile(path.join(project,'package.json'),'utf8')).version, baselineMode, measurements: {}, checks: [], screenshots: [], scope: 'Isolated display fixtures; no file hashing, signature verification, real credentials or production operations.' };
const pass = text => { report.checks.push(text); console.log('PASS: '+text); };
async function capture(name) { await page.screenshot({ path:path.join(output,name+'.png'), fullPage:true }); report.screenshots.push(name+'.png'); }
async function metrics() {
  return page.evaluate(() => {
    const rect = selector => { const e=document.querySelector(selector); if(!e)return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.x),y:Math.round(b.y+scrollY),width:Math.round(b.width),height:Math.round(b.height),bottom:Math.round(b.bottom+scrollY)}; };
    return {viewport:{width:innerWidth,height:innerHeight},documentHeight:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth>innerWidth+1,
      workspace:rect('[data-testid="product-workspace"]'),editor:rect('[data-testid="new-product-release"]'),upload:rect('[data-testid="upload-awaiting-release"]'),steps:rect('ol[aria-label="软件发布流程"]'),save:rect('[data-testid="new-product-release"] button[type="submit"]'),review:rect('[data-testid="publication-review"]'),files:rect('[data-testid="version-files"]'),previewCollapsed:document.querySelector('[data-testid="preview-disclosure"]')?.open===false,
      controlFont:parseFloat(getComputedStyle(document.querySelector('[data-testid="release-details-form"] input[name="version"]')).fontSize),controlHeight:document.querySelector('[data-testid="release-details-form"] input[name="version"]').getBoundingClientRect().height};
  });
}
try {
  await catalog([]);
  server=spawn(process.execPath,[path.join(project,'node_modules/next/dist/bin/next'),'start','-H','127.0.0.1','-p',String(port)],{cwd:project,env,stdio:['ignore','pipe','pipe']});
  for(const stream of [server.stdout,server.stderr])stream.on('data',b=>logs=(logs+b).slice(-16000));
  let started=false;for(let i=0;i<150;i++){if(server.exitCode!==null)throw new Error(logs);if((await fetch(base+'/api/health').catch(()=>null))?.ok){started=true;break;}await new Promise(r=>setTimeout(r,200));}assert.ok(started);
  const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser=await puppeteer.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{}),args:['--disable-background-networking']});
  await browser.setCookie({name:'next-auth.session-token',value:await encode({secret,token:{sub:subject,casdoorSubject:subject,casdoorIssuer:issuer},maxAge:3600}),domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Lax'});
  page=await browser.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);page.on('request',request=>{if(request.url().startsWith(base)||/^(data:|blob:)/.test(request.url()))request.continue();else{foreign.push(request.url());request.abort();}});
  for(const [width,height] of [[1440,900],[1024,768],[390,844]]){
    await page.setViewport({width,height});await page.goto(base+'/admin/products/open-play?tab=versions',{waitUntil:'networkidle0'});await page.waitForSelector('[data-testid="new-product-release"] form');
    const m=await metrics();report.measurements['new-'+width]=m;assert.equal(m.overflow,false);assert.ok(m.controlFont>=14);assert.ok(m.controlHeight>=34);
    if(!baselineMode && width>=1024)assert.ok(m.save.bottom<=height,'Save-and-upload action should fit the first desktop screen');
    await capture('new-'+width);
  }
  pass('1440, 1024 and 390px forms retain readable controls and visible upload guidance without horizontal overflow');
  await catalog([release]);await page.setViewport({width:1440,height:900});await page.goto(base+`/admin/products/open-play?tab=versions&release=${release.id}`,{waitUntil:'networkidle0'});await page.waitForSelector(`[data-preview-release="${release.id}"]:not([disabled])`);await page.evaluate(()=>scrollTo(0,0));
  report.measurements['files-1440']=await metrics();await capture('files-1440');
  if(!baselineMode){assert.equal(await page.$$eval('[data-testid="version-files"] [data-artifact-row]',rows=>rows.length),4);assert.equal(await page.$$eval('[data-testid="version-files"] a[download]',x=>x.length),0);}
  await page.click(`[data-preview-release="${release.id}"]`);await page.waitForSelector('[data-tab="preview"][aria-selected="true"]');await page.evaluate(()=>scrollTo(0,0));
  report.measurements['review-1440']=await metrics();assert.equal(await page.$eval('[data-testid="publish-product"]',x=>x.disabled),true);await capture('review-1440');
  if(!baselineMode){
    assert.equal(report.measurements['review-1440'].previewCollapsed,true);
    assert.ok(await page.$eval('[data-testid="publication-review"]',x=>x.getBoundingClientRect().height<=570));
    await page.click('[data-testid="preview-disclosure"] > summary');await page.waitForSelector('[data-testid="product-preview"] .product-detail-grid');
    await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='手机宽度').click());
    await page.waitForFunction(()=>document.querySelector('[data-testid="product-preview"]').getBoundingClientRect().width<=390);
    assert.equal(await page.$$eval('[data-testid="product-preview"] a[download]',x=>x.length),0);
    await page.click('[data-testid="preview-disclosure"] > summary');
    pass('full storefront preview is on demand; phone preview works and does not expose draft downloads');
  }
  await page.setViewport({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));assert.equal((await metrics()).overflow,false);await capture('review-390');
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}]);await page.setViewport({width:1440,height:900});await capture('review-dark');
  assert.deepEqual(errors,[]);assert.deepEqual(foreign,[]);pass('publication confirmation remains explicit, mobile layout and dark mode have no runtime errors');
  if(process.env.COMPACT_COMPARE_FILE){
    const previous=JSON.parse(await readFile(process.env.COMPACT_COMPARE_FILE,'utf8'));
    const compare={};for(const key of ['new-1440','new-1024','files-1440','review-1440']){const before=previous.measurements[key].workspace.height,after=report.measurements[key].workspace.height;compare[key]={before,after,reductionPercent:Math.round((1-after/before)*100)};}
    assert.ok(compare['new-1440'].reductionPercent>=20,'Target: at least 20% shorter empty desktop workspace');
    assert.ok(compare['review-1440'].reductionPercent>=35,'Target: at least 35% shorter default review workspace');
    report.comparison=compare;pass('measured same-fixture desktop form and default publication workspace are substantially shorter');
  }
  report.status='passed';
} catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;if(page)await capture('failure').catch(()=>{});}
finally {
  await browser?.close().catch(()=>{});
  if(server && server.exitCode===null)await new Promise(resolve=>{const timer=setTimeout(()=>server.kill('SIGKILL'),5000);server.once('exit',()=>{clearTimeout(timer);resolve();});server.kill('SIGTERM');});
  await rm(temp,{recursive:true,force:true});report.pageErrors=errors;report.foreignRequests=foreign;
  await writeFile(path.join(output,'result.json'),JSON.stringify(report,null,2)+'\n');if(report.status==='failed')await writeFile(path.join(output,'server.log'),logs);
  console.log(JSON.stringify(report,null,2));
}
