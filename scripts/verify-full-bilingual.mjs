// Full-site bilingual browser regression against disposable loopback data only.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
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
const temp=await mkdtemp(path.join(os.tmpdir(),'oaktech-bilingual-'));
const storage=path.join(temp,'releases'); await mkdir(storage);
const output=process.env.BILINGUAL_VERIFY_OUTPUT||path.join(root,'.local-verification/bilingual/browser'); await mkdir(output,{recursive:true});
const port=await new Promise((resolve,reject)=>{const s=net.createServer();s.once('error',reject);s.listen(0,'127.0.0.1',()=>{const p=s.address().port;s.close(()=>resolve(p));});});
const base=`http://127.0.0.1:${port}`, secret=randomBytes(32).toString('hex'), issuer='http://127.0.0.1:9', subject='bilingual-test-admin';
const env={...process.env,NODE_ENV:'production',RELEASE_STORAGE_ROOT:storage,CASDOOR_AUTH_ENABLED:'true',CASDOOR_ISSUER:issuer,CASDOOR_CLIENT_ID:'isolated',NEXTAUTH_URL:base,NEXTAUTH_SECRET:secret,BASE_URL:base,OAKTECH_ADMIN_SUBJECTS:subject,OAKTECH_ADMIN_USER_IDS:'',OAKTECH_ADMIN_EMAILS:''};
const product={id:'bilingual-open-play',slug:'open-play',category_slug:'utility-tools',status:'released',visibility:'published',name_zh:'双语 OpenPlay',name_en:'Bilingual OpenPlay',tagline_zh:'中文商品简介',tagline_en:'English product tagline',description_zh:'中文商品详细说明。',description_en:'English product description.',icon_url:'/open-play/icon.png',hero_image_url:'/open-play/hero.png',gallery_urls:[],videos:[],supported_platforms:['macOS','Windows'],featured:true};
await writeFile(path.join(storage,'catalog.json'),JSON.stringify({schemaVersion:1,updatedAt:new Date().toISOString(),products:[product],releases:[]}));
const report={version:require('../package.json').version,checks:[],routes:[],screenshots:[],productionWrites:false,scope:'Loopback only; disposable catalog; synthetic administrator session; no production writes.'};
let server,browser,page,logs=''; const pageErrors=[];
const pass=t=>{report.checks.push(t);console.log('PASS '+t);};
const shot=async name=>{await page.screenshot({path:path.join(output,name+'.png'),fullPage:true});report.screenshots.push(name+'.png');};
async function goto(route){report.stage=route;await page.goto(base+route,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.readyState==='complete');await page.waitForSelector('main',{visible:true});}
async function pref(locale){await browser.setCookie({name:'oaktech-language-preference',value:locale,domain:'127.0.0.1',path:'/',sameSite:'Lax'});}
async function body(){return page.$eval('main',e=>e.textContent.replace(/\s+/g,' ').trim());}
async function expect(route,locale,must,mustNot=[]){await pref(locale);await goto(route);const text=await body();for(const token of must)assert.match(text,new RegExp(token));for(const token of mustNot)assert.doesNotMatch(text,new RegExp(token));assert.equal(await page.$eval('html',e=>e.lang),locale==='zh'?'zh-CN':'en');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));report.routes.push({route,locale,url:new URL(page.url()).pathname});}

try{
  server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{cwd:root,env,stdio:['ignore','pipe','pipe']});
  for(const stream of [server.stdout,server.stderr])stream.on('data',b=>logs=(logs+b.toString()).slice(-24000));
  let ready=false;for(let i=0;i<120;i++){if(server.exitCode!==null)throw new Error(logs);if((await fetch(base+'/api/health',{signal:AbortSignal.timeout(3000)}).catch(()=>null))?.ok){ready=true;break;}await new Promise(r=>setTimeout(r,200));}assert.ok(ready);
  const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  browser=await puppeteer.launch({headless:true,...(existsSync(chrome)?{executablePath:chrome}:{}),args:['--disable-background-networking']});
  page=await browser.newPage();page.setDefaultTimeout(30000);page.on('pageerror',e=>pageErrors.push(e.message));page.on('dialog',d=>d.accept());await page.setViewport({width:1280,height:900});
  await page.setRequestInterception(true);page.on('request',r=>{const u=new URL(r.url());if(u.origin===base||/^(data|blob):/.test(u.protocol))return r.continue();return r.abort();});

  // Same-path public/account pages.
  const pairs=[
    ['/about',['关于 OakTech'],['About OakTech'],['About OakTech'],['关于 OakTech']],
    ['/support',['直接获取产品帮助'],['Get product help directly'],['Get product help directly'],['直接获取产品帮助']],
    ['/privacy',['隐私政策','信息用途'],['Privacy Policy','How We Use Information'],['Privacy Policy'],['隐私政策']],
    ['/terms',['服务条款','产品与许可'],['Terms of Service','Products and Licenses'],['Terms of Service'],['服务条款']],
    ['/sign-in',['欢迎回来','使用 OakTech 账号继续'],['Welcome back','Continue with OakTech account'],['Welcome back'],['欢迎回来']],
    ['/sign-up',['创建账号','创建 OakTech 账号'],['Create your account','Create OakTech account'],['Create your account'],['创建账号']],
    ['/forgot-password',['重置密码','发送重置链接'],['Reset password','Send reset link'],['Reset password'],['重置密码']],
    ['/products/x-tweet-extractor/install',['安装 X 推文提取器','开始之前'],['Install X Tweet Extractor','Before you start'],['Install X Tweet Extractor'],['开始之前']],
    ['/products/x-tweet-extractor/privacy',['X 推文提取器 隐私说明','本地处理'],['X Tweet Extractor privacy details','Local processing'],['Local processing'],['本地处理']],
    ['/products/x-tweet-extractor/support',['获取 X 推文提取器 帮助','请提供这些信息'],['Get help with X Tweet Extractor','Include these details'],['Include these details'],['请提供这些信息']],
  ];
  for(const [route,zhText,enText,enOnly,zhOnly] of pairs){await expect(route,'zh',zhText,enOnly);await expect(route,'en',enText,zhOnly);}
  pass('about, support, legal, authentication and product utility pages render Chinese and English on the same neutral routes');

  // Neutral catalog/product routes negotiate into localized counterparts.
  await pref('zh');await goto('/products');assert.equal(new URL(page.url()).pathname,'/zh');assert.match(await body(),/软件目录/);
  await pref('en');await goto('/products');assert.equal(new URL(page.url()).pathname,'/en');assert.match(await body(),/Explore apps/);
  await pref('zh');await goto('/products/open-play');assert.equal(new URL(page.url()).pathname,'/zh/products/open-play');assert.match(await body(),/双语 OpenPlay/);
  await pref('en');await goto('/products/open-play');assert.equal(new URL(page.url()).pathname,'/en/products/open-play');assert.match(await body(),/Bilingual OpenPlay/);
  await expect('/categories/utility-tools','zh',['实用工具'],['Utilities']);
  await expect('/categories/utility-tools','en',['Utilities'],['实用工具']);
  pass('neutral catalog, product and category routes resolve the selected language without pinned English data');

  // Manual switch on a neutral route keeps the URL while replacing server-rendered page copy.
  await pref('zh');await goto('/about');const beforePath=new URL(page.url()).pathname;await page.click('[data-language-choice="en"]');await page.waitForFunction(()=>document.querySelector('main')?.textContent.includes('About OakTech'));assert.equal(new URL(page.url()).pathname,beforePath);assert.equal(await page.$eval('html',e=>e.lang),'en');
  await page.click('[data-language-choice="zh"]');await page.waitForFunction(()=>document.querySelector('main')?.textContent.includes('关于 OakTech'));assert.equal(new URL(page.url()).pathname,beforePath);assert.equal(await page.$eval('html',e=>e.lang),'zh-CN');
  pass('manual language switching refreshes neutral routes in place and changes server-rendered copy');

  // Add a synthetic administrator session only after public/auth checks.
  await browser.setCookie({name:'next-auth.session-token',value:await encode({secret,token:{sub:subject,casdoorSubject:subject,casdoorIssuer:issuer},maxAge:3600}),domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Lax'});
  await pref('zh');await goto('/dashboard?view=account');let text=await body();assert.match(text,/工作台/);assert.match(text,/账号与支持/);assert.match(text,/商城管理员/);
  await pref('en');await goto('/dashboard?view=account');text=await body();assert.match(text,/Workspace/);assert.match(text,/Account & support/);assert.match(text,/Store administrator/);
  pass('dashboard account and navigation use the current Chinese or English language');

  await pref('zh');await goto('/admin/products/open-play');text=await body();for(const token of ['商品资料','软件版本','预览发布','基本资料','商品图片','视频介绍','详细说明'])assert.match(text,new RegExp(token));assert.doesNotMatch(text,/Basic information/);
  await pref('en');await goto('/admin/products/open-play');text=await body();for(const token of ['Product info','Software versions','Preview & publish'])assert.match(text,new RegExp(token));assert.equal(await page.$eval('[data-testid="product-copy-panel"] h2',e=>e.textContent.trim()),'Basic information');assert.equal(await page.$eval('[data-testid="product-media-panel"] h2',e=>e.textContent.trim()),'Product images');assert.match(await page.$eval('[data-testid="product-video-editor"] h2',e=>e.textContent),/Video introduction/);assert.equal(await page.$eval('[data-testid="product-description-panel"] h2',e=>e.textContent.trim()),'Detailed description');
  await page.click('[data-tab="versions"]');await page.waitForSelector('#panel-versions',{visible:true});text=await body();assert.match(text,/Add software version/);assert.match(text,/Release details/);assert.match(text,/Upload packages and update manifests/);
  await shot('admin-english');
  pass('product administration, version editor, upload workflow and publication controls expose English UI instead of fixed Chinese');

  await page.setViewport({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await shot('admin-english-mobile');
  await pref('zh');await page.reload({waitUntil:'domcontentloaded'});await page.waitForSelector('main');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(pageErrors,[]);
  report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;if(page)await shot('failure').catch(()=>{});}
finally{
  await browser?.close().catch(()=>{});
  if(server&&server.exitCode===null)await new Promise(resolve=>{const t=setTimeout(()=>server.kill('SIGKILL'),8000);server.once('exit',()=>{clearTimeout(t);resolve();});server.kill('SIGTERM');});
  await rm(temp,{recursive:true,force:true});report.pageErrors=pageErrors;await writeFile(path.join(output,'result.json'),JSON.stringify(report,null,2));if(report.status!=='passed')await writeFile(path.join(output,'server.log'),logs);process.stdout.write(JSON.stringify({...report,output},null,2)+'\n',()=>process.exit(report.status==='passed'?0:1));
}
