// Real Chrome against a disposable local server/catalog. No production account or data writes.
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
const require=createRequire(import.meta.url),{encode}=require('next-auth/jwt');
const root=fileURLToPath(new URL('../',import.meta.url));
const temp=await mkdtemp(path.join(os.tmpdir(),'oaktech-unified-workspace-'));
const storage=path.join(temp,'releases');await mkdir(storage);
const output=process.env.STORE_VERIFY_OUTPUT||path.join(root,'.local-verification/integrated-workspace/dashboard');await mkdir(output,{recursive:true});
const port=await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const base=`http://127.0.0.1:${port}`,secret=randomBytes(32).toString('hex'),issuer='http://127.0.0.1:9',subject='isolated-dashboard-admin';
const env={...process.env,NODE_ENV:'production',RELEASE_STORAGE_ROOT:storage,CASDOOR_AUTH_ENABLED:'true',CASDOOR_ISSUER:issuer,CASDOOR_CLIENT_ID:'isolated-dashboard',NEXTAUTH_URL:base,NEXTAUTH_SECRET:secret,OAKTECH_ADMIN_SUBJECTS:subject,OAKTECH_ADMIN_USER_IDS:'',OAKTECH_ADMIN_EMAILS:'',OAKTECH_RELEASE_WRITE_TOKEN:randomBytes(32).toString('hex'),BASE_URL:base};
const publicProduct={id:'public-product',slug:'public-tool',category_slug:'developer-tools',status:'beta',visibility:'published',name_zh:'公开商品',name_en:'Public product',tagline_zh:'原有公开内容',tagline_en:'Public copy',description_zh:'软件说明',description_en:'Software description',icon_url:'/x-tweet-extractor/store-logo-128.png',hero_image_url:'/x-tweet-extractor/promo440x280.png',gallery_urls:[],videos:[],supported_platforms:['Chrome'],featured:false};
const privateProduct={...publicProduct,id:'private-product',slug:'private-tool',visibility:'draft',name_zh:'PRIVATE_DRAFT_SENTINEL',name_en:'PRIVATE_DRAFT_SENTINEL'};
await writeFile(path.join(storage,'catalog.json'),JSON.stringify({schemaVersion:1,updatedAt:new Date().toISOString(),products:[publicProduct,privateProduct],releases:[]}));
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
  await page.waitForSelector('[data-workspace-role="user"] [data-testid="workspace-library"]');
  assert.equal(await page.$('[data-testid="product-management"]'),null);
  assert.doesNotMatch(await page.content(),/PRIVATE_DRAFT_SENTINEL/);
  assert.equal(await page.$('[data-testid="workspace-navigation"] a[href*="view=products"]'),null);
  await shot('ordinary-library');
  await goto('/dashboard?view=products&admin=true');await page.waitForSelector('[data-testid="admin-access-notice"]');assert.doesNotMatch(await page.content(),/PRIVATE_DRAFT_SENTINEL/);assert.equal(await page.$('[data-testid="product-management"]'),null);
  assert.equal(await page.evaluate(async()=> (await fetch('/api/admin/products/public-tool/media',{method:'POST',headers:{'x-oaktech-product-upload':'1'},body:'invalid'})).status),403);
  pass('ordinary users see the public library only; forged view flags cannot read drafts or upload files');
  await goto('/dashboard?view=account');await page.waitForSelector('[data-testid="workspace-account"]');assert.match(await page.$eval('[data-testid="workspace-account"]',n=>n.textContent),/普通用户/);assert.doesNotMatch(await page.$eval('[data-testid="workspace-account"]', n=>n.textContent),/isolated-ordinary-account/);
  pass('account and support remain accessible without exposing internal subjects or invented purchase totals');
  await setUser(subject);await goto('/dashboard');await page.waitForSelector('[data-workspace-role="admin"] [data-testid="product-management"]');
  assert.equal((await page.$$('[data-testid="product-management"] [data-product-slug]')).length,2);
  assert.match(await page.$eval('[data-testid="product-management"]',n=>n.textContent),/PRIVATE_DRAFT_SENTINEL/);
  assert.equal((await page.$$('[data-testid="workspace-entry"]')).length,1);assert.equal(await page.$('header a[href="/admin"]'),null);
  await shot('admin-workspace');
  await page.type('input[name="q"]','private-tool');await Promise.all([page.waitForNavigation({waitUntil:'networkidle0'}),page.click('form[aria-label="筛选商品"] button[type="submit"]')]);
  assert.equal(new URL(page.url()).pathname,'/dashboard');assert.equal(new URL(page.url()).searchParams.get('view'),'products');assert.equal((await page.$$('[data-testid="product-management"] [data-product-slug]')).length,1);
  pass('administrators land directly in the shared product manager; filters remain inside the one workspace');
  await goto('/admin/products?q=public-tool&state=published');assert.equal(new URL(page.url()).pathname,'/dashboard');assert.equal(new URL(page.url()).searchParams.get('q'),'public-tool');assert.equal(new URL(page.url()).searchParams.get('state'),'published');
  await page.click('[data-product-slug="public-tool"] a[href="/admin/products/public-tool"]');await page.waitForSelector('[data-testid="product-workspace"]');
  assert.equal(await page.$eval('[data-testid="product-workspace"] a[href*="view=products"]',n=>n.getAttribute('href')),'/dashboard?view=products');
  await goto('/admin');assert.equal(new URL(page.url()).pathname,'/dashboard');
  pass('legacy product-list bookmarks preserve filters and editor links still lead back to the same workspace');
  await goto('/dashboard?view=library');assert.equal(await page.$('[data-testid="product-management"]'),null);assert.doesNotMatch(await page.content(),/PRIVATE_DRAFT_SENTINEL/);
  await page.setViewport({width:390,height:844});await goto('/dashboard');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot('admin-mobile');
  await page.click('[data-testid="mobile-menu-trigger"]');await page.waitForSelector('[data-testid="mobile-workspace-entry"]',{visible:true});assert.equal((await page.$$('[data-testid="mobile-workspace-entry"]')).length,1);assert.equal(await page.$('[role="dialog"] a[href="/admin"]'),null);
  await page.locator('[data-testid="mobile-workspace-entry"]').click();await page.waitForFunction(()=>!document.querySelector('[role="dialog"]'));
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}]);await shot('admin-mobile-dark');
  assert.deepEqual(errors,[]);pass('public-library view stays public for admins; 390px and dark-mode workspace and single mobile entry work');
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
