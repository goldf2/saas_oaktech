import './helpers/workspace-route-loader.mjs';
import assert from 'node:assert/strict';
import test, { before, beforeEach, afterEach } from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { managedWorkspaceItems, filterWorkspaceProducts, publicWorkspaceItem, releaseOverview } from '../lib/store/workspace-product-list.ts';
import type { AdminStoreProductRow, AdminProductReleaseRow } from '../lib/store/types.ts';
// Load after the test-only hooks are installed; production server-only boundaries stay intact.
let listPublicWorkspaceItems: typeof import('../lib/store/public-data.ts').listPublicWorkspaceItems;
before(async () => { ({ listPublicWorkspaceItems } = await import('../lib/store/public-data.ts')); });

const product: AdminStoreProductRow = {
  id: 'public', slug: 'public-tool', category_slug: 'developer-tools', status: 'beta', visibility: 'published',
  name_zh: '公开名称', name_en: 'Public tool', tagline_zh: '公开简介', tagline_en: 'Public description',
  description_zh: '公开资料', description_en: 'Public details', icon_url: '/open-play/icon.png',
  hero_image_url: '/open-play/hero.png', supported_platforms: ['macOS'], featured: false,
};
const release = (changes: Partial<AdminProductReleaseRow> = {}): AdminProductReleaseRow => ({
  id: 'published-release', product_slug: product.slug, version: '1.0.0', channel: 'stable', status: 'published', is_current: true,
  published_at: '2026-09-01T01:00:00Z', title_zh: '公开版本', title_en: 'Release', notes_zh: '公开说明', notes_en: 'Release notes',
  release_artifacts: [{ id: 'file', release_id: 'published-release', platform: 'chrome', architecture: 'universal', package_kind: 'zip', file_name: 'public.zip', storage_path: 'public-tool/stable/1.0.0/public.zip', public_path: '/releases/public-tool/stable/1.0.0/public.zip', size_bytes: 10, sha512: 'a'.repeat(128), content_type: 'application/zip' }], ...changes,
});
function catalog() {
  return {
    schemaVersion: 1 as const, updatedAt: '2026-09-19T00:00:00Z',
    products: [product, { ...product, id: 'private', slug: 'private-tool', visibility: 'draft' as const, name_zh: 'PRIVATE_PRODUCT_SENTINEL' }],
    productDrafts: { [product.slug]: { revision: 1, updatedAt: '2026-09-19T00:00:00Z', product: { ...product, name_zh: 'PRIVATE_TITLE_SENTINEL', tagline_zh: 'PRIVATE_COPY_SENTINEL', icon_url: '/PRIVATE_IMAGE_SENTINEL.png' } } },
    releases: [release(), release({ id: 'draft', version: '99.0.0', status: 'draft', published_at: null, title_zh: 'PRIVATE_RELEASE_SENTINEL' }), release({ id: 'private-published', product_slug: 'private-tool' })],
  };
}
const previous = process.env.RELEASE_STORAGE_ROOT;
let root: string;
beforeEach(async () => { root = await mkdtemp(path.join(os.tmpdir(), 'oaktech-one-list-')); process.env.RELEASE_STORAGE_ROOT = root; });
afterEach(async () => { await rm(root, { recursive: true, force: true }); if (previous === undefined) delete process.env.RELEASE_STORAGE_ROOT; else process.env.RELEASE_STORAGE_ROOT = previous; });

test('public projection ignores private product, saved copy and draft software metadata before search or counting', async () => {
  await writeFile(path.join(root, 'catalog.json'), JSON.stringify(catalog()));
  const items = await listPublicWorkspaceItems('zh');
  assert.equal(items.length, 1); assert.equal(items[0].name, product.name_zh); assert.equal(items[0].publishedVersions, 1); assert.equal(items[0].downloadable, true);
  assert.doesNotMatch(JSON.stringify(items), /PRIVATE_|management|storage_path|public\.zip|99\.0\.0/);
  const forged = filterWorkspaceProducts(items, { state: 'draft', q: 'PRIVATE_' }, false);
  assert.equal(forged.filtered.length, 0); assert.equal(forged.state, 'all');
  assert.deepEqual(forged.stats, [['公开商品', 1], ['可下载软件', 1]]);
});
test('private edits and new draft packages do not change any public card, search index or count', async () => {
  const original = catalog(); await writeFile(path.join(root, 'catalog.json'), JSON.stringify(original));
  const before = await listPublicWorkspaceItems('zh');
  original.productDrafts[product.slug].product.name_zh = 'DIFFERENT_PRIVATE_NAME';
  original.releases.push(release({ id: 'new-private-package', status: 'draft', published_at: null }));
  await writeFile(path.join(root, 'catalog.json'), JSON.stringify(original));
  assert.deepEqual(await listPublicWorkspaceItems('zh'), before);
});
test('administrative projection keeps editing snapshot, online name and both publication states without mutating catalog', () => {
  const source = catalog(), before = structuredClone(source); const items = managedWorkspaceItems(source);
  assert.equal(items.length, 2); assert.equal(items[0].name, 'PRIVATE_TITLE_SENTINEL');
  assert.equal(items[0].management?.publishedName, product.name_zh); assert.equal(items[0].management?.pendingProduct, true);
  assert.equal(items[0].management?.draftVersions, 1); assert.equal(items[0].publishedVersions, 1);
  assert.equal(items[1].downloadable, false, 'an unlisted product gets no public-detail download button');
  assert.deepEqual(source, before);
});
test('role-safe filtering preserves admin draft/public filters and tolerates malformed URL parameters', () => {
  const items = managedWorkspaceItems(catalog());
  assert.equal(filterWorkspaceProducts(items, { q: ' PUBLIC ', state: 'published' }, true).filtered.length, 1);
  assert.equal(filterWorkspaceProducts(items, { state: 'draft' }, true).filtered.length, 2);
  assert.equal(filterWorkspaceProducts(items, { state: ['draft'], q: ['PRIVATE_'] }, true).state, 'all');
  assert.equal(filterWorkspaceProducts(items, { q: 'x'.repeat(1000) }, true).q.length, 200);
  assert.equal(filterWorkspaceProducts(items, {}, false).filtered.length, 0, 'management projections are never downgraded into public responses');
});
test('published product without software stays visible without invented download availability', async () => {
  const source = catalog(); source.releases = [release({ status: 'draft', published_at: null })];
  await writeFile(path.join(root, 'catalog.json'), JSON.stringify(source));
  const [item] = await listPublicWorkspaceItems('zh');
  assert.equal(item.published, true); assert.equal(item.publishedVersions, 0); assert.equal(item.downloadable, false);
});
test('download summary excludes draft and timestamp-less releases and metadata-only files', () => {
  assert.deepEqual(releaseOverview([release({ status: 'draft' }), release({ published_at: null })]), { publishedVersions: 0, downloadable: false });
  const r = release(); r.release_artifacts[0].file_name = 'windows.json'; r.release_artifacts[0].package_kind = 'manifest';
  assert.deepEqual(releaseOverview([r]), { publishedVersions: 1, downloadable: false });
});
test('summary follows the current release used by existing detail page rather than advertising another release files', () => {
  assert.deepEqual(releaseOverview([release({ is_current: false }), release({ id: 'current-no-files', release_artifacts: [] })]), { publishedVersions: 2, downloadable: false });
});
test('public summary does not spread unrecognized fields from a public row', () => {
  const p = { slug: 'public-tool', name: '公开', tagline: '描述', iconUrl: '', heroImageUrl: '', description: '', visibility: 'published' as const,
    status: 'beta' as const, categorySlug: 'developer-tools', supportedPlatforms: [], featured: false, secret: 'NO_COPY' };
  assert.doesNotMatch(JSON.stringify(publicWorkspaceItem(p, [])), /NO_COPY|secret/);
});
