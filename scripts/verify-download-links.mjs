// Isolated Chromium and disposable files only; never reads production credentials.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import puppeteer from 'puppeteer';
const require=createRequire(import.meta.url), {encode}=require('next-auth/jwt');
const root=fileURLToPath(new URL('../',import.meta.url));
const temp=await mkdtemp(path.join(os.tmpdir(),'oaktech-download-links-'));
const output=path.join(root,'.local-verification/download-links/browser');
await mkdir(output,{recursive:true});
const port=await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const base=`http://127.0.0.1:${port}`, secret=randomBytes(32).toString('hex'), subject='download-links-test-admin', issuer='http://127.0.0.1:9';
const env={...process.env,NODE_ENV:'production',RELEASE_STORAGE_ROOT:temp,CASDOOR_AUTH_ENABLED:'true',CASDOOR_ISSUER:issuer,CASDOOR_CLIENT_ID:'isolated',NEXTAUTH_URL:base,NEXTAUTH_SECRET:secret,BASE_URL:base,OAKTECH_ADMIN_SUBJECTS:subject,OAKTECH_ADMIN_USER_IDS:'',OAKTECH_ADMIN_EMAILS:''};
const product={id:'download-fixture',slug:'download-fixture',name_zh:'下载验证工具',name_en:'Download fixture',category_slug:'utility-tools',status:'released',visibility:'published',tagline_zh:'仅用于隔离验证',tagline_en:'Isolated fixture only',description_zh:'测试文件与真实软件无关。',description_en:'Test bytes, not a real software package.',icon_url:'/gitfinder-2/icon.png',hero_image_url:'/gitfinder-2/hero.svg',gallery_urls:[],videos:[],supported_platforms:['Windows'],featured:false,github_url:'https://github.com/example/project/releases'};
const bytes=Buffer.from('oaktech-isolated-download-test-bytes\n');
function release(version,status,current,name,kind){const id='release-'+version,relative=`download-fixture/stable/${version}/${name}`;return{id,product_slug:product.slug,version,channel:'stable',status,is_current:current,published_at:status==='published'?'2026-01-01T00:00:00Z':null,title_zh:'验证版本',title_en:'Fixture release',notes_zh:'隔离数据',notes_en:'Isolated data',release_artifacts:[{id:id+'-artifact',release_id:id,platform:'windows',architecture:'x64',package_kind:kind,file_name:name,storage_path:relative,public_path:'/releases/'+relative,size_bytes:bytes.length,sha512:createHash('sha512').update(bytes).digest('base64'),content_type:'application/zip'}]};}
const local=release('1.0.0','published',false,'fixture.zip','zip');
const metadata=release('2.0.0','published',true,'updates.json','manifest');
const draft=release('3.0.0','draft',true,'PRIVATE_SENTINEL.zip','zip');
const catalogFile=path.join(temp,'catalog.json');
const data={schemaVersion:1,updatedAt:new Date().toISOString(),products:[product,{...product,id:'open-play',slug:'open-play',github_url:undefined}],releases:[metadata,draft,local]};
await writeFile(catalogFile,JSON.stringify(data));
for(const release of data.releases){const artifact=release.release_artifacts[0];const target=path.join(temp,artifact.storage_path);await mkdir(path.dirname(target),{recursive:true});await writeFile(target,bytes);}
let server,browser,page,logs='';const errors=[];
const report={version:require('../package.json').version,checks:[],productionWrites:false,scope:'Disposable loopback catalog; synthetic local session only. Does not install or publish software.'};
const pass=message=>{report.checks.push(message);console.log('PASS '+message);};
const request=(url,options={})=>fetch(base+url,{signal:AbortSignal.timeout(15000),...options});
async function goto(route){await page.goto(base+route,{waitUntil:'networkidle0'});await page.waitForSelector('main h1');}
async function click(selector){await page.waitForSelector(selector,{visible:true});await page.$eval(selector,e=>e.scrollIntoView({block:'center',behavior:'instant'}));await page.locator(selector).click();}
async function fill(selector,value){await page.$eval(selector,(e,v)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));},value);}
try{
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd:root,env,stdio:['ignore','pipe','pipe']});
  for(const stream of [server.stdout,server.stderr])stream.on('data',b=>logs=(logs+b).slice(-20000));
  let ready=false;for(let i=0;i<100;i++){if(server.exitCode!==null)throw new Error(logs);if((await request('/api/health').catch(()=>null))?.ok){ready=true;break;}await new Promise(r=>setTimeout(r,200));}assert.ok(ready);
  const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser=await puppeteer.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{}),args:['--disable-background-networking']});
  await browser.defaultBrowserContext().overridePermissions(base,['clipboard-read','clipboard-write']);
  page=await browser.newPage();page.setDefaultTimeout(25000);page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.setRequestInterception(true);page.on('request',r=>{const u=new URL(r.url());return u.origin===base||['data:','blob:'].includes(u.protocol)?r.continue():r.abort();});
  for(const locale of ['zh','en']){
    for(const width of [1440,390,320]){
      await page.setViewport({width,height:960});await goto(`/${locale}/products/${product.slug}`);
      const hrefs=await page.$$eval('main a[download]',links=>links.map(a=>a.getAttribute('href')));
      assert.deepEqual(hrefs,[local.release_artifacts[0].public_path]);
      assert.doesNotMatch(await page.$eval('main',e=>e.textContent),/PRIVATE_SENTINEL|updates\.json/);
      assert.equal(await page.$eval('[data-testid="product-github-link"]',a=>a.href),product.github_url);
      assert.match(await page.$eval('[data-testid="app-downloads"]',e=>e.textContent),/1\.0\.0/);
      assert.equal(await page.$eval('[data-testid="download-address"] input',e=>e.value),base+local.release_artifacts[0].public_path);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      await page.screenshot({path:path.join(output,`${locale}-${width}.png`),fullPage:true});
      pass(`${locale} ${width}px: local installer, exact URL, GitHub source, no draft/metadata leak or overflow`);
    }
  }
  await click('[data-testid="download-address"] button');
  await page.waitForFunction(()=>/copied|manually/.test(document.querySelector('[data-testid="download-address"] [role="status"]')?.textContent ?? ''));
  const copyStatus=await page.$eval('[data-testid="download-address"] [role="status"]',e=>e.textContent);
  if(copyStatus.includes('copied')) {
    assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),base+local.release_artifacts[0].public_path);
    pass('copy button copies the complete first-party download URL');
  } else {
    assert.equal(await page.$eval('[data-testid="download-address"] input',e=>e.selectionEnd-e.selectionStart),(base+local.release_artifacts[0].public_path).length);
    pass('browser denies clipboard: the complete URL is selected and manual-copy feedback is truthful');
  }
  report.clipboardResult=copyStatus;
  const download=local.release_artifacts[0].public_path;
  const full=await request(download);assert.equal(full.status,200);assert.deepEqual(Buffer.from(await full.arrayBuffer()),bytes);
  assert.equal((await request(download,{method:'HEAD'})).status,200);
  const partial=await request(download,{headers:{Range:'bytes=0-7'}});assert.equal(partial.status,206);assert.deepEqual(Buffer.from(await partial.arrayBuffer()),bytes.subarray(0,8));
  assert.equal((await request(draft.release_artifacts[0].public_path)).status,404);
  pass('real bytes download, HEAD and byte ranges pass; even an existing private draft file returns 404');
  await goto('/zh/products/open-play');assert.equal(await page.$('main a[download]'),null);assert.match(await page.$eval('main',e=>e.textContent),/本站暂未提供安装包/);assert.equal(await page.$eval('[data-testid="product-github-link"]',e=>e.href),'https://github.com/goldf2/open-play-releases/releases');
  pass('missing local package keeps verified GitHub source but never invents a first-party installer');
  await browser.setCookie({name:'next-auth.session-token',value:await encode({secret,token:{sub:subject,casdoorSubject:subject,casdoorIssuer:issuer},maxAge:3600}),domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Lax'});
  await page.setViewport({width:1440,height:960});await goto('/admin/products/download-fixture');
  const next='https://github.com/example/changed/releases';await fill('input[name="github_url"]',next);await click('[data-testid="save-product-draft"]');
  await page.waitForFunction(()=>[...document.querySelectorAll('[role="status"]')].some(e=>e.textContent.includes('草稿已保存')));
  let persisted=JSON.parse(await readFile(catalogFile,'utf8'));assert.equal(persisted.products[0].github_url,product.github_url);assert.equal(persisted.productDrafts[product.slug].product.github_url,next);
  await goto('/admin/products/download-fixture');assert.equal(await page.$eval('input[name="github_url"]',e=>e.value),next);
  await click('[data-testid="prepare-product-publication"]');await page.waitForSelector('[data-testid="product-preview"] .app-product-title',{visible:true});
  assert.equal(await page.$('[data-testid="product-preview"] a[download]'),null);assert.equal(await page.$('[data-testid="product-preview"] [data-testid="product-github-link"]'),null);
  await click('[data-testid="publish-product"]');await page.waitForFunction(()=>[...document.querySelectorAll('[role="status"]')].some(e=>e.textContent.includes('商品资料已发布')));
  persisted=JSON.parse(await readFile(catalogFile,'utf8'));assert.equal(persisted.products[0].github_url,next);assert.deepEqual(persisted.releases,data.releases);
  await goto('/zh/products/download-fixture');assert.equal(await page.$eval('[data-testid="product-github-link"]',e=>e.href),next);
  pass('GitHub URL saves/reloads as private draft, explicit product publishing updates it without publishing software');
  await goto('/admin/products/download-fixture');await fill('input[name="github_url"]','');await click('[data-testid="save-product-draft"]');await page.waitForFunction(()=>[...document.querySelectorAll('[role="status"]')].some(e=>e.textContent.includes('草稿已保存')));
  await click('[data-testid="prepare-product-publication"]');await page.waitForSelector('[data-testid="product-preview"] .app-product-title',{visible:true});await click('[data-testid="publish-product"]');await page.waitForFunction(()=>[...document.querySelectorAll('[role="status"]')].some(e=>e.textContent.includes('商品资料已发布')));
  await goto('/zh/products/download-fixture');assert.equal(await page.$('[data-testid="product-github-link"]'),null);
  pass('explicitly clearing the URL removes the GitHub entry');
  assert.deepEqual(errors,[]);report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;if(page)await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});}
finally{
  await browser?.close().catch(()=>{});
  if(server&&server.exitCode===null)await new Promise(resolve=>{const timer=setTimeout(()=>server.kill('SIGKILL'),8000);server.once('exit',()=>{clearTimeout(timer);resolve();});server.kill('SIGTERM');});
  await rm(temp,{recursive:true,force:true});report.pageErrors=errors;await writeFile(path.join(output,'result.json'),JSON.stringify(report,null,2));await writeFile(path.join(output,'server.log'),logs);console.log(JSON.stringify(report,null,2));
}
