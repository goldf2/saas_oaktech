import assert from "node:assert/strict";
import test from "node:test";
import { isStoreAdmin, selectPublishedRows } from "../lib/store/policy.ts";
import { parseReleaseImport, selectUpdaterArtifacts } from "../lib/store/release-contract.ts";
import { authenticateReleaseWriter } from "../lib/store/release-writer.ts";

test("admin access fails closed when no allowlist is configured", () => {
  assert.equal(isStoreAdmin({ id: "user-1", email: "owner@example.com" }, {}), false);
});

test("admin access accepts an exact configured user id or normalized email", () => {
  assert.equal(isStoreAdmin({ id: "user-1" }, { userIds: "user-1,user-2" }), true);
  assert.equal(isStoreAdmin({ provider: "casdoor", subject: "casdoor-user-1" }, { subjects: "casdoor-user-1" }), true);
  assert.equal(isStoreAdmin({ email: "Owner@Example.com" }, { emails: "owner@example.com" }), true);
  assert.equal(isStoreAdmin({ id: "other", subject: "other", email: "other@example.com" }, { userIds: "user-1", subjects: "casdoor-user-1", emails: "owner@example.com" }), false);
});

test("Casdoor administrator subjects are matched exactly", () => {
  const config = { subjects: "User-A, User-B" };
  assert.equal(isStoreAdmin({ provider: "casdoor", subject: "User-A" }, config), true);
  assert.equal(isStoreAdmin({ provider: "casdoor", subject: "user-a" }, config), false);
  assert.equal(isStoreAdmin({ provider: "casdoor", subject: " User-A" }, config), false);
});

test("Casdoor administrator access cannot fall back to a legacy user id or email", () => {
  const config = { subjects: "Casdoor-Owner", userIds: "legacy-owner", emails: "owner@example.com" };
  assert.equal(isStoreAdmin({ provider: "casdoor", subject: "Other-User", id: "legacy-owner", email: "owner@example.com" }, config), false);
  assert.equal(isStoreAdmin({ provider: "casdoor", id: "legacy-owner", email: "owner@example.com" }, config), false);
  assert.equal(isStoreAdmin({ provider: "supabase", id: "legacy-owner" }, config), true);
  assert.equal(isStoreAdmin({ provider: "supabase", subject: "Casdoor-Owner" }, config), false);
});

test("public release selection removes drafts and keeps the current release first", () => {
  const rows = selectPublishedRows([
    { id: "draft", status: "draft" as const, is_current: false, published_at: null },
    { id: "old", status: "published" as const, is_current: false, published_at: "2026-08-01T00:00:00Z" },
    { id: "current", status: "published" as const, is_current: true, published_at: "2026-07-01T00:00:00Z" },
  ]);
  assert.deepEqual(rows.map((row) => row.id), ["current", "old"]);
});

test("release workflow token fails closed and uses constant identity", () => {
  const token = "a".repeat(48);
  assert.equal(authenticateReleaseWriter(null, token), null);
  assert.equal(authenticateReleaseWriter("Bearer wrong", token), null);
  assert.equal(authenticateReleaseWriter(`Bearer ${"é".repeat(48)}`, token), null);
  assert.deepEqual(authenticateReleaseWriter(`Bearer ${token}`, token), {
    id: "release-workflow",
    email: "release-workflow@oaktechz.internal",
  });
});

test("release import contract requires version, commit and bilingual content", () => {
  const value = {
    schemaVersion: 1,
    productSlug: "gitfinder-2",
    version: "2.0.0-alpha.88",
    channel: "alpha",
    sourceCommit: "0123456789abcdef0123456789abcdef01234567",
    title: { en: "Release", zh: "发布" },
    notes: { en: "Changes", zh: "更新内容" },
  };
  assert.deepEqual(parseReleaseImport(value), value);
  assert.throws(() => parseReleaseImport({ ...value, sourceCommit: "dirty" }), /SOURCE_COMMIT/);
  assert.throws(() => parseReleaseImport({ ...value, notes: { en: "", zh: "" } }), /BILINGUAL/);
});

test("updater manifests exclude Windows portable ZIP and blockmap", () => {
  const artifacts = [
    { platform: "macos", package_kind: "zip" },
    { platform: "windows", package_kind: "nsis" },
    { platform: "windows", package_kind: "portable" },
    { platform: "windows", package_kind: "blockmap" },
  ] as never;
  const selected = selectUpdaterArtifacts(artifacts);
  assert.deepEqual(selected.mac.map((item) => item.package_kind), ["zip"]);
  assert.deepEqual(selected.windows.map((item) => item.package_kind), ["nsis"]);
});
