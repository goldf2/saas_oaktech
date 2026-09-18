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
const temporary = await mkdtemp(path.join(os.tmpdir(), 'oaktech-workspace-ui-'));
const storage = path.join(temporary, 'releases');
const output = process.env.STORE_VERIFY_OUTPUT || await mkdtemp(path.join(os.tmpdir(), 'oaktech-workspace-ui-results-'));
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
async function save() { await page.click('[data-testid="save-product-draft"]');await status('草稿已保存'); }
async function publish() {
  await page.click('[data-testid="confirm-product-publication"]');
  await page.click('[data-testid="publish-product"]');await status('已发布');
}

try {
  const original={id:'existing-fixture',slug:'existing-tool',category_slug:'browser-extensions',status:'beta',visibility:'published',name_zh:'原有商品',name_en:'Existing product',tagline_zh:'原有公开介绍',tagline_en:'Existing tagline',description_zh:'原有详情',description_en:'Existing details',icon_url:'/x-tweet-extractor/store-logo-128.png',hero_image_url:'/x-tweet-extractor/promo440x280.png',gallery_urls:[],supported_platforms:['Chrome'],featured:false};
  await writeFile(path.join(storage,'catalog.json'),JSON.stringify({schemaVersion:1,updatedAt:new Date().toISOString(),products:[original],releases:[]}));
  await start();
  for(const route of ['/admin','/admin/products','/admin/products/new','/admin/products/existing-tool','/admin/releases']) {
    const response=await fetch(base+route);assert.equal(response.status,200);assert.match(await response.text(),/admin-access-notice/);
  }
  assert.equal((await fetch(`${base}/api/admin/releases/import`,{method:'POST',body:'{}'})).status,401);
  const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser=await puppeteer.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{}),args:['--disable-background-networking']});
  page=await browser.newPage();page.setDefaultTimeout(25000);await page.setViewport({width:1440,height:1000});
  page.on('dialog', async dialog => { report.confirmedNavigationDialogs=(report.confirmedNavigationDialogs??0)+1; await dialog.accept(); });
  const errors=[],offsets=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request',request=>{
    if(request.url().startsWith(base+'/api/admin/releases/upload?'))offsets.push(Number(new URL(request.url()).searchParams.get('offset')));
    if(request.url().startsWith(base)||/^(data:|blob:)/.test(request.url()))request.continue();else request.abort();
  });
  const setSession=async user=>browser.setCookie({name:'next-auth.session-token',value:await encode({secret,token:{sub:user,casdoorSubject:user,casdoorIssuer:issuer},maxAge:3600}),domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Lax'});
  await setSession('ordinary-test-account');
  await page.goto(base+'/admin/products/new',{waitUntil:'networkidle0'});
  assert.match(await page.$eval('h1',x=>x.textContent),/没有商品管理权限/);
  assert.equal(await page.$('[data-testid="product-workspace"]'),null);
  assert.equal(await page.evaluate(async()=>(await fetch('/api/admin/products/existing-tool/media',{method:'POST',headers:{'x-oaktech-product-upload':'1'},body:'not an image'})).status),403);
  check('anonymous and ordinary users cannot edit, upload, publish or import');

  await setSession(subject);await page.goto(base+'/admin',{waitUntil:'networkidle0'});
  await page.waitForSelector('[data-testid="product-management"]');
  assert.equal(await page.$('main a[href="/admin/releases"]'),null);
  await shot('product-management-desktop.png');
  await page.click('[data-testid="product-management"] a[href="/admin/products/new"]');
  await page.waitForSelector('[data-testid="product-workspace"]');
  assert.equal((await page.$$('[data-tab]')).length,3);
  check('administration has one product list; Add product enters the same three-section editor');

  const slug='new-workspace-tool',editor=base+'/admin/products/'+slug;
  await controlled('input[name="name_zh"]','新建工作台商品');await controlled('input[name="slug"]',slug);
  await page.click('[data-testid="save-product-draft"]');
  await page.waitForFunction(slug=>location.pathname===`/admin/products/${slug}`,{},slug);
  await page.waitForSelector('[data-upload="icon_url"]');
  let data=await catalog();const created=data.products.find(p=>p.slug===slug);
  assert.ok(created.id);assert.equal(created.visibility,'draft');assert.equal(data.productDrafts[slug].product.icon_url,'');
  assert.equal((await fetch(`${base}/zh/products/${slug}`)).status,404);
  assert.equal(await page.$('[data-testid="product-workspace"] img'),null);
  check('minimal new product saves a private draft and stays in its workspace without another product image');

  await page.goto(base+'/admin/products/new',{waitUntil:'networkidle0'});
  await controlled('input[name="name_zh"]','不得覆盖');await controlled('input[name="slug"]',slug);
  await page.click('[data-testid="save-product-draft"]');
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('[role="alert"]')).some(x=>x.textContent.includes('已存在')));
  assert.equal(await page.$eval('input[name="slug"]',x=>x.value),slug);
  assert.equal((await catalog()).products.find(p=>p.slug===slug).id,created.id);
  await page.goto(base+'/admin/products?q='+slug,{waitUntil:'networkidle0'});
  assert.equal((await page.$$('[data-product-slug]')).length,1);
  await page.click(`[data-product-slug="${slug}"] a[href="/admin/products/${slug}"]`);
  await page.waitForSelector('[data-tab="details"]');
  check('duplicate creation is rejected with retained inputs; list search returns the correct workspace');

  await controlled('input[name="tagline_zh"]','在商品内完成图文、版本和预览发布');
  await controlled('textarea[name="description_zh"]','第一段：商品介绍。\n第二段：图文与软件版本统一管理。\n<script>window.workspaceXss=1</script>');
  await page.click('[data-tab="details"]');await page.click('[data-tab="details"]');
  assert.match(await page.$eval('textarea[name="description_zh"]',x=>x.value),/第二段/);
  await save();assert.deepEqual((await catalog()).products.find(p=>p.slug==='existing-tool'),original);
  check('switching sections retains edits; saving new content neither publishes it nor alters another product');

  const files={};
  for(const [name,width,height,r,g,b] of [['icon',128,128,18,120,105],['cover',1200,700,28,80,145],['screen1',800,500,200,110,45],['screen2',800,500,80,120,160]]) {
    files[name]=path.join(temporary,name+'.png');await sharp({create:{width,height,channels:3,background:{r,g,b}}}).png().toFile(files[name]);
  }
  await page.click('[data-tab="details"]');const urls=[];
  for(const [field,file] of [['icon_url','icon'],['hero_image_url','cover'],['gallery_urls','screen1'],['gallery_urls','screen2']]) {
    const before=(await catalog()).productMedia?.length??0;
    await (await page.$(`[data-upload="${field}"]`)).uploadFile(files[file]);
    await status('图片已上传');await page.waitForFunction(()=>!document.querySelector('[data-testid="save-product-draft"]').disabled);
    const items=(await catalog()).productMedia;assert.equal(items.length,before+1);const url=items.at(-1).url;urls.push(url);
    assert.equal((await fetch(base+url)).status,404);
    assert.equal(await page.evaluate(async url=>(await fetch(url)).status,url),200);
  }
  await page.click('[aria-label="截图2前移"]');await save();
  assert.deepEqual((await catalog()).productDrafts[slug].product.gallery_urls,[urls[3],urls[2]]);
  await shot('workspace-media-desktop.png');
  check('real file selection uploads icon, cover and screenshots; ordering persists while all new images stay private');

  await page.click('[data-tab="versions"]');
  await page.$eval('[data-testid="new-product-release"]',x=>{x.open=true;});
  await page.click('[data-testid="new-product-release"] [data-testid="release-reuse-chinese"]');
  await fillForm('[data-testid="new-product-release"] form',{version:'1.0.0',channel:'stable',title_zh:'工作台版本',notes_zh:'验证商品内的版本和文件',title_en:'Workspace version',notes_en:'Verify product-scoped files'});
  await page.$eval('[data-testid="new-product-release"] form',x=>x.requestSubmit());
  await page.waitForFunction(slug=>location.pathname===`/admin/products/${slug}` && location.search.includes('saved=1') && location.search.includes('tab=versions'),{},slug);
  const release=(await catalog()).releases.find(r=>r.product_slug===slug);
  report.releaseSaveLanding=new URL(page.url()).pathname;
  await page.waitForSelector(`#release-${release.id}[open]`);
  const uploadForm=`#release-${release.id} form:has(input[type="file"])`;
  const bytes=Buffer.alloc(9*1024*1024,90),packagePath=path.join(temporary,'fixture.zip');await writeFile(packagePath,bytes);
  await(await page.$(`${uploadForm} input[type="file"]`)).uploadFile(packagePath);
  await page.waitForSelector(`${uploadForm} input[name="platform"]`);
  await fillForm(uploadForm,{platform:'chrome',architecture:'universal',package_kind:'zip'});
  await page.$eval(uploadForm,x=>x.requestSubmit());
  await status('上传完成');
  await page.waitForFunction(id=>document.getElementById(`release-${id}`)?.textContent.includes('fixture.zip'),{},release.id);
  const artifact=(await catalog()).releases.find(r=>r.id===release.id).release_artifacts[0];
  assert.deepEqual(offsets,[0,8*1024*1024]);assert.equal(artifact.sha512,createHash('sha512').update(bytes).digest('hex'));
  assert.equal((await fetch(base+artifact.public_path)).status,404);await shot('workspace-versions-desktop.png');
  check('version save returns automatically to this product; embedded 8+1 MiB upload remains a private version draft');

  await page.waitForFunction(()=>!document.querySelector('[data-tab="preview"]').disabled);
  await page.click('[data-tab="preview"]');await page.click(`[data-release-select="${release.id}"]`);
  if (!(await page.$eval('[data-testid="preview-disclosure"]', el => el.open))) await page.click('[data-testid="preview-disclosure"] > summary');
  await page.waitForSelector('[data-testid="product-preview"] .product-detail-grid', { visible: true });
  assert.equal(await page.$('[data-testid="product-preview"] a[download]'),null);
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>x.textContent==='手机宽度').click());
  await page.waitForFunction(()=>{
    const canvas=document.querySelector('[data-testid="product-preview"]');
    const grid=canvas?.querySelector('.product-detail-grid');
    return canvas?.getBoundingClientRect().width<=390 && grid && getComputedStyle(grid).gridTemplateColumns.split(' ').length===1;
  });
  assert.ok(await page.$eval('[data-testid="product-preview"]',x=>x.scrollWidth<=x.clientWidth+1));
  await shot('workspace-phone-preview.png');
  await page.evaluate(()=>Array.from(document.querySelectorAll('button')).find(x=>x.textContent==='桌面宽度').click());
  await shot('workspace-preview-desktop.png');
  assert.equal(await page.evaluate(()=>window.workspaceXss),undefined);
  check('preview uses the shared product page and a genuinely responsive phone-width canvas without draft downloads');

  await publish();data=await catalog();
  assert.equal(data.products.find(p=>p.slug===slug).visibility,'published');assert.equal(data.releases.find(r=>r.id===release.id).status,'published');
  assert.equal(data.productDrafts[slug],undefined);assert.deepEqual(data.products.find(p=>p.slug==='existing-tool'),original);
  for(const url of urls)assert.equal((await fetch(base+url)).status,200);
  const download=await fetch(base+artifact.public_path);assert.equal(download.status,200);
  assert.equal(createHash('sha512').update(Buffer.from(await download.arrayBuffer())).digest('hex'),artifact.sha512);
  const range=await fetch(base+artifact.public_path,{headers:{Range:'bytes=0-63'}});assert.equal(range.status,206);assert.equal((await range.arrayBuffer()).byteLength,64);
  const head=await fetch(base+artifact.public_path,{method:'HEAD'});assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),String(bytes.length));
  check('one explicit publish promotes this product and its selected version; public media and GET/HEAD/Range downloads work');

  await page.click('[data-tab="details"]');await controlled('input[name="name_zh"]','尚未发布的新名称');await save();
  const live=await(await fetch(`${base}/zh/products/${slug}`)).text();assert.match(live,/新建工作台商品/);assert.doesNotMatch(live,/尚未发布的新名称/);
  const beforeReleases=(await catalog()).releases;
  await page.click('[data-tab="preview"]');await publish();
  assert.deepEqual((await catalog()).releases,beforeReleases);
  assert.match(await(await fetch(`${base}/zh/products/${slug}`)).text(),/尚未发布的新名称/);
  check('editing an already-live product stays private until metadata-only confirmation, without changing its published versions');

  await page.goto(`${base}/admin/releases?release=${release.id}`,{waitUntil:'networkidle0'});
  assert.equal(new URL(page.url()).pathname,`/admin/products/${slug}`);assert.ok(new URL(page.url()).searchParams.get('tab')==='versions');
  await page.goto(base+'/admin/releases',{waitUntil:'networkidle0'});assert.equal(new URL(page.url()).pathname,'/admin/products');
  await page.goto(base+'/dashboard',{waitUntil:'networkidle0'});await page.waitForSelector(`a[href="/zh/products/${slug}"]`);
  check('old global release links forward safely to product context, and published products appear in the personal catalog');

  await stop();await start();
  await page.setViewport({width:390,height:844});await page.goto(editor+'?tab=media',{waitUntil:'networkidle0'});
  await page.waitForSelector('[data-upload="icon_url"]');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await shot('workspace-media-mobile.png');
  await page.goto(`${base}/zh/products/${slug}`,{waitUntil:'networkidle0'});
  await page.waitForSelector('section[aria-label="产品截图"] img');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.equal(await page.evaluate(()=>window.workspaceXss),undefined);
  await shot('workspace-published-mobile.png');
  assert.equal((await fetch(base+urls[0])).status,200);assert.equal((await fetch(base+artifact.public_path,{method:'HEAD'})).status,200);
  assert.deepEqual(errors,[]);
  check('a real service restart preserves content, media and downloads; 390px editor/storefront have no overflow or runtime errors');
  report.status='passed';
} catch(error) {
  report.status='failed';report.error=error.stack;process.exitCode=1;
  if(page)await shot('failure.png').catch(()=>{});
} finally {
  await browser?.close().catch(()=>{});await stop();await rm(temporary,{recursive:true,force:true});
  await writeFile(path.join(output,'result.json'),JSON.stringify(report,null,2)+'\n');
  if(report.status==='failed')await writeFile(path.join(output,'server.log'),serverLog);
  console.log(JSON.stringify({...report,output},null,2));
}
