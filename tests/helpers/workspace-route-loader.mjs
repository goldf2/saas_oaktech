// Test-only adapters for isolated product HTTP/action tests; never imported by production.
import { existsSync } from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const admin = `export async function getStoreAdmin(){return globalThis.__workspaceTestAdmin ? {id:'isolated-test-admin',email:'isolated@example.invalid'} : null;} export async function requireStoreAdmin(){const a=await getStoreAdmin();if(!a)throw new Error('STORE_ADMIN_FORBIDDEN');return a;}`;
const stubs = { 'server-only': 'export {};', 'next/cache': 'export function revalidatePath() {}', '@/lib/store/admin': admin };
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (Object.hasOwn(stubs, specifier)) return {url:`data:text/javascript,${encodeURIComponent(stubs[specifier])}`,shortCircuit:true};
    if (specifier === 'next/server') return nextResolve('next/server.js',context);
    if (specifier.startsWith('@/')) return nextResolve(pathToFileURL(path.join(root,`${specifier.slice(2)}.ts`)).href,context);
    if (specifier.startsWith('.') && context.parentURL?.startsWith(pathToFileURL(root).href) && !path.extname(specifier)) {
      const candidate=new URL(`${specifier}.ts`,context.parentURL);
      if(existsSync(candidate))return nextResolve(candidate.href,context);
    }
    return nextResolve(specifier,context);
  },
});
