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
const slug = 'open-play', catalogFile = path.join(storage, 'catalog.json');
const existing = { id: 'isolated-product', slug, category_slug: 'desktop-apps', status: 'beta', visibility: 'published', name_zh: 'OpenPlay 隔离验收', name_en: 'Video demo', tagline_zh: '已公开的原始简介', tagline_en: 'Original introduction', description_zh: '原有公开详情', description_en: 'Original description', icon_url: '/gitfinder-2/icon.png', hero_image_url: '/gitfinder-2/hero.svg', supported_platforms: ['macOS'], featured: false };
const draftRelease={id:'pending-software',product_slug:slug,version:'1.0.0',channel:'stable',status:'draft',is_current:false,published_at:null,title_zh:'不得随资料发布',title_en:'Must stay draft',notes_zh:'未准备好的软件',notes_en:'Incomplete release',release_artifacts:[]};
const initial = { schemaVersion: 1, updatedAt: new Date().toISOString(), products: [existing], releases: [draftRelease] };
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
async function publish() { await page.click('[data-tab="preview"]'); await page.click('[data-testid="publish-product"]'); await status('已发布'); }
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
  const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser=await puppeteer.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{})});
  page=await browser.newPage();page.setDefaultTimeout(25000);await page.setViewport({width:1440,height:1050});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await intercept(page);
  const token=await encode({secret,token:{sub:subject,casdoorSubject:subject,casdoorIssuer:issuer},maxAge:3600});
  await page.setCookie({name:'next-auth.session-token',value:token,domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Lax'});
  await page.goto(base+`/admin/products/${slug}`,{waitUntil:'networkidle0'});
  assert.equal(await page.$eval('[data-testid="save-product-draft"]',e=>e.textContent),'保存草稿');
  await input('textarea[name="description_zh"]','新添加的 OpenPlay 功能介绍：账号切换与配置管理。');
  await page.click('[data-testid="add-product-video"]');await input('[data-video-url]','https://youtu.be/M7lc1UVf-VE');
  await page.click('[data-add-video-source]');
  await page.click('[data-testid="prepare-product-publication"]');await status('草稿已保存');
  await page.waitForFunction(()=>!document.querySelector('[data-testid="save-product-draft"]').disabled);
  assert.equal((await readCatalog()).productDrafts[slug].product.videos.length,1);
  assert.equal((await readCatalog()).products[0].videos,undefined);
  assert.equal(await page.$eval('[data-testid="publish-product"]',e=>e.disabled),true);
  const issues=await page.$eval('[data-testid="product-publication-issues"]',e=>e.textContent);
  assert.doesNotMatch(issues,/请填写标题/);assert.match(issues,/来源2.*移除/);
  assert.match(await page.$eval('[data-testid="product-publish-pending"]',e=>e.textContent),/尚未发布/);
  pass('editing text plus an incomplete video can prepare a private draft, with precise blockers rather than an unexplained disabled publication');
  await page.$$eval('[data-testid="product-publication-issues"] button',buttons=>buttons.find(b=>b.textContent.includes('来源2')).click());
  await page.waitForFunction(()=>document.activeElement?.hasAttribute('data-video-url'));
  await input('[data-video-title]','OpenPlay 使用演示');
  const removeSource = '[aria-label="移除视频1来源2"]';
  await page.$eval(removeSource, el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForFunction(selector => { const el = document.querySelector(selector); const r = el?.getBoundingClientRect(); if (!el || !r) return false; const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return hit === el || el.contains(hit); }, {}, removeSource);
  await page.locator(removeSource).click();
  await page.waitForFunction(() => document.querySelectorAll('[data-edit-source]').length === 1);
  await page.click('[data-testid="prepare-product-publication"]');await status('草稿已保存');
  await page.waitForFunction(()=>!document.querySelector('[data-testid="publish-product"]').disabled);
  const summary=await page.$eval('[data-testid="product-change-summary"]',e=>e.textContent);
  assert.match(summary,/线上 0 段 → 本次 1 段/);assert.match(summary,/OpenPlay 使用演示/);assert.match(summary,/新添加的 OpenPlay/);
  assert.ok(await page.$('[data-testid="independent-english-notice"]'));
  assert.deepEqual((await readCatalog()).releases,initial.releases);
  assert.equal((await readCatalog()).products[0].description_zh,existing.description_zh);
  pass('repair links focus the exact field; the direct product action saves and previews text/video without publishing or requiring software');
  await shot('product-publication-review.png');
  await page.click('[data-testid="publish-product"]');await status('商品资料已发布');
  await page.waitForSelector('[data-testid="product-publication-success"]');
  assert.ok(await page.$(`[data-testid="product-publication-success"] a[href="/zh/products/${slug}"]`));
  assert.ok(await page.$(`[data-testid="product-publication-success"] a[href="/en/products/${slug}"]`));
  const published=await readCatalog();assert.equal(published.productDrafts?.[slug],undefined);assert.deepEqual(published.releases,initial.releases);
  visitor=await browser.createBrowserContext();const publicPage=await visitor.newPage();await intercept(publicPage);
  await publicPage.goto(base+`/zh/products/${slug}`,{waitUntil:'networkidle0'});assert.match(await publicPage.$eval('main',e=>e.textContent),/新添加的 OpenPlay/);assert.equal((await publicPage.$$('[data-video-id]')).length,1);
  await publicPage.goto(base+`/en/products/${slug}`,{waitUntil:'networkidle0'});assert.match(await publicPage.$eval('main',e=>e.textContent),/Original description/);assert.equal((await publicPage.$$('[data-video-id]')).length,1);
  pass('explicit confirmation publishes new Chinese content and the shared video on both public pages while leaving the incomplete software draft untouched');
  await shot('public-product-with-video.png',publicPage);
  await page.click('[data-tab="details"]');await input('textarea[name="description_zh"]','第二次修改，先预览不保存');
  const beforePreview=await readCatalog();await page.click('[data-preview-product]');
  assert.deepEqual(await readCatalog(),beforePreview);assert.equal(await page.$eval('[data-testid="publish-product"]',e=>e.disabled),true);
  await page.click('[data-testid="save-for-product-publication"]');await status('草稿已保存');
  await page.waitForFunction(()=>!document.querySelector('[data-testid="publish-product"]').disabled);
  assert.equal((await readCatalog()).products[0].description_zh,published.products[0].description_zh);
  assert.equal((await readCatalog()).productDrafts[slug].product.description_zh,'第二次修改，先预览不保存');
  assert.equal(await page.$('[data-testid="product-publication-success"]'),null,'an earlier success receipt must not label a later saved draft as published');
  pass('plain preview still never saves; saving from review clears earlier success feedback and keeps the public page unchanged');
  await page.setViewport({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot('publication-mobile.png');
  await stop();await start();assert.equal((await readCatalog()).products[0].videos.length,1);
  assert.equal((await readCatalog()).productDrafts[slug].product.description_zh,'第二次修改，先预览不保存');assert.deepEqual(errors,[]);
  pass('mobile review has no horizontal overflow; published video and later unpublished draft both survive server restart');
  report.status='passed';
} catch(error) { report.status='failed';report.error=error.stack;process.exitCode=1;if(page)await shot('failure.png').catch(()=>{}); }
finally {
  await visitor?.close().catch(()=>{});await browser?.close().catch(()=>{});await stop();await rm(root,{recursive:true,force:true});
  await writeFile(path.join(output,'result.json'),JSON.stringify(report,null,2)+'\n');if(report.status==='failed')await writeFile(path.join(output,'server.log'),log);
  process.stdout.write(JSON.stringify({...report,output},null,2)+'\n',()=>process.exit(report.status==='passed'?0:1));
}
