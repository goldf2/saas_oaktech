import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { resolveProductIcon } from "../lib/store/product-assets.ts";
import { PRODUCTS } from "../config/products.ts";

const source = (name: string) => readFile(new URL(`../${name}`, import.meta.url), "utf8");

test("Chanxu and Open Play keep separate product identities and actual artwork bytes", async () => {
  const chanxu = PRODUCTS.find((item) => item.slug === "chanxu-tradingview")!;
  const auth = PRODUCTS.find((item) => item.slug === "open-play")!;
  assert.equal(chanxu.categorySlug, "trading-tools");
  assert.equal(auth.categorySlug, "desktop-apps");
  assert.match(chanxu.name, /缠序/);
  assert.match(auth.description, /auth\.json/);
  const digest = async (url: string) => createHash("sha256").update(await readFile(new URL(`../public${url}`, import.meta.url))).digest("hex");
  assert.notEqual(await digest(chanxu.icon), await digest(auth.icon), "Different URLs must not contain the same authentication-tool image");
});

test("Dashboard uses the published catalog instead of a hardcoded beta-only list", async () => {
  const dashboard = await source("app/dashboard/page.tsx");
  const list = await source("components/admin/product-management.tsx");
  assert.match(list, /listPublicWorkspaceItems/);
  assert.doesNotMatch(dashboard, /PRODUCTS\.filter/);
  assert.match(dashboard, /ProductManagement searchParams/);
});

test("product creation has a dedicated page and discoverable desktop and mobile administration", async () => {
  const [page, listing, mobile, dashboard] = await Promise.all([
    source("app/admin/products/new/page.tsx"), source("components/admin/product-management.tsx"),
    source("components/mobile-nav.tsx"), source("app/dashboard/page.tsx"),
  ]);
  assert.match(page, /getStoreAdmin/);
  assert.match(page, /ProductWorkspace/);
  assert.match(listing, /\/admin\/products\/new/);
  assert.match(mobile, /href="\/dashboard"/);
  assert.doesNotMatch(mobile, /href="\/admin"/);
  assert.match(dashboard, /getStoreAdmin/);
});

test("only the known incorrect legacy Chanxu icon is normalized", () => {
  assert.equal(resolveProductIcon("chanxu-tradingview", "/chanxu-tradingview/icon.png"), "/chanxu-tradingview/icon-chanxu-v2.png");
  assert.equal(resolveProductIcon("open-play", "/open-play/icon.png"), "/open-play/icon.png");
  assert.equal(resolveProductIcon("chanxu-tradingview", "https://assets.example.com/custom.png"), "https://assets.example.com/custom.png");
});
