// Real Chrome against a disposable local server/catalog. No production account or data writes.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';
const require=createRequire(import.meta.url),{encode}=require('next-auth/jwt');
const root=fileURLToPath(new URL('../',import.meta.url));
const temp=await mkdtemp(path.join(os.tmpdir(),'oaktech-unified-workspace-'));
const storage=path.join(temp,'releases');await mkdir(storage);
const output=process.env.STORE_VERIFY_OUTPUT||path.join(root,'.local-verification/unified-products/dashboard');await mkdir(output,{recursive:true});
const port=await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const base=`http://127.0.0.1:${port}`,secret=randomBytes(32).toString('hex'),issuer='http://127.0.0.1:9',subject='isolated-dashboard-admin';
const env={...process.env,NODE_ENV:'production',RELEASE_STORAGE_ROOT:storage,CASDOOR_AUTH_ENABLED:'true',CASDOOR_ISSUER:issuer,CASDOOR_CLIENT_ID:'isolated-dashboard',NEXTAUTH_URL:base,NEXTAUTH_SECRET:secret,OAKTECH_ADMIN_SUBJECTS:subject,OAKTECH_ADMIN_USER_IDS:'',OAKTECH_ADMIN_EMAILS:'',OAKTECH_RELEASE_WRITE_TOKEN:randomBytes(32).toString('hex'),BASE_URL:base};
const publicProduct={id:'public-product',slug:'public-tool',category_slug:'developer-tools',status:'beta',visibility:'published',name_zh:'公开商品',name_en:'Public product',tagline_zh:'原有公开内容',tagline_en:'Public copy',description_zh:'软件说明',description_en:'Software description',icon_url:'/x-tweet-extractor/store-logo-128.png',hero_image_url:'/x-tweet-extractor/promo440x280.png',gallery_urls:[],videos:[],supported_platforms:['Chrome'],featured:false};
const privateProduct={...publicProduct,id:'private-product',slug:'private-tool',visibility:'draft',name_zh:'PRIVATE_DRAFT_SENTINEL',name_en:'PRIVATE_DRAFT_SENTINEL'};
const introProduct={...publicProduct,id:'intro-product',slug:'intro-tool',name_zh:'仅有介绍的商品',name_en:'Introduction only'};
const privateEdit={...publicProduct,name_zh:'EDIT_PRIVATE_SENTINEL',name_en:'EDIT_PRIVATE_SENTINEL',tagline_zh:'COPY_PRIVATE_SENTINEL',icon_url:'/x-tweet-extractor/store-logo-128.png?PRIVATE_IMAGE_SENTINEL=1'};
const bytes=Buffer.from('isolated downloadable software fixture');
const released={id:'published-release',product_slug:'public-tool',version:'1.0.0',channel:'stable',status:'published',is_current:true,published_at:'2026-09-01T00:00:00Z',title_zh:'已发布的软件',title_en:'Published software',notes_zh:'公开说明',notes_en:'Public release notes',release_artifacts:[{id:'public-file',release_id:'published-release',platform:'chrome',architecture:'universal',package_kind:'zip',file_name:'public.zip',storage_path:'public-tool/stable/1.0.0/public.zip',public_path:'/releases/public-tool/stable/1.0.0/public.zip',sha512:createHash('sha512').update(bytes).digest('hex'),size_bytes:bytes.length,content_type:'application/zip'}]};
const unpublished={...released,id:'draft-release',version:'99.0.0',status:'draft',published_at:null,title_zh:'RELEASE_PRIVATE_SENTINEL',release_artifacts:[{...released.release_artifacts[0],id:'private-file',release_id:'draft-release',file_name:'PRIVATE_PACKAGE_SENTINEL.zip',storage_path:'public-tool/stable/99.0.0/PRIVATE_PACKAGE_SENTINEL.zip',public_path:'/releases/public-tool/stable/99.0.0/PRIVATE_PACKAGE_SENTINEL.zip'}]};
for(const artifact of [...released.release_artifacts,...unpublished.release_artifacts]){const file=path.join(storage,artifact.storage_path);await mkdir(path.dirname(file),{recursive:true});await writeFile(file,bytes);}
const seed={schemaVersion:1,updatedAt:new Date().toISOString(),products:[publicProduct,privateProduct,introProduct],releases:[released,unpublished],productDrafts:{'public-tool':{revision:1,updatedAt:new Date().toISOString(),product:privateEdit}}};
await writeFile(path.join(storage,'catalog.json'),JSON.stringify(seed));
const report={version:require('../package.json').version,checks:[],screenshots:[],scope:'isolated temporary server/catalog and synthetic local sessions; no real accounts or production writes'};
const errors=[];let server,browser,page,logs='';
const pass=text=>{report.checks.push(text);console.log('PASS '+text);};
const shot=async name=>{await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});report.screenshots.push(name+'.png');};
async function goto(target){await page.goto(base+target,{waitUntil:'networkidle0'});}
try{
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd:root,env,stdio:['ignore','pipe','pipe']});
  for(const stream of [server.stdout,server.stderr])stream.on('data',b=>logs=(logs+b).slice(-15000));
  let ready=false;for(let i=0;i<160;i++){if(server.exitCode!==null)throw new Error(logs);if((await fetch(base+'/api/health').catch(()=>null))?.ok){ready=true;break;}await new Promise(r=>setTimeout(r,200));}assert.ok(ready);
  const anonymous=await fetch(base+'/dashboard',{redirect:'manual'});assert.equal(anonymous.status,307);assert.equal(anonymous.headers.get('location'),'/sign-in');
  for(const target of ['/admin','/admin/products','/admin/products/private-tool']){
    const html=await(await fetch(base+target)).text();assert.match(html,/admin-access-notice/);assert.doesNotMatch(html,/PRIVATE_DRAFT_SENTINEL/);
  }
  pass('anonymous access still requires login and old administrative paths expose no private product');
  const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser=await puppeteer.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{}),args:['--disable-background-networking']});
  page=await browser.newPage();page.setDefaultTimeout(25000);await page.setViewport({width:1440,height:900});page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);page.on('request',r=>{if(r.url().startsWith(base)||/^(data:|blob:)/.test(r.url()))r.continue();else r.abort();});
  const setUser=async user=>browser.setCookie({name:'next-auth.session-token',value:await encode({secret,token:{sub:user,casdoorSubject:user,casdoorIssuer:issuer},maxAge:3600}),domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Lax'});
  await setUser('isolated-ordinary-account');await goto('/dashboard');
  await page.waitForSelector('[data-workspace-role="user"] [data-testid="workspace-product-list"][data-list-access="public"]');
  assert.equal(await page.$('[data-testid="product-management"]'),null);
  assert.doesNotMatch(await page.content(),/PRIVATE_\w*SENTINEL|\w+_PRIVATE_SENTINEL/);
  assert.equal((await page.$$('[data-testid="workspace-navigation"] a')).length,2);assert.equal(await page.$('[data-testid="workspace-navigation"] a[href*="view=library"]'),null);assert.equal((await page.$$('[data-product-slug]')).length,2);
  await shot('ordinary-library');
  await goto('/dashboard?view=products&admin=true&state=draft');await page.waitForSelector('[data-testid="public-product-list"]');assert.equal((await page.$$('[data-product-slug]')).length,2);assert.equal(await page.$('select[name="state"]'),null);assert.doesNotMatch(await page.content(),/PRIVATE_\w*SENTINEL|\w+_PRIVATE_SENTINEL/);assert.equal(await page.$('[data-testid="product-management"]'),null);
  assert.equal(await page.evaluate(async()=> (await fetch('/api/admin/products/public-tool/media',{method:'POST',headers:{'x-oaktech-product-upload':'1'},body:'invalid'})).status),403);
  assert.doesNotMatch(await page.$eval('[data-testid="product-list-stats"]',e=>e.textContent),/草稿|待发布/);
  assert.equal((await page.$$('[data-product-download]')).length,1);
  assert.equal(await page.$('[data-product-slug="intro-tool"] [data-product-download]'),null);
  assert.equal((await fetch(base+unpublished.release_artifacts[0].public_path)).status,404);
  await page.click('[data-product-slug="public-tool"] [data-product-download]');await page.waitForSelector('#downloads');
  const response=await fetch(base+released.release_artifacts[0].public_path);assert.equal(response.status,200);assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);
  pass('one public list includes details and real downloads but exposes no management actions, private copy, packages or draft counts');
  await goto('/dashboard?view=products&state=draft&admin=true&q=EDIT_PRIVATE_SENTINEL');assert.equal((await page.$$('[data-product-slug]')).length,0);assert.doesNotMatch(await page.$eval('[data-testid="product-list-stats"]',e=>e.textContent),/草稿|待发布/);
  await goto('/dashboard?view=library&q=intro-tool');assert.equal(new URL(page.url()).searchParams.get('view'),'products');assert.equal(new URL(page.url()).searchParams.get('q'),'intro-tool');assert.equal((await page.$$('[data-product-slug]')).length,1);
  pass('legacy library links resolve to the single list, and forged filters cannot search private names or reveal hidden counts');
  await goto('/dashboard?view=account');await page.waitForSelector('[data-testid="workspace-account"]');assert.match(await page.$eval('[data-testid="workspace-account"]',n=>n.textContent),/普通用户/);assert.doesNotMatch(await page.$eval('[data-testid="workspace-account"]', n=>n.textContent),/isolated-ordinary-account/);
  pass('account and support remain accessible without exposing internal subjects or invented purchase totals');
  await setUser(subject);await goto('/dashboard');await page.waitForSelector('[data-workspace-role="admin"] [data-testid="product-management"]');
  assert.equal((await page.$$('[data-testid="product-management"] [data-product-slug]')).length,3);
  assert.match(await page.$eval('[data-testid="product-management"]',n=>n.textContent),/PRIVATE_DRAFT_SENTINEL/);
  assert.equal((await page.$$('[data-testid="workspace-entry"]')).length,1);assert.equal(await page.$('header a[href="/admin"]'),null);
  assert.equal((await page.$$('[data-testid="workspace-navigation"] a')).length,2);
  const card='[data-product-slug="public-tool"]';assert.equal(await page.$eval(card+' h3',e=>e.textContent),'EDIT_PRIVATE_SENTINEL');
  assert.match(await page.$eval(card,e=>e.textContent),/线上名称：公开商品/);
  assert.ok(await page.$(card+' a[href="/admin/products/public-tool"]'));
  assert.ok(await page.$(card+' a[href="/admin/products/public-tool?tab=versions"]'));
  assert.ok(await page.$(card+' a[href="/zh/products/public-tool"]'));
  assert.ok(await page.$(card+' [data-product-download]'));
  assert.equal(await page.$('[data-product-slug="private-tool"] a[href^="/zh/"]'),null);
  await shot('admin-workspace');
  await page.type('input[name="q"]','private-tool');await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('form[aria-label="筛选商品"] button[type="submit"]')]);
  assert.equal(new URL(page.url()).pathname,'/dashboard');assert.equal(new URL(page.url()).searchParams.get('view'),'products');assert.equal((await page.$$('[data-testid="product-management"] [data-product-slug]')).length,1);
  pass('administrators land directly in the shared product manager; filters remain inside the one workspace');
  await goto('/admin/products?q=public-tool&state=published');assert.equal(new URL(page.url()).pathname,'/dashboard');assert.equal(new URL(page.url()).searchParams.get('q'),'public-tool');assert.equal(new URL(page.url()).searchParams.get('state'),'published');
  await page.click('[data-product-slug="public-tool"] a[href="/admin/products/public-tool"]');await page.waitForSelector('[data-testid="product-workspace"]');
  assert.equal(await page.$eval('[data-testid="product-workspace"] a[href*="view=products"]',n=>n.getAttribute('href')),'/dashboard?view=products');
  await goto('/admin');assert.equal(new URL(page.url()).pathname,'/dashboard');
  pass('legacy product-list bookmarks preserve filters and editor links still lead back to the same workspace');
  await goto('/dashboard?view=library');assert.equal(new URL(page.url()).searchParams.get('view'),'products');assert.ok(await page.$('[data-testid="product-management"]'));assert.equal((await page.$$('[data-product-slug]')).length,3);
  await page.setViewport({width:390,height:844});await goto('/dashboard');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot('admin-mobile');
  await page.click('[data-testid="mobile-menu-trigger"]');await page.waitForSelector('[data-testid="mobile-workspace-entry"]',{visible:true});assert.equal((await page.$$('[data-testid="mobile-workspace-entry"]')).length,1);assert.equal(await page.$('[role="dialog"] a[href="/admin"]'),null);
  await page.locator('[data-testid="mobile-workspace-entry"]').click();await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'));
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}]);await shot('admin-mobile-dark');
  assert.deepEqual(errors,[]);pass('one responsive product list works at 390px with the single mobile workspace entry and dark mode');
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'light'}]);await shot('admin-mobile-light');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await setUser('isolated-ordinary-account');await goto('/dashboard');assert.equal(await page.$('[data-testid="product-management"]'),null);assert.doesNotMatch(await page.content(),/PRIVATE_\w*SENTINEL|\w+_PRIVATE_SENTINEL/);assert.equal((await page.$$('[data-product-slug]')).length,2);await shot('ordinary-mobile');
  assert.deepEqual(JSON.parse(await readFile(path.join(storage,'catalog.json'),'utf8')),seed);
  pass('a fresh ordinary-user request after admin use has no private state and browsing has not mutated any product or release');
  report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;if(page)await shot('failure').catch(()=>{});}
finally{
  await browser?.close().catch(()=>{});
  if(server&&server.exitCode===null)await new Promise(resolve=>{const t=setTimeout(()=>server.kill('SIGKILL'),8000);server.once('exit',()=>{clearTimeout(t);resolve();});server.kill('SIGTERM');});
  await rm(temp,{recursive:true,force:true});report.pageErrors=errors;
  // All browser/server cleanup and assertions have finished. Record idle resource types
  // and flush the CLI report before ending, so transport keep-alive handles cannot stall CI.
  report.cleanupResources=process.getActiveResourcesInfo();
  await writeFile(path.join(output,'result.json'),JSON.stringify(report,null,2)+'\n');
  if(report.status==='failed')await writeFile(path.join(output,'server.log'),logs);
  process.stdout.write(JSON.stringify({...report,output},null,2)+'\n',()=>process.exit(report.status==='passed'?0:1));
}
