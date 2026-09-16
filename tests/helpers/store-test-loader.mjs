// Test-only Next.js adapters. Production code never imports this loader.
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const sourceUrl = (source) => `data:text/javascript,${encodeURIComponent(source)}`;
const stubs = {
  "server-only": "export {};",
  "next/cache": "export function revalidatePath() {}",
  "next/navigation": "export function redirect(url) { const error = new Error('TEST_REDIRECT'); error.url = url; throw error; }",
  "@/lib/store/admin": "export async function getStoreAdmin() { return globalThis.__storeTestDenied ? null : { id: 'test-admin', email: 'test-admin@example.invalid' }; } export async function requireStoreAdmin() { const admin = await getStoreAdmin(); if (!admin) throw new Error('STORE_ADMIN_FORBIDDEN'); return admin; }",
};

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(stubs, specifier)) {
      return { url: sourceUrl(stubs[specifier]), shortCircuit: true };
    }
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    if (specifier.startsWith("@/")) {
      return nextResolve(pathToFileURL(path.join(root, `${specifier.slice(2)}.ts`)).href, context);
    }
    if (specifier.startsWith(".") && context.parentURL?.startsWith(pathToFileURL(root).href) && !path.extname(specifier)) {
      const candidate = new URL(`${specifier}.ts`, context.parentURL);
      if (existsSync(candidate)) return nextResolve(candidate.href, context);
    }
    return nextResolve(specifier, context);
  },
});
