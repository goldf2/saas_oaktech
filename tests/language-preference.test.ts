import './helpers/language-proxy-loader.mjs';
import assert from 'node:assert/strict';
import test, { before } from 'node:test';
import { resolveLocale, languagePreference, languageTarget, explicitLocale, localeFromAcceptLanguage, REQUEST_LOCALE_HEADER } from '../i18n/config.ts';
let proxy: typeof import('../proxy.ts').proxy;
let NextRequest: typeof import('next/server.js').NextRequest;
before(async()=>{({proxy}=await import('../proxy.ts'));({NextRequest}=await import('next/server.js'));});
const globals = globalThis as typeof globalThis & {__languageTestProvider?: string;__languageTestRefresh?: number};
function request(path: string, headers: Record<string,string>={}, method='GET') {
  return new NextRequest('https://store.example'+path,{method,headers:{'accept-language':'zh-CN,zh;q=0.9,en;q=0.5',...headers}});
}
test('language negotiation handles regions, priorities, disabled entries and bounded q values',()=>{
  for(const value of ['zh-TW,zh;q=0.9','zh-Hant','fr;q=1,zh-CN;q=0.8','en;q=0,zh;q=0.5'])assert.equal(localeFromAcceptLanguage(value),'zh');
  assert.equal(localeFromAcceptLanguage('zh;q=0.3,en-GB;q=0.9'),'en');
  assert.equal(localeFromAcceptLanguage('zh;q=2,en;q=0.4'),'en');
  assert.equal(localeFromAcceptLanguage('ja-JP,fr-FR'),'en');
});
test('explicit route beats preference; auto follows browser; a generic route does not imply English',()=>{
  assert.equal(resolveLocale('/dashboard',undefined,'zh-CN'),'zh');
  assert.equal(resolveLocale('/admin/products/a','auto','zh-HK'),'zh');
  assert.equal(resolveLocale('/dashboard','en','zh-CN'),'en');
  assert.equal(resolveLocale('/zh/products/a','en','en-US'),'zh');
  assert.equal(resolveLocale('/en','zh','zh-CN'),'en');
  assert.equal(explicitLocale('/zh-custom'),null);
  assert.equal(languagePreference('garbage'),'auto');
});
test('switch targets preserve dashboard/editor routes and never invent localized support routes',()=>{
  assert.equal(languageTarget('/en/products/tool/releases','zh'),'/zh/products/tool/releases');
  assert.equal(languageTarget('/products','zh'),'/zh');
  assert.equal(languageTarget('/products/tool','zh'),'/zh/products/tool');
  for(const path of ['/dashboard','/admin/products/tool','/dashboard/reset-password','/support','/products/tool/install','/products/image.png'])assert.equal(languageTarget(path,'en'),path);
  assert.equal(languageTarget('//untrusted.example/path','zh'),'/zh');
});
test('old automatic cookie no longer overrides browser and root does not persist detected language',async()=>{
  const response=await proxy(request('/',{cookie:'oaktech-locale=en'}));
  assert.equal(response.status,307);assert.equal(new URL(response.headers.get('location')!).pathname,'/zh');
  assert.equal(response.headers.get('set-cookie'),null);
  assert.match(response.headers.get('cache-control')!,/no-store/);assert.match(response.headers.get('vary')!,/Accept-Language/);
});
test('only explicit preference changes neutral redirect; auto can recover without clearing all cookies',async()=>{
  for(const [cookie,locale] of [['en','en'],['zh','zh'],['auto','zh'],['invalid','zh']]) {
    const response=await proxy(request('/?campaign=test',{cookie:'oaktech-language-preference='+cookie}));
    assert.equal(new URL(response.headers.get('location')!).pathname,'/'+locale);
    assert.equal(new URL(response.headers.get('location')!).search,'?campaign=test');
  }
});
test('opposite-language prefetch never writes a preference and respects the explicit path',async()=>{
  const response=await proxy(request('/en',{cookie:'oaktech-language-preference=zh',purpose:'prefetch','next-router-prefetch':'1'}));
  assert.equal(response.headers.get('set-cookie'),null);
  assert.equal(response.headers.get('content-language'),'en');
  assert.equal(response.headers.get('x-middleware-request-'+REQUEST_LOCALE_HEADER),'en');
});
test('bare catalog and product routes negotiate language without changing queries',async()=>{
  for(const [path,target] of [['/products','/zh'],['/products/tool','/zh/products/tool'],['/products/tool/releases','/zh/products/tool/releases']]) {
    const response=await proxy(request(path+'?filter=one'));assert.equal(new URL(response.headers.get('location')!).pathname,target);
    assert.equal(new URL(response.headers.get('location')!).search,'?filter=one');
  }
});
test('language headers cannot be spoofed and POST actions never redirect for locale',async()=>{
  const response=await proxy(request('/admin/products/tool',{[REQUEST_LOCALE_HEADER]:'en'},'POST'));
  assert.equal(response.headers.get('location'),null);assert.equal(response.headers.get('content-language'),'zh-CN');
  assert.equal(response.headers.get('x-middleware-request-'+REQUEST_LOCALE_HEADER),'zh');
});
test('Supabase dashboard refresh remains while public language routing does not depend on it',async()=>{
  globals.__languageTestProvider='supabase';globals.__languageTestRefresh=0;
  try {
    await proxy(request('/zh'));assert.equal(globals.__languageTestRefresh,0);
    const response=await proxy(request('/dashboard'));
    assert.equal(globals.__languageTestRefresh,1);assert.equal(response.headers.get('x-test-session-refreshed'),'yes');
    assert.equal(response.headers.get('content-language'),'zh-CN');
  } finally { delete globals.__languageTestProvider;delete globals.__languageTestRefresh; }
});
