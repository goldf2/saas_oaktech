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

const introVideo = () => ({ id: 'intro', title: '产品演示', poster_url: '', sources: [
  { id: 'youtube', label: 'YouTube', url: 'https://youtu.be/M7lc1UVf-VE' },
  { id: 'bili', label: 'B站', url: 'https://www.bilibili.com/video/BV1B7411m7LV/' },
] });

test('video sources save privately, survive legacy form saves and publish without altering releases', async () => {
  const before = (await catalog.readStoreCatalog()).catalog, p = before.products[0];
  const f = form(p, workspace.productToken(before, slug)); f.set('videos', JSON.stringify([introVideo()]));
  const saved = await action.saveWorkspaceAction(f); assert.equal(saved.ok, true);
  let next = (await catalog.readStoreCatalog()).catalog;
  assert.equal(next.products[0].videos, undefined);
  assert.equal(next.productDrafts?.[slug].product.videos?.[0].sources.length, 2);
  assert.deepEqual(next.releases, before.releases);
  // An older deployed form omitting the optional field must not erase a newer pending video.
  const legacy = await action.saveWorkspaceAction(form({ ...p, tagline_zh: '修改文案' }, workspace.productToken(next, slug)));
  assert.equal(legacy.ok, true);
  next = (await catalog.readStoreCatalog()).catalog;
  assert.equal(next.productDrafts?.[slug].product.videos?.[0].title, '产品演示');
  const pub = new FormData(); pub.set('slug', slug); pub.set('publish_token', legacy.publishToken!); pub.set('confirm', 'on');
  assert.equal((await action.publishWorkspaceAction(pub)).ok, true);
  next = (await catalog.readStoreCatalog()).catalog;
  assert.equal(next.products[0].videos?.[0].sources[0].url, 'https://www.youtube.com/watch?v=M7lc1UVf-VE');
  assert.deepEqual(next.releases, before.releases);
});

test('invalid video HTML and URLs cannot be persisted, and an incomplete draft cannot publish', async () => {
  const before = (await catalog.readStoreCatalog()).catalog, p = before.products[0];
  for (const raw of ['invalid-json', JSON.stringify([{ ...introVideo(), sources: [{ id: 'evil', label: '', url: 'javascript:alert(1)' }] }]), 'null']) {
    const f = form(p, workspace.productToken(before, slug)); f.set('videos', raw);
    assert.equal((await action.saveWorkspaceAction(f)).ok, undefined);
    assert.deepEqual((await catalog.readStoreCatalog()).catalog, before);
  }
  const f = form(p, workspace.productToken(before, slug)); f.set('videos', JSON.stringify([{ ...introVideo(), title: '', sources: [] }]));
  const result = await action.saveWorkspaceAction(f); assert.equal(result.ok, true);
  const pub = new FormData(); pub.set('slug', slug); pub.set('publish_token', result.publishToken!); pub.set('confirm', 'on');
  assert.equal((await action.publishWorkspaceAction(pub)).code, 'PRODUCT_VIDEO_INCOMPLETE');
  assert.deepEqual((await catalog.readStoreCatalog()).catalog.products, before.products);
});

test('a video poster remains private until publication, and removal is draft-isolated', async () => {
  const before = (await catalog.readStoreCatalog()).catalog, p = before.products[0];
  const poster = await uploadImage();
  let state = (await catalog.readStoreCatalog()).catalog;
  const f = form(p, workspace.productToken(state, slug)); f.set('videos', JSON.stringify([{ ...introVideo(), poster_url: poster.url }]));
  const saved = await action.saveWorkspaceAction(f); assert.equal(saved.ok, true);
  const ctx = { params: Promise.resolve({ slug, file: poster.url.split('/').at(-1)! }) };
  const get = new NextRequest('http://localhost' + poster.url);
  globals.__workspaceTestAdmin = false;
  assert.equal((await readImage.GET(get, ctx)).status, 404);
  globals.__workspaceTestAdmin = true;
  const pub = new FormData(); pub.set('slug', slug); pub.set('publish_token', saved.publishToken!); pub.set('confirm', 'on');
  assert.equal((await action.publishWorkspaceAction(pub)).ok, true);
  globals.__workspaceTestAdmin = false;
  assert.equal((await readImage.GET(get, ctx)).status, 200);
  globals.__workspaceTestAdmin = true;
  state = (await catalog.readStoreCatalog()).catalog;
  const remove = form(state.products[0], workspace.productToken(state, slug)); remove.set('videos', '[]');
  const removed = await action.saveWorkspaceAction(remove); assert.equal(removed.ok, true);
  globals.__workspaceTestAdmin = false;
  assert.equal((await readImage.GET(get, ctx)).status, 200, 'saving removal must not remove the live poster');
  globals.__workspaceTestAdmin = true;
  pub.set('publish_token', removed.publishToken!);
  assert.equal((await action.publishWorkspaceAction(pub)).ok, true);
  globals.__workspaceTestAdmin = false;
  assert.equal((await readImage.GET(get, ctx)).status, 404);
});

test('video poster cannot borrow another product private media or bypass file checks', async () => {
  const item = await uploadImage();
  const state = (await catalog.readStoreCatalog()).catalog;
  const other = state.products.find(p => p.slug !== slug)!;
  const f = form(other, workspace.productToken(state, other.slug)); f.set('videos', JSON.stringify([{ ...introVideo(), poster_url: item.url }]));
  assert.equal((await action.saveWorkspaceAction(f)).code, 'PRODUCT_IMAGE_SCOPE');
  assert.deepEqual((await catalog.readStoreCatalog()).catalog, state);
});

test('video-only changes still reject stale edits and stale publication confirmations', async () => {
  const before = (await catalog.readStoreCatalog()).catalog, p = before.products[0];
  const first = form(p, workspace.productToken(before, slug)); first.set('videos', JSON.stringify([introVideo()]));
  const saved = await action.saveWorkspaceAction(first); assert.equal(saved.ok, true);
  assert.equal((await action.saveWorkspaceAction(first)).code, 'PRODUCT_EDIT_CONFLICT');
  const state = (await catalog.readStoreCatalog()).catalog;
  const f = form(p, workspace.productToken(state, slug)); f.set('videos', JSON.stringify([{ ...introVideo(), title: '更新后视频' }]));
  assert.equal((await action.saveWorkspaceAction(f)).ok, true);
  const pub = new FormData(); pub.set('slug', slug); pub.set('publish_token', saved.publishToken!); pub.set('confirm', 'on');
  assert.equal((await action.publishWorkspaceAction(pub)).code, 'PRODUCT_PUBLICATION_CONFLICT');
  assert.equal((await catalog.readStoreCatalog()).catalog.products[0].videos, undefined);
});

test('link-only video publishes through the authorized action without any software release', async () => {
  const before = (await catalog.readStoreCatalog()).catalog, p = before.products[0];
  const f = form(p, workspace.productToken(before, slug));
  f.set('videos', JSON.stringify([{ ...introVideo(), title: '', poster_url: '' }]));
  const saved = await action.saveWorkspaceAction(f); assert.equal(saved.ok, true);
  const pub = new FormData(); pub.set('slug', slug); pub.set('publish_token', saved.publishToken!); pub.set('confirm', 'on');
  assert.equal((await action.publishWorkspaceAction(pub)).ok, true);
  const next = (await catalog.readStoreCatalog()).catalog;
  assert.equal(next.products[0].videos?.[0].title, '');
  assert.equal(next.products[0].videos?.[0].sources.length, introVideo().sources.length);
  assert.deepEqual(next.releases, before.releases);
});


test('a legacy caller omitting title can publish without inventing platform metadata', async () => {
  const before = (await catalog.readStoreCatalog()).catalog, p = before.products[0];
  const { title: _unused, ...linkOnly } = introVideo();
  const f = form(p, workspace.productToken(before, slug));
  f.set('videos', JSON.stringify([linkOnly]));
  const saved = await action.saveWorkspaceAction(f); assert.equal(saved.ok, true);
  const pub = new FormData(); pub.set('slug', slug); pub.set('publish_token', saved.publishToken!); pub.set('confirm', 'on');
  assert.equal((await action.publishWorkspaceAction(pub)).ok, true);
  const next = (await catalog.readStoreCatalog()).catalog;
  assert.equal(next.products[0].videos?.[0].title, '');
  assert.deepEqual(next.releases, before.releases);
});
