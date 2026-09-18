import './helpers/store-test-loader.mjs';
import assert from 'node:assert/strict';
import test, { before, beforeEach, afterEach } from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import type { AdminStoreProductRow, AdminProductReleaseRow } from '../lib/store/types.ts';
let workspace: typeof import('../lib/store/product-workspace.ts');
let catalogModule: typeof import('../lib/store/file-catalog.ts');
let media: typeof import('../lib/store/product-media.ts');
let root: string;
const previousRoot = process.env.RELEASE_STORAGE_ROOT;
before(async () => {
  workspace = await import('../lib/store/product-workspace.ts');
  catalogModule = await import('../lib/store/file-catalog.ts');
  media = await import('../lib/store/product-media.ts');
});
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'oaktech-product-workspace-'));
  process.env.RELEASE_STORAGE_ROOT = root;
  await catalogModule.mutateStoreCatalog(() => {});
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  if (previousRoot === undefined) delete process.env.RELEASE_STORAGE_ROOT; else process.env.RELEASE_STORAGE_ROOT = previousRoot;
});
async function product() { return (await catalogModule.readStoreCatalog()).catalog.products[0]; }
async function token(slug: string) { return workspace.productToken((await catalogModule.readStoreCatalog()).catalog, slug); }
async function releaseToken(slug: string) { return workspace.releasePublicationToken((await catalogModule.readStoreCatalog()).catalog, slug); }
async function publishToken(slug: string) { return workspace.publicationToken((await catalogModule.readStoreCatalog()).catalog, slug); }

test('saving a published product creates a private revision without changing live content', async () => {
  const original = await product();
  const changed = { ...original, name_zh: '未公开修改', description_zh: '<script>plain text</script>\n多段说明' };
  await workspace.saveProductDraft(changed, await token(original.slug));
  const actual = (await catalogModule.readStoreCatalog()).catalog;
  assert.deepEqual(actual.products[0], original);
  assert.equal(actual.productDrafts?.[original.slug].product.name_zh, changed.name_zh);
});

test('stale edits and duplicate creation reject instead of overwriting content', async () => {
  const original = await product(), old = await token(original.slug);
  await workspace.saveProductDraft({ ...original, name_zh: '第一次修改' }, old);
  await assert.rejects(() => workspace.saveProductDraft({ ...original, name_zh: '过期覆盖' }, old), /PRODUCT_EDIT_CONFLICT/);
  await assert.rejects(() => workspace.saveProductDraft({ ...original, id: '' }, ''), /STORE_PRODUCT_SLUG_EXISTS/);
  await assert.rejects(() => workspace.saveProductDraft({ ...original, slug: 'moved-product' }, ''), /PRODUCT_IDENTITY_IMMUTABLE/);
});

test('new incomplete draft stays hidden and requires content before explicit publication', async () => {
  const original = await product();
  const draft = { ...original, id: '', slug: 'new-tool', name_zh: '新工具', name_en: '', icon_url: '', hero_image_url: '', description_zh: '', description_en: '' };
  await workspace.saveProductDraft(draft, '');
  const actual = (await catalogModule.readStoreCatalog()).catalog.products.find(p => p.slug === draft.slug)!;
  assert.equal(actual.visibility, 'draft');
  await assert.rejects(() => workspace.publishProductDraft(draft.slug, 'stale-preview', []), /PRODUCT_PUBLICATION_CONFLICT/);
  const expected = await publishToken(draft.slug);
  await assert.rejects(() => workspace.publishProductDraft(draft.slug, expected, []), /PRODUCT_PUBLICATION_INCOMPLETE/);
});

test('explicit metadata publication promotes only that product and clears its draft', async () => {
  const original = await product();
  await workspace.saveProductDraft({ ...original, name_zh: '最终名称', gallery_urls: ['/open-play/icon.png'] }, await token(original.slug));
  const before = (await catalogModule.readStoreCatalog()).catalog;
  await workspace.publishProductDraft(original.slug, await publishToken(original.slug), []);
  const actual = (await catalogModule.readStoreCatalog()).catalog;
  assert.equal(actual.products[0].name_zh, '最终名称');
  assert.deepEqual(actual.products[0].gallery_urls, ['/open-play/icon.png']);
  assert.equal(actual.productDrafts?.[original.slug], undefined);
  assert.deepEqual(actual.releases, before.releases);
  assert.deepEqual(actual.products.slice(1), before.products.slice(1));
});

async function createRelease(productSlug: string, version = '1.0.0', tampered = false): Promise<AdminProductReleaseRow> {
  const bytes = Buffer.from('fixture software package');
  const storagePath = `${productSlug}/stable/${version}/app.zip`;
  await mkdir(path.dirname(path.join(root, storagePath)), { recursive: true });
  await writeFile(path.join(root, storagePath), tampered ? 'broken' : bytes);
  const release: AdminProductReleaseRow = { id: `release-${productSlug}-${version}`, product_slug: productSlug, version, channel: 'stable', status: 'draft', is_current: false, published_at: null, title_en: 'Release', title_zh: '软件版本', notes_en: 'Notes', notes_zh: '更新说明', release_artifacts: [{id:'artifact-'+version,release_id:`release-${productSlug}-${version}`,platform:'chrome',architecture:'universal',package_kind:'zip',file_name:'app.zip',storage_path:storagePath,public_path:'/releases/'+storagePath,size_bytes:bytes.length,sha512:createHash('sha512').update(bytes).digest('hex'),content_type:'application/zip'}] };
  await catalogModule.mutateStoreCatalog(catalog => { catalog.releases.push(release); });
  return release;
}

test('software publish validates selected package without promoting the product draft', async () => {
  const original = await product();
  await workspace.saveProductDraft({ ...original, name_zh: '带版本商品' }, await token(original.slug));
  const release = await createRelease(original.slug);
  await workspace.publishSoftwareReleases(original.slug, await releaseToken(original.slug), [release.id]);
  const catalog = (await catalogModule.readStoreCatalog()).catalog;
  assert.equal(catalog.products[0].name_zh, original.name_zh);
  assert.equal(catalog.productDrafts?.[original.slug].product.name_zh, '带版本商品');
  assert.equal(catalog.releases.find(r => r.id === release.id)?.status, 'published');
  assert.equal(catalog.releases.find(r => r.id === release.id)?.is_current, true);
});

test('checksum failure leaves the published product and release states unchanged', async () => {
  const original = await product();
  await workspace.saveProductDraft({ ...original, name_zh: '不得半发布' }, await token(original.slug));
  const release = await createRelease(original.slug, '2.0.0', true);
  const before = (await catalogModule.readStoreCatalog()).catalog;
  const expected = await releaseToken(original.slug);
  await assert.rejects(() => workspace.publishSoftwareReleases(original.slug, expected, [release.id]), /ARTIFACT_SIZE_MISMATCH/);
  assert.deepEqual((await catalogModule.readStoreCatalog()).catalog, before);
});

test('cross-product versions and multiple current versions in one channel are rejected', async () => {
  const original = await product();
  const foreign = await createRelease('gitfinder-2');
  await assert.rejects(() => workspace.publishSoftwareReleases(original.slug, '', [foreign.id]), /RELEASE_PUBLICATION_CONFLICT/);
  let expected = await releaseToken(original.slug);
  await assert.rejects(() => workspace.publishSoftwareReleases(original.slug, expected, [foreign.id]), /PRODUCT_RELEASE_SCOPE/);
  const a = await createRelease(original.slug, '3.0.0'), b = await createRelease(original.slug, '4.0.0');
  expected = await releaseToken(original.slug);
  await assert.rejects(() => workspace.publishSoftwareReleases(original.slug, expected, [a.id,b.id]), /PRODUCT_CHANNEL_CONFLICT/);
});

test('uploaded artwork is rewritten to WebP, stays private in drafts and publishes with its product', async () => {
  const p = await product();
  const png = await sharp({create:{width:128,height:80,channels:4,background:{r:30,g:100,b:180,alpha:1}}}).png().toBuffer();
  const item = await media.storeProductImage(p.slug, png);
  assert.equal(item.width,128);
  assert.match(item.url, /^\/media\/products\//);
  let catalog = (await catalogModule.readStoreCatalog()).catalog;
  assert.equal(media.isPublicProductImage(catalog,item.url),false);
  await workspace.saveProductDraft({...p,hero_image_url:item.url}, await token(p.slug));
  catalog = (await catalogModule.readStoreCatalog()).catalog;
  assert.equal(media.isPublicProductImage(catalog,item.url),false);
  await workspace.publishProductDraft(p.slug,await publishToken(p.slug),[]);
  catalog = (await catalogModule.readStoreCatalog()).catalog;
  assert.equal(media.isPublicProductImage(catalog,item.url),true);
  await assert.rejects(() => media.storeProductImage(p.slug,Buffer.from('<svg><script>alert(1)</script></svg>')),/PRODUCT_IMAGE_TYPE/);
  await assert.rejects(() => media.storeProductImage(p.slug,Buffer.alloc(media.MAX_IMAGE_BYTES+1)),/PRODUCT_IMAGE_TOO_LARGE/);
});

test('a product cannot attach unpublished media owned by another product', async () => {
  const p = await product();
  const png = await sharp({create:{width:64,height:64,channels:3,background:'white'}}).png().toBuffer();
  const image = await media.storeProductImage('gitfinder-2',png);
  const expected = await token(p.slug);
  await assert.rejects(() => workspace.saveProductDraft({...p,hero_image_url:image.url},expected),/PRODUCT_IMAGE_SCOPE/);
});
