import "./helpers/store-test-loader.mjs";
import assert from "node:assert/strict";
import { createHash, generateKeyPairSync, sign } from "node:crypto";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test, { before, beforeEach, afterEach } from "node:test";
import type { AdminProductReleaseRow } from "../lib/store/types.ts";
let root: string;
const original = process.env.RELEASE_STORAGE_ROOT;
let catalog: typeof import("../lib/store/file-catalog.ts");
let download: typeof import("../lib/store/downloads.ts");
let feeds: typeof import("../app/updates/open-play/[file]/route.ts");
let packages: typeof import("../app/downloads/[file]/route.ts");
let signatures: typeof import("../lib/store/open-play-signatures.ts");
let NextRequest: typeof import("next/server.js").NextRequest;
before(async () => {
  catalog = await import("../lib/store/file-catalog.ts"); download = await import("../lib/store/downloads.ts");
  feeds = await import("../app/updates/open-play/[file]/route.ts"); packages = await import("../app/downloads/[file]/route.ts");
  signatures = await import("../lib/store/open-play-signatures.ts"); ({ NextRequest } = await import("next/server.js"));
});
beforeEach(async () => { root = await mkdtemp(path.join(os.tmpdir(), "open-play-routes-")); process.env.RELEASE_STORAGE_ROOT = root; });
afterEach(async () => { await rm(root, { recursive: true, force: true }); if (original === undefined) delete process.env.RELEASE_STORAGE_ROOT; else process.env.RELEASE_STORAGE_ROOT = original; });
async function fixture() {
  const mac = generateKeyPairSync("ed25519"), windows = generateKeyPairSync("ed25519");
  const key = (pair: typeof mac) => (pair.publicKey.export({ format: "der", type: "spki" }) as Buffer).subarray(-32).toString("base64");
  const version = "0.6.6.12", build = 672, macName = `open-play-${version}-macos.zip`, winName = `open-play-${version}-windows-x64.zip`;
  const m = Buffer.from("synthetic-mac-package"), w = Buffer.from("synthetic-win-package");
  const xml = Buffer.from(`<?xml version="1.0"?><rss xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle"><channel><item><sparkle:version>${build}</sparkle:version><sparkle:shortVersionString>${version}</sparkle:shortVersionString><enclosure url="https://oaktechz.com/downloads/${macName}" length="${m.length}" sparkle:edSignature="${sign(null, m, mac.privateKey).toString("base64")}"></enclosure></item></channel></rss>`);
  const appcast = Buffer.concat([xml, Buffer.from(`<!-- sparkle-signatures:\nedSignature: ${sign(null, xml, mac.privateKey).toString("base64")}\nlength: ${xml.length}\n-->\n`.replaceAll("\\n", "\n"))]);
  const payload = Buffer.from(JSON.stringify({ schema: 1, app: "local.codex-auth-switcher", platform: "windows-amd64", channel: "stable", version, build,
    url: `https://oaktechz.com/downloads/${winName}`, size: w.length, sha256: createHash("sha256").update(w).digest("hex"),
    issuedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString() }));
  const map = new Map([["appcast.xml", appcast], ["windows.json", Buffer.from(JSON.stringify({ payload: payload.toString("base64"), signature: sign(null, payload, windows.privateKey).toString("base64") }))], [macName, m], [winName, w]]);
  const release: AdminProductReleaseRow = { id: "test-open-play", product_slug: "open-play", version, channel: "stable", status: "published", is_current: true,
    published_at: new Date().toISOString(), title_en: "Synthetic", title_zh: "测试", notes_en: "Test", notes_zh: "测试", release_artifacts: [] };
  for (const [name, bytes] of Array.from(map)) {
    const storage = `open-play/stable/${version}/${name}`; await mkdir(path.dirname(path.join(root, storage)), { recursive: true }); await writeFile(path.join(root, storage), bytes);
    release.release_artifacts.push({ id: name, release_id: release.id, file_name: name, storage_path: storage, public_path: `/releases/${storage}`, size_bytes: bytes.length,
      sha512: createHash("sha512").update(bytes).digest("hex"), platform: name.includes("macos") ? "macos" : "windows", architecture: "any", package_kind: name.endsWith("zip") ? "zip" : "manifest", content_type: "application/octet-stream" });
  }
  await catalog.mutateStoreCatalog((c) => { c.releases = [release]; });
  return { release, map, keys: { mac: key(mac), windows: key(windows) }, read: async (a: AdminProductReleaseRow["release_artifacts"][number]) => map.get(a.file_name)! };
}
test("published signed feeds and packages pass independent pinned-key validation", async () => {
  const f = await fixture(); await signatures.verifyOpenPlayRelease(f.release, f.read, f.keys);
});
test("feed compatibility GET returns exact signed bytes, correct MIME and noncacheable content", async () => {
  const f = await fixture();
  const response = await feeds.GET(new NextRequest("https://oaktechz.com/updates/open-play/appcast.xml"), { params: Promise.resolve({ file: "appcast.xml" }) });
  assert.equal(response.status, 200); assert.equal(response.headers.get("content-type"), "application/xml; charset=utf-8");
  assert.match(response.headers.get("cache-control")!, /no-store/); assert.match(response.headers.get("cache-control")!, /no-transform/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), f.map.get("appcast.xml"));
});
test("Windows feed HEAD is anonymous, bodyless and correctly typed", async () => {
  await fixture(); const response = await feeds.HEAD(new NextRequest("https://oaktechz.com/updates/open-play/windows.json"), { params: Promise.resolve({ file: "windows.json" }) });
  assert.equal(response.status, 200); assert.equal(response.headers.get("content-type"), "application/json; charset=utf-8"); assert.equal(await response.text(), "");
});
test("fixed package alias supports range, size and immutable metadata", async () => {
  const f = await fixture(); const name = `open-play-${f.release.version}-macos.zip`;
  const response = await packages.GET(new NextRequest(`https://oaktechz.com/downloads/${name}`, { headers: { range: "bytes=0-4" } }), { params: Promise.resolve({ file: name }) });
  assert.equal(response.status, 206); assert.equal(response.headers.get("content-length"), "5"); assert.match(response.headers.get("cache-control")!, /immutable/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), f.map.get(name)!.subarray(0, 5));
});
test("drafts, unpublished products and migration placeholders never become updater feeds", async () => {
  assert.equal(await download.resolveOpenPlayDownload("appcast.xml", true), null);
  await fixture(); await catalog.mutateStoreCatalog((c) => { c.releases[0].status = "draft"; });
  assert.equal(await download.resolveOpenPlayDownload("appcast.xml", true), null);
  await catalog.mutateStoreCatalog((c) => { c.releases[0].status = "published"; c.products.find((p) => p.slug === "open-play")!.visibility = "draft"; });
  assert.equal(await download.resolveOpenPlayDownload("windows.json", true), null);
});
test("ambiguous current versions fail closed while historical package aliases stay readable", async () => {
  const f = await fixture(); await catalog.mutateStoreCatalog((c) => { c.releases.push({ ...c.releases[0], id: "conflicting", release_artifacts: [] }); });
  assert.equal(await download.resolveOpenPlayDownload("appcast.xml", true), null);
  assert.ok(await download.resolveOpenPlayDownload(`open-play-${f.release.version}-macos.zip`, false));
});
test("unknown paths, encoded traversal and unrelated files never map to the storage root", async () => {
  await fixture(); for (const name of ["../catalog.json", "%2e%2e", "catalog.json", "appcast.xml/extra", "windows.json\\..", "open-play-0.6.6.12-macos.zip?x=1"]) {
    assert.equal(await download.resolveOpenPlayDownload(name, true), null); assert.equal(await download.resolveOpenPlayDownload(name, false), null);
  }
});
test("missing signed artifacts prevent publication verification", async () => {
  const f = await fixture(); f.release.release_artifacts.pop(); await assert.rejects(signatures.verifyOpenPlayRelease(f.release, f.read, f.keys), /SIGNED_ARTIFACTS_REQUIRED/);
});
test("tampered Mac feed and package signatures are rejected", async () => {
  const f = await fixture(); const original = f.map.get("appcast.xml")!; f.map.set("appcast.xml", Buffer.from(original.toString().replace("672", "673")));
  await assert.rejects(signatures.verifyOpenPlayRelease(f.release, f.read, f.keys), /SIGNATURE_INVALID/);
  f.map.set("appcast.xml", original); f.map.set("open-play-0.6.6.12-macos.zip", Buffer.from("synthetic-bad-package"));
  await assert.rejects(signatures.verifyOpenPlayRelease(f.release, f.read, f.keys), /SIGNATURE_INVALID/);
});
test("mismatched release versions and tampered Windows envelopes fail closed", async () => {
  const f = await fixture(); const envelope = JSON.parse(f.map.get("windows.json")!.toString()); envelope.payload = Buffer.from("{}").toString("base64");
  f.map.set("windows.json", Buffer.from(JSON.stringify(envelope))); await assert.rejects(signatures.verifyOpenPlayRelease(f.release, f.read, f.keys), /SIGNATURE_INVALID/);
});
