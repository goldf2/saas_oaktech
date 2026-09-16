import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import test, { type TestContext } from "node:test";
import { MIGRATION_ID, planProductRecovery, restoreProductListings } from "../scripts/restore-product-listings.mjs";

function originalCatalog() {
  return {
    schemaVersion: 1,
    updatedAt: "2026-09-03T00:00:00Z",
    products: [{ id: "existing-x", slug: "x-tweet-extractor", visibility: "published", custom: "keep" }, { id: "existing-gitfinder", slug: "gitfinder-2", visibility: "published" }],
    releases: [
      { id: "public-release", product_slug: "gitfinder-2", status: "published", is_current: true, version: "2.0.0-alpha.86", release_artifacts: [{ id: "a", storage_path: "unchanged.zip", sha512: "untouched" }] },
      { id: "private-release", product_slug: "open-play", status: "draft", is_current: false, version: "0.6.6.11", release_artifacts: [] },
    ],
    customRootField: { keep: true },
  };
}

async function fixture(t: TestContext) {
  const root = await mkdtemp(path.join(os.tmpdir(), "oaktech-product-recovery-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const initial = originalCatalog();
  const raw = `${JSON.stringify(initial)}\n`;
  await writeFile(path.join(root, "catalog.json"), raw, { mode: 0o640 });
  return { root, initial, raw };
}

test("recovery inserts exactly the two requested listings without publishing releases", () => {
  const initial = originalCatalog();
  const plan = planProductRecovery(initial);
  assert.equal(plan.catalog.products.length, 4);
  assert.deepEqual(plan.catalog.products.slice(0, 2), initial.products);
  assert.deepEqual(plan.catalog.releases, initial.releases);
  assert.deepEqual(plan.catalog.customRootField, initial.customRootField);
  assert.equal(initial.products.length, 2, "planning is nonmutating");
  const auth = plan.catalog.products.find((product: { slug: string }) => product.slug === "open-play")!;
  const chanxu = plan.catalog.products.find((product: { slug: string }) => product.slug === "chanxu-tradingview")!;
  assert.equal(auth.visibility, "published");
  assert.equal(chanxu.visibility, "published");
  assert.equal(auth.category_slug, "desktop-apps");
  assert.equal(chanxu.category_slug, "trading-tools");
  assert.notEqual(auth.icon_url, chanxu.icon_url);
  assert.match(auth.name_zh, /认证/);
  assert.match(chanxu.name_zh, /缠论/);
});

test("existing product content and IDs are preserved; only requested visibility changes", () => {
  const initial = originalCatalog();
  initial.products.push({ id: "operator-auth", slug: "open-play", visibility: "draft", custom: "custom-name-price-and-assets" });
  const plan = planProductRecovery(initial);
  const actual = plan.catalog.products.find((product: { slug: string }) => product.slug === "open-play");
  assert.deepEqual(actual, { ...initial.products[2], visibility: "published" });
  assert.deepEqual(plan.changes, [{ slug: "open-play", operation: "make-visible" }, { slug: "chanxu-tradingview", operation: "insert" }]);
});

test("schema, duplicate slugs and conflicting IDs fail closed", () => {
  assert.throws(() => planProductRecovery({ ...originalCatalog(), schemaVersion: 2 }), /STORE_CATALOG_INVALID/);
  assert.throws(() => planProductRecovery({ ...originalCatalog(), dataMigrations: "bad" }), /STORE_CATALOG_INVALID/);
  const duplicate = originalCatalog();
  duplicate.products.push({ id: "1", slug: "open-play", visibility: "draft" }, { id: "2", slug: "open-play", visibility: "draft" });
  assert.throws(() => planProductRecovery(duplicate), /DUPLICATE_PRODUCT_SLUG/);
  const collision = originalCatalog();
  collision.products.push({ id: "restored-open-play-20260916", slug: "different-product", visibility: "draft" });
  assert.throws(() => planProductRecovery(collision), /PRODUCT_ID_CONFLICT/);
});

test("dry run leaves the catalog and directory byte-for-byte untouched", async (t) => {
  const { root, raw } = await fixture(t);
  const result = await restoreProductListings(root, { dryRun: true });
  assert.equal(result.status, "dry-run");
  assert.equal(await readFile(path.join(root, "catalog.json"), "utf8"), raw);
  assert.deepEqual(await readdir(root), ["catalog.json"]);
});

test("actual migration creates an exact private backup and atomically records completion", async (t) => {
  const { root, initial, raw } = await fixture(t);
  const result = await restoreProductListings(root);
  assert.equal(result.status, "applied");
  const catalog = JSON.parse(await readFile(path.join(root, "catalog.json"), "utf8"));
  assert.equal(catalog.products.length, 4);
  assert.deepEqual(catalog.releases, initial.releases);
  assert.equal(catalog.dataMigrations.length, 1);
  assert.equal(catalog.dataMigrations[0].id, MIGRATION_ID);
  const backup = path.join(root, catalog.dataMigrations[0].backupPath);
  assert.equal(await readFile(backup, "utf8"), raw);
  assert.equal((await stat(backup)).mode & 0o777, 0o600);
  const mode = (await stat(path.join(root, "catalog.json"))).mode & 0o777;
  assert.equal(mode & 0o007, 0, "no world-readable catalog introduced");
});

test("restarts never undo a later administrator unpublish or delete", async (t) => {
  const { root } = await fixture(t);
  await restoreProductListings(root);
  const file = path.join(root, "catalog.json");
  const catalog = JSON.parse(await readFile(file, "utf8"));
  catalog.products = catalog.products.filter((product: { slug: string }) => product.slug !== "chanxu-tradingview");
  catalog.products.find((product: { slug: string }) => product.slug === "open-play").visibility = "draft";
  const expected = JSON.stringify(catalog);
  await writeFile(file, expected);
  assert.equal((await restoreProductListings(root)).status, "already-applied");
  assert.equal(await readFile(file, "utf8"), expected);
});

test("concurrent startup invocations apply only once", async (t) => {
  const { root } = await fixture(t);
  const results = await Promise.all([restoreProductListings(root), restoreProductListings(root)]);
  assert.deepEqual(results.map((result) => result.status).sort(), ["already-applied", "applied"]);
  const catalog = JSON.parse(await readFile(path.join(root, "catalog.json"), "utf8"));
  assert.equal(catalog.products.length, 4);
  assert.equal(catalog.dataMigrations.length, 1);
  assert.equal((await readdir(path.join(root, ".catalog-migrations", "backups"))).length, 1);
});

test("missing configuration/catalog does not invent a new production store", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "oaktech-empty-recovery-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  assert.equal((await restoreProductListings(undefined)).status, "skipped");
  assert.equal((await restoreProductListings(root)).status, "skipped");
  assert.deepEqual(await readdir(root), []);
  await assert.rejects(() => restoreProductListings("relative-root"), /MUST_BE_ABSOLUTE/);
});

test("malformed catalog remains untouched and startup command returns a failure", async (t) => {
  const { root } = await fixture(t);
  const file = path.join(root, "catalog.json");
  await writeFile(file, "not valid JSON");
  await assert.rejects(() => restoreProductListings(root));
  const result = spawnSync(process.execPath, [path.resolve("scripts/restore-product-listings.mjs")], { env: { ...process.env, RELEASE_STORAGE_ROOT: root }, encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /migration.failed/);
  assert.equal(await readFile(file, "utf8"), "not valid JSON");
});

test("production invokes recovery before starting the web service", async () => {
  const dockerfile = await readFile(new URL("../Dockerfile", import.meta.url), "utf8");
  assert.match(dockerfile, /node scripts\/restore-product-listings\.mjs && exec node server\.js/);
  assert.match(dockerfile, /COPY.*20260916-product-listings\.json/);
});
