import './helpers/store-test-loader.mjs';
import assert from 'node:assert/strict';
import test, { before, beforeEach, afterEach } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import type { AdminActionResult, AdminStoreProductRow } from '../lib/store/types.ts';

let catalog: typeof import('../lib/store/file-catalog.ts');
let workspace: typeof import('../lib/store/product-workspace.ts');
let actions: typeof import('../app/admin/actions.ts');
let publicData: typeof import('../lib/store/public-data.ts');
let root: string;
const previousRoot = process.env.RELEASE_STORAGE_ROOT;
const original: AdminStoreProductRow = {
  id: 'link-test', slug: 'link-test', category_slug: 'utility-tools',
  status: 'released', visibility: 'published', name_zh: '链接回归测试', name_en: 'Link regression fixture',
  tagline_zh: '测试简介', tagline_en: 'Test tagline', description_zh: '测试商品说明', description_en: 'Test description',
  icon_url: '/gitfinder-2/icon.png', hero_image_url: '/gitfinder-2/hero.svg',
  gallery_urls: [], videos: [], supported_platforms: ['macOS'], featured: false,
  github_url: 'https://github.com/example/published/releases',
};
before(async () => {
  catalog = await import('../lib/store/file-catalog.ts');
  workspace = await import('../lib/store/product-workspace.ts');
  actions = await import('../app/admin/actions.ts');
  publicData = await import('../lib/store/public-data.ts');
});
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'oaktech-link-regression-'));
  process.env.RELEASE_STORAGE_ROOT = root;
  await catalog.mutateStoreCatalog(value => {
    value.products = [structuredClone(original)]; value.releases = []; value.productDrafts = {};
  });
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  if (previousRoot === undefined) delete process.env.RELEASE_STORAGE_ROOT;
  else process.env.RELEASE_STORAGE_ROOT = previousRoot;
});
function legacyForm(github?: string) {
  const form = new FormData();
  for (const [key, value] of Object.entries(original)) {
    if (key === 'github_url' || key === 'videos' || key === 'gallery_urls') continue;
    form.set(key, Array.isArray(value) ? value.join(',') : typeof value === 'boolean' ? value ? 'on' : '' : String(value));
  }
  if (github !== undefined) form.set('github_url', github);
  return form;
}
async function legacySave(form: FormData): Promise<AdminActionResult> {
  try { return await actions.saveProductAction(form); }
  catch (error) { if (error instanceof Error && error.message === 'TEST_REDIRECT') return {}; throw error; }
}
async function state() { return (await catalog.readStoreCatalog()).catalog; }

test('legacy product saves preserve a GitHub field omitted by cached clients', async () => {
  const result = await legacySave(legacyForm());
  assert.equal(result.error, undefined);
  assert.equal((await state()).products[0].github_url, original.github_url);
});

test('legacy product action validates explicit GitHub URLs and allows removal', async () => {
  const beforeState = await state();
  const invalid = await legacySave(legacyForm('javascript:alert(1)'));
  assert.equal(invalid.code, 'PRODUCT_GITHUB_URL_INVALID');
  assert.deepEqual(await state(), beforeState);
  assert.equal((await legacySave(legacyForm(' https://github.com/example/replacement/ '))).error, undefined);
  assert.equal((await state()).products[0].github_url, 'https://github.com/example/replacement');
  assert.equal((await legacySave(legacyForm(''))).error, undefined);
  assert.equal((await state()).products[0].github_url, '');
});

test('public GitHub links change only after product publication in both languages', async () => {
  const replacement = 'https://github.com/example/replacement/releases';
  await workspace.saveProductDraft({ ...original, github_url: replacement }, workspace.productToken(await state(), original.slug));
  for (const locale of ['zh', 'en'] as const) {
    assert.equal((await publicData.getPublicProduct(original.slug, locale)).product?.githubUrl, original.github_url);
  }
  const beforeReleases = (await state()).releases;
  await workspace.publishProductDraft(original.slug, workspace.publicationToken(await state(), original.slug));
  for (const locale of ['zh', 'en'] as const) {
    assert.equal((await publicData.getPublicProduct(original.slug, locale)).product?.githubUrl, replacement);
  }
  assert.deepEqual((await state()).releases, beforeReleases);
});

test('draft products and invalid persisted links do not become public anchors', async () => {
  await catalog.mutateStoreCatalog(value => {
    value.products[0].github_url = 'javascript:alert(1)';
    value.products.push({ ...original, id: 'private', slug: 'private-link-test', visibility: 'draft' });
  });
  assert.equal((await publicData.getPublicProduct(original.slug, 'zh')).product?.githubUrl, '');
  assert.equal((await publicData.getPublicProduct('private-link-test', 'zh')).product, null);
  assert.equal((await publicData.listPublicProducts('en')).products.length, 1);
});
