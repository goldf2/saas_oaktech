import "./helpers/store-test-loader.mjs";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { afterEach, before, beforeEach } from "node:test";
import type { AdminProductReleaseRow, AdminStoreProductRow } from "../lib/store/types.ts";

let mutateStoreCatalog: typeof import("../lib/store/file-catalog.ts").mutateStoreCatalog;
let readStoreCatalog: typeof import("../lib/store/file-catalog.ts").readStoreCatalog;
let saveProductAction: typeof import("../app/admin/actions.ts").saveProductAction;
let saveReleaseDraftAction: typeof import("../app/admin/actions.ts").saveReleaseDraftAction;
let publishReleaseAction: typeof import("../app/admin/actions.ts").publishReleaseAction;
let prepareUpdaterManifests: typeof import("../lib/store/storage.ts").prepareUpdaterManifests;
let absoluteReleasePath: typeof import("../lib/store/storage.ts").absoluteReleasePath;
let parseReleaseImport: typeof import("../lib/store/release-contract.ts").parseReleaseImport;
let GET: typeof import("../app/releases/[...path]/route.ts").GET;
let HEAD: typeof import("../app/releases/[...path]/route.ts").HEAD;
let uploadArtifact: typeof import("../app/api/admin/releases/upload/route.ts").POST;
let NextRequest: typeof import("next/server.js").NextRequest;

before(async () => {
  ({ mutateStoreCatalog, readStoreCatalog } = await import("../lib/store/file-catalog.ts"));
  ({ saveProductAction, saveReleaseDraftAction, publishReleaseAction } = await import("../app/admin/actions.ts"));
  ({ prepareUpdaterManifests, absoluteReleasePath } = await import("../lib/store/storage.ts"));
  ({ parseReleaseImport } = await import("../lib/store/release-contract.ts"));
  ({ GET, HEAD } = await import("../app/releases/[...path]/route.ts"));
  ({ POST: uploadArtifact } = await import("../app/api/admin/releases/upload/route.ts"));
  ({ NextRequest } = await import("next/server.js"));
});

const originalRoot = process.env.RELEASE_STORAGE_ROOT;
let root: string;
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "oaktech-store-regression-"));
  process.env.RELEASE_STORAGE_ROOT = root;
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  if (originalRoot === undefined) delete process.env.RELEASE_STORAGE_ROOT;
  else process.env.RELEASE_STORAGE_ROOT = originalRoot;
});

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

async function resultOf(action: (data: FormData) => Promise<unknown>, data: FormData): Promise<{ code?: string; error?: string; url?: string }> {
  try {
    return (await action(data)) as { code?: string; error?: string } ?? {};
  } catch (error) {
    const caught = error as Error & { url?: string };
    if (caught.message === "TEST_REDIRECT") return { url: caught.url };
    return { code: caught.message, error: caught.message };
  }
}

function productForm(product: AdminStoreProductRow, id = product.id) {
  return form({ ...product, id, gallery_urls: JSON.stringify(product.gallery_urls ?? []), supported_platforms: product.supported_platforms.join(", "), featured: product.featured ? "on" : "" } as Record<string, string>);
}

function draft(overrides: Partial<AdminProductReleaseRow> = {}): AdminProductReleaseRow {
  return {
    id: "test-release", product_slug: "gitfinder-2", version: "2.0.0-alpha.99", channel: "alpha",
    status: "draft", is_current: false, published_at: null,
    source_commit: "0123456789abcdef0123456789abcdef01234567",
    title_en: "Test release", title_zh: "测试版本", notes_en: "Test notes", notes_zh: "测试说明",
    release_artifacts: [], ...overrides,
  };
}

function releaseForm(release: AdminProductReleaseRow) {
  return form(Object.fromEntries(["id", "product_slug", "version", "channel", "title_en", "title_zh", "notes_en", "notes_zh"].map((key) => [key, String(release[key as keyof AdminProductReleaseRow])])));
}

async function saveFixture(release: AdminProductReleaseRow) {
  await mutateStoreCatalog((catalog) => { catalog.releases.push(release); });
}

async function artifactFixture(release: AdminProductReleaseRow, overrides: Record<string, unknown> = {}) {
  const bytes = Buffer.from("verified software package fixture");
  const storagePath = `${release.product_slug}/${release.channel}/${release.version}/fixture.zip`;
  const artifact = {
    id: "test-artifact", release_id: release.id, platform: "chrome", architecture: "universal", package_kind: "zip",
    file_name: "fixture.zip", storage_path: storagePath, public_path: `/releases/${storagePath}`,
    size_bytes: bytes.length, sha512: createHash("sha512").update(bytes).digest("hex"), content_type: "application/zip", ...overrides,
  } as AdminProductReleaseRow["release_artifacts"][number];
  await mkdir(path.dirname(absoluteReleasePath(artifact.storage_path)), { recursive: true });
  await writeFile(absoluteReleasePath(artifact.storage_path), bytes);
  release.release_artifacts.push(artifact);
  return { artifact, bytes };
}

test("creating a duplicate product slug cannot replace its identity or content", async () => {
  const original = (await readStoreCatalog()).catalog.products[0];
  const result = await resultOf(saveProductAction, productForm({ ...original, name_en: "Accidental replacement" }, ""));
  assert.equal(result.code, "STORE_PRODUCT_SLUG_EXISTS");
  assert.deepEqual((await readStoreCatalog()).catalog.products.find((item) => item.slug === original.slug), original);
});

test("editing a nonexistent product id fails without overwriting the matching slug", async () => {
  const original = (await readStoreCatalog()).catalog.products[0];
  const result = await resultOf(saveProductAction, productForm(original, "missing-id"));
  assert.equal(result.code, "STORE_PRODUCT_NOT_FOUND");
  assert.equal((await readStoreCatalog()).catalog.products[0].id, original.id);
});

test("editing a product preserves its id and rejects changing its slug", async () => {
  const original = (await readStoreCatalog()).catalog.products[0];
  const saved = await resultOf(saveProductAction, productForm({ ...original, name_en: "Updated product" }));
  assert.match(saved.url ?? "", /saved=1/);
  assert.equal((await readStoreCatalog()).catalog.products[0].id, original.id);
  const changed = await resultOf(saveProductAction, productForm({ ...original, slug: "other-product" }));
  assert.equal(changed.code, "PRODUCT_SLUG_IMMUTABLE");
});

test("editing an imported draft retains its source commit and artifacts", async () => {
  const release = draft();
  await artifactFixture(release);
  await saveFixture(release);
  const saved = await resultOf(saveReleaseDraftAction, releaseForm({ ...release, notes_zh: "修改后的说明" }));
  assert.match(saved.url ?? "", /saved=1/);
  const actual = (await readStoreCatalog()).catalog.releases.find((item) => item.id === release.id)!;
  assert.equal(actual.source_commit, release.source_commit);
  assert.deepEqual(actual.release_artifacts, release.release_artifacts);
});

test("draft identity cannot move an existing artifact to a different release path", async () => {
  const release = draft();
  await artifactFixture(release);
  await saveFixture(release);
  const result = await resultOf(saveReleaseDraftAction, releaseForm({ ...release, version: "2.0.0-alpha.100" }));
  assert.equal(result.code, "RELEASE_IDENTITY_IMMUTABLE");
  assert.equal((await readStoreCatalog()).catalog.releases.find((item) => item.id === release.id)?.version, release.version);
});

test("web draft creation rejects a version that cannot be stored safely", async () => {
  const result = await resultOf(saveReleaseDraftAction, releaseForm(draft({ id: "", version: ".." })));
  assert.equal(result.code, "INVALID_RELEASE_VERSION");
});

test("machine import supports the four-part versions already used by Open Play", () => {
  const input = {
    schemaVersion: 1, productSlug: "open-play", version: "0.6.6.10", channel: "stable",
    sourceCommit: "0123456789abcdef", title: { en: "Release", zh: "发布" }, notes: { en: "Notes", zh: "说明" },
  };
  assert.equal(parseReleaseImport(input).version, "0.6.6.10");
  for (const version of ["..", "1/2/3", "1.2", "1.2.3.4.5"]) {
    assert.throws(() => parseReleaseImport({ ...input, version }), /INVALID_RELEASE_VERSION/);
  }
});

test("a verified browser-extension package can publish without Electron manifests", async () => {
  const release = draft({ product_slug: "x-tweet-extractor", version: "1.0.0", channel: "stable" });
  await artifactFixture(release);
  await saveFixture(release);
  assert.deepEqual(await prepareUpdaterManifests(release), []);
  const result = await resultOf(publishReleaseAction, form({ release_id: release.id }));
  assert.match(result.url ?? "", /published=1/);
  assert.equal((await readStoreCatalog()).catalog.releases.find((item) => item.id === release.id)?.status, "published");
});

test("all generic downloads still require byte and SHA-512 verification", async () => {
  const release = draft();
  const { artifact } = await artifactFixture(release);
  await writeFile(absoluteReleasePath(artifact.storage_path), "tampered");
  await assert.rejects(() => prepareUpdaterManifests(release), /ARTIFACT_SIZE_MISMATCH/);
  await assert.rejects(() => prepareUpdaterManifests(draft()), /RELEASE_ARTIFACT_REQUIRED/);
});

test("public GET, suffix Range and HEAD deliver exact bytes but never expose drafts", async () => {
  const release = draft({ status: "published", is_current: true, published_at: "2026-09-16T00:00:00Z" });
  const { artifact, bytes } = await artifactFixture(release);
  await saveFixture(release);
  const context = { params: Promise.resolve({ path: artifact.storage_path.split("/") }) };
  const request = (method: string, range?: string) => new NextRequest(`http://localhost${artifact.public_path}`, { method, headers: range ? { range } : {} });
  const full = await GET(request("GET"), context);
  assert.equal(full.status, 200);
  assert.deepEqual(Buffer.from(await full.arrayBuffer()), bytes);
  const range = await GET(request("GET", "bytes=-6"), context);
  assert.equal(range.status, 206);
  assert.deepEqual(Buffer.from(await range.arrayBuffer()), bytes.subarray(-6));
  const head = await HEAD(request("HEAD", "bytes=0-3"), context);
  assert.equal(head.status, 200);
  assert.equal(head.headers.get("content-length"), String(bytes.length));
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  await mutateStoreCatalog((catalog) => { catalog.releases.find((item) => item.id === release.id)!.status = "draft"; });
  assert.equal((await GET(request("GET"), context)).status, 404);
});

test("invalid or unsafe Range offsets are rejected and empty legacy files do not crash", async () => {
  const release = draft({ status: "published", is_current: true, published_at: "2026-09-16T00:00:00Z" });
  const { artifact } = await artifactFixture(release);
  await saveFixture(release);
  const context = { params: Promise.resolve({ path: artifact.storage_path.split("/") }) };
  for (const range of ["bytes=999-", "bytes=-0", "bytes=9-2", "bytes=0-1,3-4", `bytes=-${"9".repeat(320)}`]) {
    const response = await GET(new NextRequest(`http://localhost${artifact.public_path}`, { headers: { range } }), context);
    assert.equal(response.status, 416, range);
    assert.match(response.headers.get("content-range") ?? "", /^bytes \*\//);
  }
  await writeFile(absoluteReleasePath(artifact.storage_path), "");
  const empty = await GET(new NextRequest(`http://localhost${artifact.public_path}`), context);
  assert.equal(empty.status, 200);
  assert.equal((await empty.arrayBuffer()).byteLength, 0);
});

function uploadRequest(release: AdminProductReleaseRow, fileName: string) {
  const params = new URLSearchParams({ releaseId: release.id, platform: "chrome", architecture: "universal", packageKind: "zip", uploadId: randomUUID(), offset: "0", final: "true" });
  return new NextRequest(`http://localhost/api/admin/releases/upload?${params}`, {
    method: "POST", headers: { "x-oaktech-admin-upload": "1", "x-file-name": fileName, "content-type": "application/zip" }, body: "upload fixture",
  });
}

test("concurrent uploads cannot both commit into the same artifact slot", async () => {
  const release = draft();
  await saveFixture(release);
  const responses = await Promise.all([uploadArtifact(uploadRequest(release, "one.zip")), uploadArtifact(uploadRequest(release, "two.zip"))]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [200, 409]);
  const artifacts = (await readStoreCatalog()).catalog.releases.find((item) => item.id === release.id)!.release_artifacts;
  assert.equal(artifacts.length, 1);
  assert.equal((await stat(absoluteReleasePath(artifacts[0].storage_path))).size, "upload fixture".length);
});

test("audit write failure never deletes a file already referenced by the catalog", async () => {
  const release = draft();
  await saveFixture(release);
  await writeFile(path.join(root, "audit"), "simulate an unavailable audit directory");
  await uploadArtifact(uploadRequest(release, "audited.zip"));
  const artifacts = (await readStoreCatalog()).catalog.releases.find((item) => item.id === release.id)!.release_artifacts;
  assert.equal(artifacts.length, 1);
  assert.equal(await readFile(absoluteReleasePath(artifacts[0].storage_path), "utf8"), "upload fixture");
});

test("official product templates are distinct draft copies and never insert products", async () => {
  const { getStoreProductTemplate } = await import("../lib/store/file-catalog.ts");
  const initial = await readStoreCatalog();
  const auth = getStoreProductTemplate("open-play")!;
  const chanxu = getStoreProductTemplate("chanxu-tradingview")!;
  assert.equal(auth.id, "");
  assert.equal(auth.visibility, "draft");
  assert.equal(chanxu.visibility, "draft");
  assert.notEqual(auth.icon_url, chanxu.icon_url);
  assert.equal(chanxu.category_slug, "trading-tools");
  auth.name_zh = "not persisted";
  assert.notEqual(getStoreProductTemplate("open-play")?.name_zh, auth.name_zh);
  assert.deepEqual(await readStoreCatalog(), initial);
});
