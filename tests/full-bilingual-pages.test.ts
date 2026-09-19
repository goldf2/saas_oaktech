import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { languageTarget } from "../i18n/config.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
async function source(relative: string) { return readFile(path.join(root, relative), "utf8"); }
async function pages(dir = path.join(root, "app")): Promise<string[]> {
  const result: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await pages(full));
    else if (entry.name === "page.tsx" || entry.name === "page.ts") result.push(path.relative(root, full));
  }
  return result.sort();
}

test("every visible page is locale-aware or an explicit redirect/alias", async () => {
  const redirectOnly = new Set([
    "app/admin/page.tsx",
    "app/admin/software/page.tsx",
    "app/admin/products/page.tsx",
    "app/admin/releases/page.tsx",
  ]);
  const all = await pages();
  assert.ok(all.length >= 25, "route audit unexpectedly lost pages");
  const missing: string[] = [];
  for (const file of all) {
    if (redirectOnly.has(file)) continue;
    const text = await source(file);
    const localizedRoute = file.includes("[locale]");
    const aware = localizedRoute
      ? /isLocale\(|params:\s*Promise<\{\s*locale|params.*locale/.test(text)
      : /getRequestLanguage\(/.test(text);
    if (!aware) missing.push(file);
  }
  assert.deepEqual(missing, []);
});

test("neutral public and account pages do not pin English data or renderer props", async () => {
  const all = await pages();
  const joined = (await Promise.all(all.map(source))).join("\n");
  assert.doesNotMatch(joined, /listPublicProducts\(["']en["']\)/);
  assert.doesNotMatch(joined, /getPublicProduct\([^\n]+,\s*["']en["']/);
  assert.doesNotMatch(joined, /locale=["']en["']/);
  for (const file of [
    "app/page.tsx", "app/products/page.tsx", "app/products/[slug]/page.tsx",
    "app/products/[slug]/releases/page.tsx", "app/about/page.tsx", "app/support/page.tsx",
    "app/privacy/page.tsx", "app/terms/page.tsx", "app/(auth-pages)/sign-in/page.tsx",
    "app/(auth-pages)/sign-up/page.tsx", "app/(auth-pages)/forgot-password/page.tsx",
    "app/dashboard/page.tsx", "app/dashboard/reset-password/page.tsx",
    "app/products/[slug]/install/page.tsx", "app/products/[slug]/privacy/page.tsx",
    "app/products/[slug]/support/page.tsx",
  ]) assert.match(await source(file), /getRequestLanguage\(/, file);
});

test("shared administration surfaces consume current locale rather than fixed Chinese UI", async () => {
  assert.match(await source("components/admin/product-management.tsx"), /locale\?:\s*Locale/);
  for (const file of [
    "components/admin/product-workspace.tsx",
    "components/admin/product-details-editor.tsx",
    "components/admin/product-video-editor.tsx",
    "components/admin/platform-picker.tsx",
    "components/admin/product-releases.tsx",
    "components/admin/artifact-upload.tsx",
    "components/admin/publication-review.tsx",
    "components/admin/product-publication-summary.tsx",
    "components/admin/release-file-list.tsx",
    "components/admin/action-form.tsx",
  ]) assert.match(await source(file), /useLocale\(/, file);
  assert.match(await source("components/admin/access-notice.tsx"), /getRequestLanguage\(/);
  assert.match(await source("lib/store/workspace-navigation.ts"), /locale:\s*Locale/);
  assert.match(await source("lib/store/workspace-product-list.ts"), /locale:\s*Locale/);
});

test("same-path language switching is supported for neutral pages and localized catalog targets stay explicit", () => {
  for (const route of ["/about", "/support", "/privacy", "/terms", "/sign-in", "/sign-up", "/forgot-password", "/dashboard", "/admin/products/open-play", "/products/x-tweet-extractor/install"]) {
    assert.equal(languageTarget(route, "zh"), route);
    assert.equal(languageTarget(route, "en"), route);
  }
  assert.equal(languageTarget("/products", "zh"), "/zh");
  assert.equal(languageTarget("/products/open-play", "en"), "/en/products/open-play");
});

test("central page copy contains Chinese and English contracts for major neutral pages", async () => {
  const copy = await source("i18n/page-copy.ts");
  for (const section of ["auth", "about", "support", "privacy", "terms", "dashboard", "products", "productUtility"]) assert.match(copy, new RegExp("const " + section));
  assert.match(copy, /en:\s*\{/);
  assert.match(copy, /zh:\s*\{/);
  assert.match(copy, /Privacy Policy/);
  assert.match(copy, /隐私政策/);
  assert.match(copy, /Terms of Service/);
  assert.match(copy, /服务条款/);
});
