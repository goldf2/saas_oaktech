// Test-only resolver. No production code imports these isolated adapters.
import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const stubs = {
  '@/lib/auth-config': 'export function getAuthProvider(){return globalThis.__languageTestProvider || "casdoor";}',
  '@/utils/supabase/middleware': 'export async function updateSession(request){globalThis.__languageTestRefresh=(globalThis.__languageTestRefresh||0)+1; return new Response(null,{headers:{"x-test-session-refreshed":"yes"}});}',
};
registerHooks({ resolve(specifier, context, next) {
  if (Object.hasOwn(stubs, specifier)) return {url:'data:text/javascript,'+encodeURIComponent(stubs[specifier]),shortCircuit:true};
  if (specifier === 'next/server') return next('next/server.js', context);
  if (specifier.startsWith('@/')) return next(pathToFileURL(path.join(root,specifier.slice(2)+'.ts')).href,context);
  if (specifier.startsWith('.') && context.parentURL?.startsWith(pathToFileURL(root).href) && !path.extname(specifier)) {
    const url=new URL(specifier+'.ts',context.parentURL);if(existsSync(url))return next(url.href,context);
  }
  return next(specifier, context);
} });
