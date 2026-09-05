import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path: string) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("storefront design tokens cover platform appearance and accessibility preferences", async () => {
  const css = await source("../app/globals.css");

  for (const token of [
    "--store-canvas",
    "--store-surface",
    "--store-blue",
    "--store-radius-card",
    "--store-shadow-soft",
  ]) {
    assert.match(css, new RegExp(token));
  }

  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /prefers-reduced-transparency:\s*reduce/);
  assert.match(css, /prefers-contrast:\s*more/);
  assert.match(css, /-apple-system/);
});

test("home pages render the live catalog through one reusable storefront", async () => {
  const rootHome = await source("../app/page.tsx");
  const localizedHome = await source("../app/[locale]/page.tsx");
  const storefront = await source("../components/storefront-home.tsx");

  assert.match(rootHome, /listPublicProducts\("en"\)/);
  assert.match(localizedHome, /listPublicProducts\(locale\)/);
  assert.match(rootHome, /<StorefrontHome/);
  assert.match(localizedHome, /<StorefrontHome/);
  assert.match(storefront, /id="collection"/);
});

test("current and historical release views share verified download cards", async () => {
  const detail = await source("../components/gitfinder-product-page.tsx");
  const history = await source("../components/product-release-history.tsx");
  const downloadCard = await source("../components/store-download-card.tsx");

  assert.match(detail, /<StoreDownloadCard/);
  assert.match(history, /<StoreDownloadCard/);
  assert.match(downloadCard, /download=\{artifact\.fileName\}/);
  assert.match(downloadCard, /aria-label=/);
  assert.match(downloadCard, /SHA-512/);
});
