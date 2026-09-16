import './helpers/workspace-route-loader.mjs';
import assert from 'node:assert/strict';
import test, { before, beforeEach, afterEach } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import type { AdminStoreProductRow } from '../lib/store/types.ts';

let catalog: typeof import('../lib/store/file-catalog.ts');
let workspace: typeof import('../lib/store/product-workspace.ts');
let action: typeof import('../app/admin/products/editor-actions.ts');
let upload: typeof import('../app/api/admin/products/[slug]/media/route.ts');
let readImage: typeof import('../app/media/products/[slug]/[file]/route.ts');
let NextRequest: typeof import('next/server.js').NextRequest;
let root: string;
let png: Buffer;
const globals = globalThis as typeof globalThis & { __workspaceTestAdmin?: boolean };
const old = {root:process.env.RELEASE_STORAGE_ROOT,url:process.env.NEXTAUTH_URL};
before(async () => {
  catalog=await import('../lib/store/file-catalog.ts');
  workspace=await import('../lib/store/product-workspace.ts');
  action=await import('../app/admin/products/editor-actions.ts');
  upload=await import('../app/api/admin/products/[slug]/media/route.ts');
  readImage=await import('../app/media/products/[slug]/[file]/route.ts');
  ({NextRequest}=await import('next/server.js'));
  png=await sharp({create:{width:80,height:80,channels:3,background:'white'}}).png().toBuffer();
});
beforeEach(async () => {
  root=await mkdtemp(path.join(os.tmpdir(),'oaktech-workspace-http-'));
  process.env.RELEASE_STORAGE_ROOT=root; process.env.NEXTAUTH_URL='http://localhost';
  globals.__workspaceTestAdmin=true;
  await catalog.mutateStoreCatalog(()=>{});
});
afterEach(async () => {
  await rm(root,{recursive:true,force:true});
  if(old.root===undefined)delete process.env.RELEASE_STORAGE_ROOT;else process.env.RELEASE_STORAGE_ROOT=old.root;
  if(old.url===undefined)delete process.env.NEXTAUTH_URL;else process.env.NEXTAUTH_URL=old.url;
  delete globals.__workspaceTestAdmin;
});
const slug='x-tweet-extractor';
function request(options: {origin?:string;header?:boolean;body?:Buffer;declared?:string}={}) {
  const headers:Record<string,string>={'content-type':'image/png',origin:options.origin ?? 'http://localhost'};
  if(options.header!==false)headers['x-oaktech-product-upload']='1';
  if(options.declared)headers['content-length']=options.declared;
  return new NextRequest(`http://localhost/api/admin/products/${slug}/media`,{method:'POST',headers,body:new Uint8Array(options.body??png)});
}
async function uploadImage() {
  const response=await upload.POST(request(),{params:Promise.resolve({slug})});
  assert.equal(response.status,200);
  return (await response.json()).media as {url:string;sizeBytes:number};
}
function form(p: AdminStoreProductRow, token:string) {
  const data=new FormData();
  for(const [key,value] of Object.entries(p)) {
    if(typeof value==='string')data.set(key,value);
  }
  data.set('gallery_urls',JSON.stringify(p.gallery_urls??[]));
  data.set('supported_platforms',p.supported_platforms.join(','));
  data.set('featured',p.featured?'on':'');data.set('edit_token',token);
  return data;
}

test('workspace adapters reject nonadministrators without changing catalog or accepting files',async()=>{
  globals.__workspaceTestAdmin=false;
  const original=(await catalog.readStoreCatalog()).catalog;
  assert.equal((await upload.POST(request(),{params:Promise.resolve({slug})})).status,403);
  assert.equal((await action.saveWorkspaceAction(new FormData())).code,'STORE_ADMIN_FORBIDDEN');
  assert.equal((await action.publishWorkspaceAction(new FormData())).code,'STORE_ADMIN_FORBIDDEN');
  assert.deepEqual((await catalog.readStoreCatalog()).catalog,original);
});
test('image uploads require exact configured origin and the custom request header',async()=>{
  for(const options of [{origin:'https://untrusted.example'},{origin:'null'},{header:false}]) {
    assert.equal((await upload.POST(request(options),{params:Promise.resolve({slug})})).status,403);
  }
  assert.equal((await catalog.readStoreCatalog()).catalog.productMedia?.length??0,0);
});
test('image upload rejects huge bodies, SVG and invalid image bytes without trusting Content-Type',async()=>{
  assert.equal((await upload.POST(request({declared:String(8*1024*1024+1)}),{params:Promise.resolve({slug})})).status,413);
  const svg=await upload.POST(request({body:Buffer.from('<svg><script>bad()</script></svg>')}),{params:Promise.resolve({slug})});
  assert.equal(svg.status,400);assert.equal((await svg.json()).error,'PRODUCT_IMAGE_TYPE');
  const invalid=await upload.POST(request({body:Buffer.from([137,80,78,71,13,10,26,10])}),{params:Promise.resolve({slug})});
  assert.equal(invalid.status,400);
  assert.equal((await catalog.readStoreCatalog()).catalog.productMedia?.length??0,0);
});
test('uploaded draft image is administrator-only with no-store; guessed paths are not served',async()=>{
  const item=await uploadImage();const file=item.url.split('/').at(-1)!;
  const context={params:Promise.resolve({slug,file})};
  const get=new NextRequest('http://localhost'+item.url);
  const allowed=await readImage.GET(get,context);assert.equal(allowed.status,200);
  assert.equal(allowed.headers.get('content-type'),'image/webp');
  assert.match(allowed.headers.get('cache-control')??'',/no-store/);
  assert.equal(allowed.headers.get('x-content-type-options'),'nosniff');
  assert.equal((await allowed.arrayBuffer()).byteLength,item.sizeBytes);
  globals.__workspaceTestAdmin=false;
  assert.equal((await readImage.GET(get,context)).status,404);
  globals.__workspaceTestAdmin=true;
  for(const file of ['..','catalog.json','../catalog.json','unknown.webp'])assert.equal((await readImage.GET(get,{params:Promise.resolve({slug,file})})).status,404);
});
test('real save and publish adapters preserve live content until explicit confirmed publication',async()=>{
  const before=(await catalog.readStoreCatalog()).catalog,p=before.products[0];
  const item=await uploadImage();
  const saved=await action.saveWorkspaceAction(form({...p,name_zh:'准备公开的名称',icon_url:item.url},workspace.productToken(before,slug)));
  assert.equal(saved.ok,true);
  let actual=(await catalog.readStoreCatalog()).catalog;
  assert.equal(actual.products[0].name_zh,p.name_zh);
  const confirmation=new FormData();confirmation.set('slug',slug);confirmation.set('publish_token',saved.publishToken!);
  assert.equal((await action.publishWorkspaceAction(confirmation)).code,'PRODUCT_CONFIRMATION_REQUIRED');
  confirmation.set('confirm','on');
  assert.equal((await action.publishWorkspaceAction(confirmation)).ok,true);
  actual=(await catalog.readStoreCatalog()).catalog;
  assert.equal(actual.products[0].name_zh,'准备公开的名称');assert.equal(actual.productDrafts?.[slug],undefined);
  globals.__workspaceTestAdmin=false;
  const context={params:Promise.resolve({slug,file:item.url.split('/').at(-1)!})};
  const response=await readImage.GET(new NextRequest('http://localhost'+item.url),context);
  assert.equal(response.status,200);
  const head=await readImage.HEAD(new NextRequest('http://localhost'+item.url,{method:'HEAD'}),context);
  assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
  assert.equal(head.headers.get('content-length'),String(item.sizeBytes));
});
test('stale snapshots and malformed gallery data produce safe errors rather than silent overwrites',async()=>{
  const before=(await catalog.readStoreCatalog()).catalog,p=before.products[0];
  const first=form({...p,name_zh:'第一稿'},workspace.productToken(before,slug));
  assert.equal((await action.saveWorkspaceAction(first)).ok,true);
  assert.equal((await action.saveWorkspaceAction(form({...p,name_zh:'过期稿'},workspace.productToken(before,slug)))).code,'PRODUCT_EDIT_CONFLICT');
  const malformed=form(p,'');malformed.set('gallery_urls','invalid');
  assert.equal((await action.saveWorkspaceAction(malformed)).code,'PRODUCT_FIELD_INVALID');
  assert.equal((await catalog.readStoreCatalog()).catalog.productDrafts?.[slug].product.name_zh,'第一稿');
});
