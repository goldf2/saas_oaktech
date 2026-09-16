import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const source = (name: string) => readFile(new URL(`../${name}`, import.meta.url), 'utf8');

test('product list and create entry use one workspace rather than the flat public-edit form', async () => {
  const [list, create, overview] = await Promise.all([source('app/admin/products/page.tsx'),source('app/admin/products/new/page.tsx'),source('app/admin/software/page.tsx')]);
  assert.match(list,/product-management/);
  assert.match(list,/editableProduct/);
  assert.doesNotMatch(list,/href="\/admin\/releases"/);
  assert.match(create,/<ProductWorkspace/);
  assert.match(create,/initialProduct/);
  assert.doesNotMatch(create,/<ProductForm/);
  assert.match(overview,/products\/page/);
});

test('legacy release entry validates administration and resolves the actual product before redirecting', async () => {
  const entry = await source('app/admin/releases/page.tsx');
  assert.match(entry,/getStoreAdmin/);
  assert.match(entry,/catalog\.releases\.find/);
  assert.match(entry,/release\?\.product_slug/);
  assert.match(entry,/tab: "versions"/);
  assert.doesNotMatch(entry,/<ReleaseForm/);
});

test('persisted GitFinder shares product preview rendering; image-less drafts never borrow its logo', async () => {
  const [route, view] = await Promise.all([source('app/[locale]/products/[slug]/page.tsx'),source('components/database-product-page.tsx')]);
  assert.match(route,/slug === "gitfinder-2" && source === "migration-fallback"/);
  assert.doesNotMatch(view,/\|\| "\/gitfinder-2\//);
  assert.match(view,/product-preview-surface/);
});
