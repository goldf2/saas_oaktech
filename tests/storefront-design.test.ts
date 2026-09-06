import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { localeFromAcceptLanguage } from "../i18n/config.ts";

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

test("header exposes one account entry while auth pages keep contextual switching", async () => {
  const header = await source("../components/header.tsx");
  const mobileNav = await source("../components/mobile-nav.tsx");
  const signIn = await source("../app/(auth-pages)/sign-in/page.tsx");
  const signUp = await source("../app/(auth-pages)/sign-up/page.tsx");

  assert.match(header, /copy\.account/);
  assert.match(header, /href="\/sign-in"/);
  assert.doesNotMatch(header, /copy\.signUp/);
  assert.match(mobileNav, /labels\.account/);
  assert.doesNotMatch(mobileNav, /labels\.signUp/);
  assert.match(signIn, /href="\/sign-up"/);
  assert.match(signUp, /href="\/sign-in"/);
});

test("browser language detection chooses a supported locale and keeps explicit paths authoritative", async () => {
  const proxy = await source("../proxy.ts");

  assert.equal(localeFromAcceptLanguage("zh-CN,zh;q=0.9,en;q=0.8"), "zh");
  assert.equal(localeFromAcceptLanguage("en-US,en;q=0.9,zh;q=0.8"), "en");
  assert.equal(localeFromAcceptLanguage("fr-FR,ja;q=0.9"), "en");
  assert.equal(localeFromAcceptLanguage("en;q=0.4,zh;q=0.9"), "zh");
  assert.match(proxy, /LOCALE_COOKIE/);
  assert.match(proxy, /pathname === "\/"/);
  assert.match(proxy, /matcher:\s*\["\/", "\/en", "\/en\/products\/:path\*", "\/zh", "\/zh\/products\/:path\*"/);
});
