// Real browser tests against an isolated loopback store, never production credentials.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {existsSync} from 'node:fs';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import net from 'node:net';
import puppeteer from 'puppeteer';
const requestFetch=globalThis.fetch;
const fetch=(url,options={})=>requestFetch(url,{...options,signal:options.signal??AbortSignal.timeout(15000)});
const require=createRequire(import.meta.url),{encode}=require('next-auth/jwt');
const root=fileURLToPath(new URL('../',import.meta.url));
const temp=await mkdtemp(path.join(os.tmpdir(),'oaktech-language-')),storage=path.join(temp,'releases');
const output=process.env.STORE_VERIFY_OUTPUT||path.join(root,'.local-verification/language/browser');
await mkdir(storage);await mkdir(output,{recursive:true});
const port=await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const port=s.address().port;s.close(()=>resolve(port));});});
const base=`http://127.0.0.1:${port}`,secret=randomBytes(32).toString('hex'),subject='isolated-language-test',issuer='http://127.0.0.1:9';
const env={...process.env,NODE_ENV:'production',RELEASE_STORAGE_ROOT:storage,NEXTAUTH_URL:base,NEXTAUTH_SECRET:secret,BASE_URL:base,CASDOOR_AUTH_ENABLED:'true',CASDOOR_ISSUER:issuer,CASDOOR_CLIENT_ID:'isolated-language',OAKTECH_ADMIN_SUBJECTS:subject,OAKTECH_ADMIN_USER_IDS:'',OAKTECH_ADMIN_EMAILS:''};
const product={id:'language-test',slug:'language-tool',category_slug:'developer-tools',status:'beta',visibility:'published',name_zh:'语言测试商品',name_en:'Language test product',tagline_zh:'中文介绍',tagline_en:'English introduction',description_zh:'公开中文内容',description_en:'Public English copy',icon_url:'/x-tweet-extractor/store-logo-128.png',hero_image_url:'/x-tweet-extractor/promo440x280.png',gallery_urls:[],videos:[],supported_platforms:['Chrome'],featured:true};
const original=JSON.stringify({schemaVersion:1,updatedAt:new Date().toISOString(),products:[product],releases:[]});
await writeFile(path.join(storage,'catalog.json'),original);
const report={version:require('../package.json').version,checks:[],screenshots:[],scope:'Loopback server and disposable catalog; synthetic test session only; no production writes',limitations:['Repairs language negotiation and translated shared UI; not a translation of every legacy admin form or remote identity-provider screen.']};
let server,browser,page,logs='';const errors=[];
const pass=x=>{report.checks.push(x);console.log('PASS '+x);};
const shot=async name=>{await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});report.screenshots.push(name+'.png');};
const waitLocale=async locale=>{await page.waitForSelector(`[data-testid="language-switcher"][data-language="${locale}"]`);await page.waitForFunction(l=>document.documentElement.lang===(l==='zh'?'zh-CN':'en'),{},locale);};
async function go(route){await page.goto(base+route,{waitUntil:'networkidle0'});}
async function choose(value){await page.click(`[data-language-choice="${value}"]`);await new Promise(r=>setTimeout(r,800));}
try {
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd:root,env,stdio:['ignore','pipe','pipe']});
  for(const stream of [server.stdout,server.stderr])stream.on('data',b=>logs=(logs+b.toString()).slice(-16000));
  let ready=false;for(let i=0;i<180;i++){if(server.exitCode!==null)throw new Error(logs);if((await fetch(base+'/api/health').catch(()=>null))?.ok){ready=true;break;}await new Promise(r=>setTimeout(r,200));}assert.ok(ready);
  console.log('STAGE local server ready');
  for(const [accept,cookie,expected] of [['zh-CN,zh;q=0.9,en;q=0.5','','zh'],['en-US,en;q=0.9','','en'],['zh-TW','oaktech-locale=en','zh'],['zh-CN','oaktech-language-preference=en','en'],['en-US','oaktech-language-preference=zh','zh'],['zh-CN','oaktech-language-preference=auto','zh']]){
    report.stage='root negotiation '+accept+' => '+expected;
    const res=await fetch(base+'/',{redirect:'manual',headers:{'accept-language':accept,cookie}});
    assert.equal(res.status,307);assert.equal(new URL(res.headers.get('location'),base).pathname,'/'+expected);assert.equal(res.headers.get('set-cookie'),null);assert.match(res.headers.get('cache-control'),/no-store/);
  }
  report.stage='HTML prefetch headers';console.log('STAGE HTML prefetch');
  // An HTML speculative request must not carry half of Next's internal RSC protocol.
  // Both prefetch headers are separately exercised against the proxy in unit tests.
  const prefetch=await fetch(base+'/en',{headers:{'accept-language':'zh-CN',cookie:'oaktech-language-preference=zh','purpose':'prefetch'}});
  assert.equal(prefetch.headers.get('set-cookie'),null);await prefetch.body?.cancel();
  pass('HTTP negotiation respects browser priorities and explicit preference; legacy cookie and opposite-language prefetch cannot change automatic language');
  const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser=await puppeteer.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{}),args:['--disable-background-networking']});
  page=await browser.newPage();page.setDefaultTimeout(25000);await page.setViewport({width:1440,height:950});
  page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
  await page.setExtraHTTPHeaders({'accept-language':'zh-CN,zh;q=0.9,en;q=0.5'});
  await page.evaluateOnNewDocument(()=>{Object.defineProperty(navigator,'languages',{get:()=>['zh-CN','en-US']});Object.defineProperty(navigator,'language',{get:()=> 'zh-CN'});});
  await page.setRequestInterception(true);page.on('request',r=>r.url().startsWith(base)||/^(data:|blob:)/.test(r.url())?r.continue():r.abort());
  await browser.setCookie({name:'oaktech-locale',value:'en',domain:'127.0.0.1',path:'/'});
  await go('/');await waitLocale('zh');assert.equal(new URL(page.url()).pathname,'/zh');
  const cookies=await browser.cookies();assert.equal(cookies.find(c=>c.name==='oaktech-language-preference'),undefined);
  const html=await fetch(base+'/zh',{headers:{'accept-language':'en-US'}}).then(r=>r.text());assert.match(html,/<html[^>]*lang="zh-CN"/);
  pass('Chinese first visit recovers from the old English cookie; server HTML and visible shared UI use the same language without persisting auto detection');
  await go('/zh/products/language-tool?source=test#downloads');await waitLocale('zh');assert.equal(await page.$eval('h1',e=>e.textContent),'语言测试商品');
  await choose('en');await page.waitForFunction(()=>location.pathname==='/en/products/language-tool');await waitLocale('en');
  assert.equal(new URL(page.url()).search,'?source=test');assert.equal(new URL(page.url()).hash,'#downloads');assert.equal(await page.$eval('h1',e=>e.textContent),'Language test product');
  assert.equal((await browser.cookies()).find(c=>c.name==='oaktech-language-preference')?.value,'en');
  await go('/');await waitLocale('en');assert.equal(new URL(page.url()).pathname,'/en');
  await go('/zh/products/language-tool');await waitLocale('zh');assert.equal((await browser.cookies()).find(c=>c.name==='oaktech-language-preference')?.value,'en');
  pass('manual English persists while explicit Chinese links remain Chinese; product slug, query and anchor survive switching');
  await choose('auto');await waitLocale('zh');assert.equal((await browser.cookies()).find(c=>c.name==='oaktech-language-preference')?.value,'auto');
  await page.setExtraHTTPHeaders({'accept-language':'en-US,en;q=0.9'});await go('/');await waitLocale('en');assert.equal(new URL(page.url()).pathname,'/en');
  await page.setExtraHTTPHeaders({'accept-language':'zh-CN,zh;q=0.9,en;q=0.5'});await go('/products');await waitLocale('zh');assert.equal(new URL(page.url()).pathname,'/zh');
  pass('Auto resumes following browser requests; bare product catalog links negotiate instead of forcing English');
  await browser.setCookie({name:'next-auth.session-token',value:await encode({secret,token:{sub:subject,casdoorSubject:subject,casdoorIssuer:issuer},maxAge:3600}),domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Lax'});
  await go('/dashboard?view=products&q=language-tool#listing');await page.waitForSelector('[data-testid="product-management"]');await waitLocale('zh');
  assert.match(await page.$eval('header',e=>e.textContent),/工作台/);
  await choose('en');await waitLocale('en');assert.match(await page.$eval('header',e=>e.textContent),/Workspace/);
  assert.equal(new URL(page.url()).pathname,'/dashboard');assert.equal(new URL(page.url()).search,'?view=products&q=language-tool');assert.equal(new URL(page.url()).hash,'#listing');
  await page.reload({waitUntil:'networkidle0'});await waitLocale('en');
  await choose('zh');await waitLocale('zh');await shot('dashboard-chinese');
  pass('workspace navigation uses the selected language on direct loads and client updates; selection stays on the current filtered dashboard');
  await go('/admin/products/language-tool?tab=details');await page.waitForSelector('input[name="name_zh"]');
  await page.$eval('input[name="name_zh"]',e=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'UNSAVED_LANGUAGE_CHANGE');e.dispatchEvent(new Event('input',{bubbles:true}));});
  await choose('en');await waitLocale('en');await new Promise(r=>setTimeout(r,800));assert.equal(await page.$eval('input[name="name_zh"]',e=>e.value),'UNSAVED_LANGUAGE_CHANGE');
  assert.equal(new URL(page.url()).pathname,'/admin/products/language-tool');assert.equal(new URL(page.url()).search,'?tab=details');
  await choose('zh');await waitLocale('zh');assert.equal(await page.$eval('input[name="name_zh"]',e=>e.value),'UNSAVED_LANGUAGE_CHANGE');
  assert.equal(await readFile(path.join(storage,'catalog.json'),'utf8'),original);
  pass('switching in the editor retains unsaved controlled inputs and never saves/publishes product data or software');
  await go('/zh/products/language-tool');
  for(const width of [390,320]) {
    await page.setViewport({width,height:844});await page.waitForSelector('[data-testid="mobile-language-switcher"]',{visible:true});
    await page.select('[data-testid="mobile-language-switcher"]','en');await page.waitForFunction(()=>location.pathname==='/en/products/language-tool');await waitLocale('en');
    assert.ok(await page.$eval('header',e=>e.scrollWidth<=e.clientWidth+1),'header must fit small screens');
    await page.select('[data-testid="mobile-language-switcher"]','zh');await page.waitForFunction(()=>location.pathname==='/zh/products/language-tool');await waitLocale('zh');
    await shot('language-mobile-'+width);
  }
  pass('390px and 320px pages expose a working compact language selector without header overflow');
  const api=await fetch(base+'/api/health',{headers:{'accept-language':'zh-CN'}});assert.equal(api.headers.get('content-language'),null);
  const release=await fetch(base+'/releases/unknown',{redirect:'manual'});assert.equal(release.headers.get('location'),null);
  assert.deepEqual(errors,[]);report.status='passed';
} catch(error) { report.status='failed';report.error=error.stack;process.exitCode=1;if(page)await shot('failure').catch(()=>{}); }
finally {
  await browser?.close().catch(()=>{});
  if(server&&server.exitCode===null)await new Promise(resolve=>{const t=setTimeout(()=>server.kill('SIGKILL'),8000);server.once('exit',()=>{clearTimeout(t);resolve();});server.kill('SIGTERM');});
  await rm(temp,{recursive:true,force:true});report.pageErrors=errors;
  await writeFile(path.join(output,'result.json'),JSON.stringify(report,null,2)+'\n');if(report.status==='failed')await writeFile(path.join(output,'server.log'),logs);
  process.stdout.write(JSON.stringify({...report,output},null,2)+'\n',()=>process.exit(report.status==='passed'?0:1));
}
