// Real browser operations against an isolated production build, never the public store.
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

const require = createRequire(import.meta.url);
const { encode } = require('next-auth/jwt');
const project = fileURLToPath(new URL('../', import.meta.url));
const temporary = await mkdtemp(path.join(os.tmpdir(), 'oaktech-publication-ui-'));
const storage = path.join(temporary, 'releases');
const output = process.env.PUBLICATION_VERIFY_OUTPUT || await mkdtemp(path.join(os.tmpdir(), 'oaktech-publication-ui-results-'));
await mkdir(storage, { recursive: true }); await mkdir(output, { recursive: true });
const port = await new Promise((resolve, reject) => {
  const probe = net.createServer(); probe.once('error', reject);
  probe.listen(0, '127.0.0.1', () => { const address = probe.address(); probe.close(() => resolve(address.port)); });
});
const base = `http://127.0.0.1:${port}`;
const secret = randomBytes(32).toString('hex'), issuer = 'http://127.0.0.1:9', subject = 'isolated-store-ui-test';
const env = { ...process.env, NODE_ENV:'production', RELEASE_STORAGE_ROOT:storage, CASDOOR_AUTH_ENABLED:'true', CASDOOR_ISSUER:issuer, CASDOOR_CLIENT_ID:'isolated-test', NEXTAUTH_URL:base, NEXTAUTH_SECRET:secret, OAKTECH_ADMIN_SUBJECTS:subject, OAKTECH_ADMIN_USER_IDS:'', OAKTECH_ADMIN_EMAILS:'', OAKTECH_RELEASE_WRITE_TOKEN:randomBytes(32).toString('hex'), BASE_URL:base };
const report = { version:require('../package.json').version, checks:[], screenshots:[], loginScope:'synthetic local session, temporary catalog; no real Casdoor or production writes', limitations:['Test identity and data are local only. Native signed-feed acceptance is covered by the release-workflow test.'] };
let server, browser, page, serverLog = '';
async function start() {
  server = spawn(process.execPath, ['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)], { cwd:project, env, stdio:['ignore','pipe','pipe'] });
  for (const stream of [server.stdout,server.stderr]) stream.on('data',data=>{serverLog=(serverLog+data.toString()).slice(-18000);});
  for(let i=0;i<160;i++) {
    if(server.exitCode!==null)throw new Error(`Local server exited: ${serverLog}`);
    if((await fetch(`${base}/api/health`).catch(()=>null))?.ok)return;
    await new Promise(resolve=>setTimeout(resolve,200));
  }
  throw new Error('Local server startup timeout');
}
async function stop() {
  if (!server || server.exitCode !== null) return;
  const child = server;
  await new Promise(resolve=>{
    const timer = setTimeout(()=>child.kill('SIGKILL'),10000);
    child.once('exit',()=>{clearTimeout(timer);resolve();}); child.kill('SIGTERM');
  });
}
const check = text=>{report.checks.push(text);console.log(`PASS ${text}`);};
const catalog = async()=>JSON.parse(await readFile(path.join(storage,'catalog.json'),'utf8'));
async function shot(name) { const file=path.join(output,name);await page.screenshot({path:file,fullPage:true});report.screenshots.push(file); }
async function controlled(selector,value) {
  await page.$eval(selector,(input,value)=>{
    const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:input.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto,'value').set.call(input,value);
    input.dispatchEvent(new Event(input.tagName==='SELECT'?'change':'input',{bubbles:true}));
  },value);
}
async function fillForm(selector,values) {
  await page.$eval(selector,(form,values)=>{
    for(const [name,value] of Object.entries(values)) {
      const input=form.elements.namedItem(name);if(!input)throw new Error(`Missing form input: ${name}`);
      const proto=input.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));
    }
  },values);
}
const status = async text=>page.waitForFunction(text=>Array.from(document.querySelectorAll('[role="status"]')).some(x=>x.textContent.includes(text)),{},text);
async function save() { await page.locator('[data-testid="save-product-draft"]').click();await status('草稿已保存'); }
async function publish(mode = "product") {
  await page.locator(`[data-publication-mode="${mode}"]`).click();
  if (mode === "software") await page.locator(`[data-testid="confirm-software-publication"]`).click();
  await page.locator(`[data-testid="publish-${mode === "software" ? "software" : "product"}"]`).click();await status('已发布');
}

async function tab(name) { await page.locator(`[data-tab="${name}"]`).click(); }
async function createVersion(version) {
  await tab('versions');
  await page.$eval('[data-testid="new-product-release"]', node => { node.open = true; });
  const form='[data-testid="new-product-release"] [data-testid="release-details-form"]';
  await fillForm(form,{version,channel:'stable',title_zh:'软件 '+version,notes_zh:'独立版本说明'});
  report.stage='save-version-'+version;
  const savedResponse=page.waitForResponse(r=>r.request().method()==='POST' && r.url().startsWith(base+'/admin/'));
  await page.locator(form+' button[type="submit"]').click();
  await savedResponse;
  await page.waitForFunction(() => location.search.includes('saved=1'));
  const r=(await catalog()).releases.find(r=>r.version===version);
  assert.ok(r); await page.waitForSelector(`#release-${r.id}[open]`); report.stage='version-visible-'+version; return r;
}
async function uploadPackage(r, name) {
  report.stage='upload-package-'+name;
  const bytes=Buffer.from('Isolated browser package '+name), file=path.join(temporary,name);
  await writeFile(file,bytes);
  const form=`#release-${r.id} [data-testid="artifact-upload"] form`;
  await(await page.$(form+' input[type="file"]')).uploadFile(file);
  await page.waitForSelector(form+' input[name="platform"]');
  await fillForm(form,{platform:'chrome',architecture:'universal',package_kind:'zip'});
  await page.$eval(form,f=>f.requestSubmit()); await status('上传完成');
  await page.waitForFunction(id=>!document.querySelector(`[data-preview-release="${id}"]`).disabled,{},r.id);
  const a=(await catalog()).releases.find(x=>x.id===r.id).release_artifacts[0];return {a,bytes};
}
try {
  const original={id:'independent-fixture',slug:'independent-tool',category_slug:'developer-tools',status:'beta',visibility:'published',name_zh:'公开商品标题',name_en:'Public product',tagline_zh:'公开商品简介',tagline_en:'Public tagline',description_zh:'公开商品介绍',description_en:'Public description',icon_url:'/x-tweet-extractor/store-logo-128.png',hero_image_url:'/x-tweet-extractor/promo440x280.png',gallery_urls:[],videos:[],supported_platforms:['Chrome'],featured:false};
  await writeFile(path.join(storage,'catalog.json'),JSON.stringify({schemaVersion:1,updatedAt:new Date().toISOString(),products:[original],releases:[]}));
  await start();
  assert.match(await(await fetch(base+'/admin/products/independent-tool')).text(),/admin-access-notice/);
  const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser=await puppeteer.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{}),args:['--disable-background-networking']});
  page=await browser.newPage();page.setDefaultTimeout(25000);await page.setViewport({width:1440,height:1050});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.setRequestInterception(true);
  page.on('request',request=>request.url().startsWith(base)||/^(data:|blob:)/.test(request.url())?request.continue():request.abort());
  await browser.setCookie({name:'next-auth.session-token',value:await encode({secret,token:{sub:subject,casdoorSubject:subject,casdoorIssuer:issuer},maxAge:3600}),domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Lax'});
  const editor=base+'/admin/products/independent-tool';
  await page.goto(editor,{waitUntil:'networkidle0'});
  await controlled('input[name="name_zh"]','未准备好的资料草稿');await controlled('textarea[name="description_zh"]','');await save();
  const savedDraft=(await catalog()).productDrafts[original.slug];
  const r=await createVersion('1.0.0'); const first=await uploadPackage(r,'isolated-one.zip');
  assert.equal((await fetch(base+first.a.public_path)).status,404);
  assert.deepEqual((await catalog()).productDrafts[original.slug],savedDraft);
  check('incomplete product copy does not prevent creating a software version or uploading its private package');

  await tab('details');await controlled('input[name="name_zh"]','尚未保存的商品编辑');
  await tab('versions');const rform=`#release-${r.id} [data-testid="release-details-form"]`;
  await fillForm(rform,{title_zh:'只保存软件版本，不保存商品'});
  const response=page.waitForResponse(r=>r.request().method()==='POST' && r.url().startsWith(base+'/admin/'));
  await page.locator(rform+' button[type="submit"]').click();await response;
  await page.waitForFunction(id=>!document.querySelector(`#release-${id} [data-testid="release-details-form"] fieldset`).disabled,{},r.id);
  assert.equal(await page.$eval('input[name="name_zh"]',e=>e.value),'尚未保存的商品编辑');
  assert.equal((await catalog()).productDrafts[original.slug].product.name_zh,'未准备好的资料草稿');
  check('saving version changes preserves unsaved product fields across the in-place save');

  await page.locator(`[data-preview-release="${r.id}"]`).click();
  await page.waitForSelector('[data-publication-scope="software"]');
  assert.equal(await page.$('[data-testid="product-publication-issues"]'),null);
  if (!(await page.$eval('[data-testid="preview-disclosure"]', e=>e.open))) await page.locator('[data-testid="preview-disclosure"] > summary').click();
  await page.waitForSelector('[data-testid="product-preview"] .product-detail-grid', {visible:true});
  const preview=await page.$eval('[data-testid="product-preview"]',e=>e.textContent);
  assert.match(preview,/公开商品标题/);assert.doesNotMatch(preview,/尚未保存|未准备好/);
  assert.equal(await page.$eval('[data-testid="confirm-software-publication"]',e=>e.disabled),false);
  await shot('software-publication-desktop.png');
  const beforeSoftware=await catalog();await publish('software');
  const softwareResult=await catalog();assert.deepEqual(softwareResult.products,beforeSoftware.products);assert.deepEqual(softwareResult.productDrafts,beforeSoftware.productDrafts);
  assert.equal(softwareResult.releases.find(x=>x.id===r.id).status,'published');
  assert.equal(await page.$eval('input[name="name_zh"]',e=>e.value),'尚未保存的商品编辑');
  const publicPage=await(await fetch(base+'/zh/products/'+original.slug)).text();assert.match(publicPage,/公开商品标题/);assert.doesNotMatch(publicPage,/未准备好的资料草稿|尚未保存的商品编辑/);
  assert.equal((await fetch(base+first.a.public_path)).status,200);
  check('software-only preview and publication use public product content while saved and unsaved product drafts remain untouched');

  await tab('details');await controlled('input[name="name_zh"]','新的商品介绍已准备');await controlled('textarea[name="description_zh"]','完善后的商品介绍');await save();
  await tab('versions');await page.$eval('[data-testid="new-product-release"]',e=>{e.open=true;});
  const newForm='[data-testid="new-product-release"] [data-testid="release-details-form"]';
  await fillForm(newForm,{version:'2.0.0',title_zh:'未保存的软件草稿'});
  // Return to the workspace toolbar before a real pointer click. Auto-scrolling
  // to a toolbar at the viewport edge can otherwise hit the global sticky nav.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() => document.querySelector('[data-preview-product]').getBoundingClientRect().top >= 56);
  await page.locator('[data-preview-product]').click();
  await page.waitForSelector('[data-publication-scope="product"]');
  assert.equal(await page.$eval('[data-testid="publish-product"]',e=>e.disabled),false);
  const beforeProduct=(await catalog()).releases;
  await shot('product-publication-desktop.png');await publish('product');
  assert.deepEqual((await catalog()).releases,beforeProduct);
  assert.equal((await catalog()).products[0].name_zh,'新的商品介绍已准备');
  await tab('versions');assert.equal(await page.$eval(newForm+' input[name="title_zh"]',e=>e.value),'未保存的软件草稿');
  check('product publication is not blocked by unsaved software fields and does not publish, reset or discard them');

  await page.goto(editor+'?tab=versions',{waitUntil:'networkidle0'});
  const second=await createVersion('2.0.0');const uploaded=await uploadPackage(second,'isolated-two.zip');
  const disk=path.join(storage,uploaded.a.storage_path);await writeFile(disk,'tampered software');
  const snapshot=await catalog();await page.locator(`[data-preview-release="${second.id}"]`).click();
  await page.locator('[data-testid="confirm-software-publication"]').click();await page.locator('[data-testid="publish-software"]').click();
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('[role="alert"]')).some(e=>e.textContent.includes('校验失败')));
  assert.deepEqual(await catalog(),snapshot);assert.equal(await page.$eval('[data-testid="confirm-software-publication"]',e=>e.checked),false);
  await writeFile(disk,uploaded.bytes);await publish('software');
  assert.equal((await catalog()).releases.find(x=>x.id===second.id).status,'published');
  assert.deepEqual((await catalog()).products,snapshot.products);
  check('software hash failure changes neither stream, clears confirmation, and a separately confirmed retry succeeds');

  await page.setViewport({width:390,height:844});await tab('preview');
  await page.locator('[data-publication-mode="product"]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot('independent-publication-mobile.png');
  await page.locator('[data-publication-mode="software"]').click(); if (!(await page.$eval('[data-testid="preview-disclosure"]', e => e.open))) await page.locator('[data-testid="preview-disclosure"] > summary').click();assert.equal(await page.$eval('[data-testid="publish-software"]',e=>e.disabled),true);
  await stop();await start();
  await page.goto(base+'/zh/products/'+original.slug,{waitUntil:'networkidle0'});
  assert.match(await page.$eval('h1',e=>e.textContent),/新的商品介绍已准备/);
  assert.equal((await fetch(base+uploaded.a.public_path,{method:'HEAD'})).status,200);
  assert.equal((await fetch(base+first.a.public_path,{headers:{range:'bytes=0-4'}})).status,206);
  assert.deepEqual(errors,[]);
  check('both publication modes fit mobile and independently published metadata, current and historical packages survive restart');
  report.status='passed';
} catch(error) {
  report.status='failed';report.error=error.stack;process.exitCode=1;if(page)await shot('failure.png').catch(()=>{});
} finally {
  await browser?.close().catch(()=>{});await stop();await rm(temporary,{recursive:true,force:true});
  await writeFile(path.join(output,'result.json'),JSON.stringify(report,null,2)+'\n');
  if(report.status==='failed')await writeFile(path.join(output,'server.log'),serverLog);
  // End this CLI after flushing the finished report, not while checks are pending.
  process.stdout.write(JSON.stringify({...report,output},null,2)+'\n',()=>process.exit(report.status==='passed'?0:1));
}
