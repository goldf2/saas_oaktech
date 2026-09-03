import assert from "node:assert/strict";
import test from "node:test";
import { isStoreAdmin, selectPublishedRows } from "../lib/store/policy.ts";

test("admin access fails closed when no allowlist is configured", () => {
  assert.equal(isStoreAdmin({ id: "user-1", email: "owner@example.com" }, {}), false);
});

test("admin access accepts an exact configured user id or normalized email", () => {
  assert.equal(isStoreAdmin({ id: "user-1" }, { userIds: "user-1,user-2" }), true);
  assert.equal(isStoreAdmin({ email: "Owner@Example.com" }, { emails: "owner@example.com" }), true);
  assert.equal(isStoreAdmin({ id: "other", email: "other@example.com" }, { userIds: "user-1", emails: "owner@example.com" }), false);
});

test("public release selection removes drafts and keeps the current release first", () => {
  const rows = selectPublishedRows([
    { id: "draft", status: "draft" as const, is_current: false, published_at: null },
    { id: "old", status: "published" as const, is_current: false, published_at: "2026-08-01T00:00:00Z" },
    { id: "current", status: "published" as const, is_current: true, published_at: "2026-07-01T00:00:00Z" },
  ]);
  assert.deepEqual(rows.map((row) => row.id), ["current", "old"]);
});
