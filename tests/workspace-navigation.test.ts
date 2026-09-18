import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { workspaceView, workspaceSections, workspaceProductsHref } from '../lib/store/workspace-navigation.ts';

test('one product view serves both roles and legacy library links without treating a view as a role', () => {
  assert.equal(workspaceView(undefined, true), 'products');
  assert.equal(workspaceView(undefined, false), 'products');
  assert.equal(workspaceView('products', false), 'products');
  assert.equal(workspaceView('account', false), 'account');
  for (const forged of ['admin', 'super_admin', ['products'], { admin: true }]) assert.equal(workspaceView(forged, false), 'products');
});
test('both roles get one product tab plus account and no separate software-library tab', () => {
  assert.deepEqual(workspaceSections(false).map(x => x.view), ['products', 'account']);
  assert.deepEqual(workspaceSections(true).map(x => x.view), ['products', 'account']);
});
test('old product filters map only to the canonical local workspace', () => {
  assert.equal(workspaceProductsHref(), '/dashboard?view=products');
  const url = new URL(workspaceProductsHref({ q: ' a & b ', state: 'draft' }), 'https://store.example');
  assert.equal(url.pathname, '/dashboard'); assert.equal(url.searchParams.get('q'), 'a & b'); assert.equal(url.searchParams.get('state'), 'draft');
  assert.equal(workspaceProductsHref({ q: ['secret'], state: 'https://other.example' }), '/dashboard?view=products');
  assert.equal(new URL(workspaceProductsHref({ q: 'x'.repeat(300) }), 'https://store.example').searchParams.get('q')?.length, 200);
});
test('shared management component authorizes before reading private catalog and legacy routes still gate', () => {
  const shared = readFileSync(new URL('../components/admin/product-management.tsx', import.meta.url), 'utf8');
  assert.ok(shared.indexOf('await getStoreAdmin()') < shared.indexOf('await readStoreCatalog()'));
  assert.match(shared, /if \(administrator\)/); assert.match(shared, /else \{\s*items = await listPublicWorkspaceItems/);
  const route = readFileSync(new URL('../app/admin/products/page.tsx', import.meta.url), 'utf8');
  assert.match(route, /getStoreAdmin/); assert.match(route, /redirect\(workspaceProductsHref/);
});
test('desktop and mobile navigation expose one workspace entry and no second admin button', () => {
  for (const file of ['../components/header.tsx', '../components/mobile-nav.tsx']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.equal((source.match(/href="\/dashboard"/g) ?? []).length, 1);
    assert.doesNotMatch(source, /href="\/admin"/);
  }
});
test('unified dashboard does not pretend static license counters are verified customer purchases', () => {
  const source = readFileSync(new URL('../app/dashboard/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /ProductManagement searchParams/); assert.match(source, /workspaceView/);
  assert.doesNotMatch(source, /Owned Products|Active Licenses|haven&apos;t purchased/);
});

test('legacy library requests canonicalize to the single list without a duplicate renderer', () => {
  const source = readFileSync(new URL('../app/dashboard/page.tsx', import.meta.url), 'utf8');
  assert.match(source, /query\.view === "library"\) redirect\(workspaceProductsHref\(query\)\)/);
  assert.doesNotMatch(source, /function SoftwareLibrary|<SoftwareLibrary/);
});
