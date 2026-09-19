import './helpers/workspace-route-loader.mjs';
import assert from 'node:assert/strict';
import test, { before, beforeEach, afterEach } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import type { AdminProductReleaseRow } from '../lib/store/types.ts';
let service: typeof import('../lib/store/product-workspace.ts');
let store: typeof import('../lib/store/file-catalog.ts');
let actions: typeof import('../app/admin/products/editor-actions.ts');
let root: string;
const oldRoot = process.env.RELEASE_STORAGE_ROOT;
const globals = globalThis as typeof globalThis & { __workspaceTestAdmin?: boolean };
before(async () => { service = await import('../lib/store/product-workspace.ts'); store = await import('../lib/store/file-catalog.ts'); actions = await import('../app/admin/products/editor-actions.ts'); });
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'oaktech-decoupled-'));
  process.env.RELEASE_STORAGE_ROOT = root; globals.__workspaceTestAdmin = true;
  await store.mutateStoreCatalog(() => {});
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); if (oldRoot === undefined) delete process.env.RELEASE_STORAGE_ROOT; else process.env.RELEASE_STORAGE_ROOT = oldRoot; delete globals.__workspaceTestAdmin; });
const catalog = async () => (await store.readStoreCatalog()).catalog;
const product = async () => (await catalog()).products[0];
async function release(version = '9.0.0', tampered = false) {
  const p = await product(), bytes = Buffer.from('independent release fixture'), relative = `${p.slug}/stable/${version}/tool.zip`;
  await mkdir(path.dirname(path.join(root, relative)), { recursive: true });
  await writeFile(path.join(root, relative), tampered ? Buffer.from('wrong bytes') : bytes);
  const r: AdminProductReleaseRow = { id: `decoupled-${version}`, product_slug: p.slug, version, channel: 'stable', status: 'draft', is_current: false, published_at: null, title_zh: '独立软件版本', title_en: 'Independent release', notes_zh: '更新说明', notes_en: 'Release notes', release_artifacts: [{ id: `asset-${version}`, release_id: `decoupled-${version}`, platform: 'chrome', architecture: 'universal', package_kind: 'zip', file_name: 'tool.zip', storage_path: relative, public_path: '/releases/' + relative, size_bytes: bytes.length, sha512: createHash('sha512').update(bytes).digest('hex'), content_type: 'application/zip' }] };
  await store.mutateStoreCatalog(c => { c.releases.push(r); }); return r;
}

test('product publication is not invalidated by a software draft change', async () => {
  const p = await product(); await service.saveProductDraft({ ...p, name_zh: '新商品资料' }, service.productToken(await catalog(), p.slug));
  const token = service.publicationToken(await catalog(), p.slug);
  const r = await release();
  await service.publishProductDraft(p.slug, token, []);
  const c = await catalog(); assert.equal(c.products[0].name_zh, '新商品资料'); assert.equal(c.releases.find(x => x.id === r.id)?.status, 'draft');
});

test('product publication refuses a legacy combined request rather than publishing software implicitly', async () => {
  const p = await product(), r = await release(), before = await catalog();
  await assert.rejects(() => service.publishProductDraft(p.slug, service.publicationToken(before, p.slug), [r.id]), /PUBLICATION_SCOPE_SEPARATE/);
  assert.deepEqual(await catalog(), before);
});

test('software publication ignores an incomplete product draft and preserves it byte-for-byte', async () => {
  const p = await product(), r = await release();
  const token = service.releasePublicationToken(await catalog(), p.slug);
  await service.saveProductDraft({ ...p, name_zh: '不能公开的草稿', description_zh: '', icon_url: '', videos: [{ id: 'unfinished', title: '', poster_url: '', sources: [] }] }, service.productToken(await catalog(), p.slug));
  const before = await catalog();
  await service.publishSoftwareReleases(p.slug, token, [r.id]);
  const c = await catalog(); assert.deepEqual(c.products, before.products); assert.deepEqual(c.productDrafts, before.productDrafts);
  assert.equal(c.releases.find(x => x.id === r.id)?.status, 'published');
});

test('software can publish for a saved but unlisted product without automatically listing it', async () => {
  const p = await product(), r = await release();
  await store.mutateStoreCatalog(c => { c.products[0].visibility = 'draft'; c.products[0].icon_url = ''; c.products[0].description_zh = ''; });
  const before = await catalog();
  await service.publishSoftwareReleases(p.slug, service.releasePublicationToken(before, p.slug), [r.id]);
  const c = await catalog(); assert.deepEqual(c.products, before.products); assert.equal(c.products[0].visibility, 'draft');
  const { resolvePublicDownload } = await import('../lib/store/downloads.ts');
  assert.ok(await resolvePublicDownload(r.release_artifacts[0].storage_path.split('/')));
});

test('software request rejects stale release edits but does not conflict with published product edits', async () => {
  const p = await product(), r = await release(); let token = service.releasePublicationToken(await catalog(), p.slug);
  await store.mutateStoreCatalog(c => { c.releases.find(x => x.id === r.id)!.notes_zh = '新的更新说明'; });
  await assert.rejects(() => service.publishSoftwareReleases(p.slug, token, [r.id]), /RELEASE_PUBLICATION_CONFLICT/);
  token = service.releasePublicationToken(await catalog(), p.slug);
  await service.saveProductDraft({ ...p, name_zh: '另一条流程更新商品' }, service.productToken(await catalog(), p.slug));
  await service.publishProductDraft(p.slug, service.publicationToken(await catalog(), p.slug), []);
  await service.publishSoftwareReleases(p.slug, token, [r.id]);
  assert.equal((await catalog()).products[0].name_zh, '另一条流程更新商品');
});

test('each target rejects its own stale token; changing another product does not conflict', async () => {
  const p = await product(), token = service.publicationToken(await catalog(), p.slug);
  await service.saveProductDraft({ ...p, name_zh: '已被编辑' }, service.productToken(await catalog(), p.slug));
  await assert.rejects(() => service.publishProductDraft(p.slug, token, []), /PRODUCT_PUBLICATION_CONFLICT/);
  const valid = service.publicationToken(await catalog(), p.slug);
  await store.mutateStoreCatalog(c => { c.products[1].name_zh = '无关商品'; });
  await service.publishProductDraft(p.slug, valid, []);
});

test('tampered software never prevents independent product publication and cannot publish a partial release set', async () => {
  const p = await product(), r = await release('9.1.0', true);
  await service.saveProductDraft({ ...p, name_zh: '图文可正常发布' }, service.productToken(await catalog(), p.slug));
  await service.publishProductDraft(p.slug, service.publicationToken(await catalog(), p.slug), []);
  const before = await catalog();
  await assert.rejects(() => service.publishSoftwareReleases(p.slug, service.releasePublicationToken(before, p.slug), [r.id]), /ARTIFACT_SIZE_MISMATCH/);
  assert.deepEqual(await catalog(), before);
});

test('independent actions require administrator and explicit confirmation and reject ambiguous payloads', async () => {
  const p = await product(), r = await release(), c = await catalog();
  const f = new FormData(); f.set('slug', p.slug); f.set('release_token', service.releasePublicationToken(c, p.slug)); f.append('release_id', r.id);
  assert.equal((await actions.publishSoftwareAction(f)).code, 'RELEASE_CONFIRMATION_REQUIRED');
  f.set('confirm', 'on'); globals.__workspaceTestAdmin = false;
  assert.equal((await actions.publishSoftwareAction(f)).code, 'STORE_ADMIN_FORBIDDEN');
  globals.__workspaceTestAdmin = true;
  const combined = new FormData(); combined.set('slug', p.slug); combined.set('publish_token', service.publicationToken(c,p.slug)); combined.set('confirm','on'); combined.append('release_id',r.id);
  assert.equal((await actions.publishWorkspaceAction(combined)).code, 'PUBLICATION_SCOPE_SEPARATE');
  assert.deepEqual(await catalog(), c);
  assert.equal((await actions.publishSoftwareAction(f)).ok, true);
  const after = await catalog(); assert.deepEqual(after.products, c.products);
});

test('empty software selections cannot become a no-op or product publication', async () => {
  const p = await product(), c = await catalog();
  await assert.rejects(() => service.publishSoftwareReleases(p.slug, service.releasePublicationToken(c,p.slug), []), /PRODUCT_RELEASE_SCOPE/);
  assert.deepEqual(await catalog(), c);
});


test('product introduction can be published before any software exists; later software leaves the page metadata intact', async () => {
  const p = await product();
  await store.mutateStoreCatalog(c => { c.products[0].visibility = 'draft'; c.releases = c.releases.filter(r => r.product_slug !== p.slug); });
  await service.saveProductDraft({ ...p, name_zh: '先公开介绍的商品' }, service.productToken(await catalog(), p.slug));
  await service.publishProductDraft(p.slug, service.publicationToken(await catalog(), p.slug));
  const published = (await catalog()).products[0];
  assert.equal(published.visibility, 'published');
  assert.equal((await catalog()).releases.some(r => r.product_slug === p.slug), false);
  const r = await release();
  assert.deepEqual((await catalog()).products[0], published);
  await service.publishSoftwareReleases(p.slug, service.releasePublicationToken(await catalog(), p.slug), [r.id]);
  assert.deepEqual((await catalog()).products[0], published);
  assert.equal((await catalog()).releases.find(x => x.id === r.id)?.status, 'published');
});

test('one invalid package prevents the whole selected software set from publishing without consuming the product draft', async () => {
  const p = await product(), good = await release('9.2.0'), bad = await release('9.3.0', true);
  await store.mutateStoreCatalog(c => { c.releases.find(r => r.id === bad.id)!.channel = 'beta'; });
  await service.saveProductDraft({ ...p, name_zh: '另行准备的商品草稿' }, service.productToken(await catalog(), p.slug));
  const before = await catalog();
  await assert.rejects(() => service.publishSoftwareReleases(p.slug, service.releasePublicationToken(before,p.slug), [good.id,bad.id]), /ARTIFACT_/);
  assert.deepEqual(await catalog(), before);
});

test('draft file removal requires administrator, exact identity and keeps other files', async () => {
  const r = await release(); const a = r.release_artifacts[0];
  const form = new FormData(); form.set('release_id',r.id);form.set('artifact_id',a.id);form.set('confirm_file',a.file_name);form.set('sha512',a.sha512);
  globals.__workspaceTestAdmin=false;
  assert.equal((await actions.removeDraftArtifactAction(form)).code,'STORE_ADMIN_FORBIDDEN');
  globals.__workspaceTestAdmin=true;
  form.set('sha512','stale');assert.equal((await actions.removeDraftArtifactAction(form)).code,'DRAFT_ARTIFACT_CHANGED');
  form.set('sha512',a.sha512);assert.equal((await actions.removeDraftArtifactAction(form)).ok,true);
  assert.equal((await catalog()).releases.find(x=>x.id===r.id)?.release_artifacts.length,0);
  const {access}=await import('node:fs/promises'); await assert.rejects(access(path.join(root,a.storage_path)));
});
test('published files cannot be removed through the draft recovery action', async () => {
  const r=await release(),a=r.release_artifacts[0];
  await store.mutateStoreCatalog(c=>{c.releases.find(x=>x.id===r.id)!.status='published';});
  const before=await catalog();const f=new FormData();f.set('release_id',r.id);f.set('artifact_id',a.id);f.set('confirm_file',a.file_name);f.set('sha512',a.sha512);
  assert.equal((await actions.removeDraftArtifactAction(f)).code,'DRAFT_RELEASE_NOT_FOUND');
  assert.deepEqual(await catalog(),before);
});
test('unsigned Open Play feed errors reach the action caller and do not publish', async () => {
  const r=await release('0.6.6.13');
  r.product_slug='open-play';r.release_artifacts=[];
  for(const name of ['appcast.xml','windows.json','open-play-0.6.6.13-macos.zip','open-play-0.6.6.13-windows-x64.zip']) {
    const bytes=Buffer.from('unsigned-fixture');const relative='open-play/stable/0.6.6.13/'+name;
    await mkdir(path.dirname(path.join(root,relative)),{recursive:true});await writeFile(path.join(root,relative),bytes);
    r.release_artifacts.push({id:name,release_id:r.id,file_name:name,storage_path:relative,public_path:'/releases/'+relative,size_bytes:bytes.length,sha512:createHash('sha512').update(bytes).digest('hex'),platform:'macos',architecture:'arm64',package_kind:name.endsWith('.zip')?'zip':'manifest',content_type:'application/octet-stream'});
  }
  await store.mutateStoreCatalog(c=>{c.releases=c.releases.map(x=>x.id===r.id?r:x);});
  const before=await catalog();const f=new FormData();f.set('slug','open-play');f.set('confirm','on');f.set('release_token',service.releasePublicationToken(before,'open-play'));f.append('release_id',r.id);
  const result=await actions.publishSoftwareAction(f);assert.equal(result.code,'OPEN_PLAY_UNSIGNED_FEED');assert.match(result.error!,/appcast-website.xml/);
  assert.deepEqual(await catalog(),before);
});
