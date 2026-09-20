import './helpers/store-test-loader.mjs';
import test, {before,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {randomBytes,createHash} from 'node:crypto';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
let POST: typeof import('../app/api/mcp/route.ts').POST;
let authenticateStoreMcp: typeof import('../lib/store/mcp-auth.ts').authenticateStoreMcp;
let readStoreCatalog: typeof import('../lib/store/file-catalog.ts').readStoreCatalog;
let mutateStoreCatalog: typeof import('../lib/store/file-catalog.ts').mutateStoreCatalog;
before(async()=>{
 ({POST}=await import('../app/api/mcp/route.ts'));
 ({authenticateStoreMcp}=await import('../lib/store/mcp-auth.ts'));
 ({readStoreCatalog,mutateStoreCatalog}=await import('../lib/store/file-catalog.ts'));
});
let root:string,token:string;
const saved={...process.env};
beforeEach(async()=>{
  root=await mkdtemp(path.join(os.tmpdir(),'store-mcp-'));
  process.env.RELEASE_STORAGE_ROOT=root;
  token=randomBytes(32).toString('hex');
  process.env.OAKTECH_MCP_TOKEN=token;
  process.env.OAKTECH_MCP_SCOPES='read,product:write,release:write,product:publish,release:publish';
  process.env.OAKTECH_MCP_PRODUCTS='mcp-demo,gitfinder-2';
  await mutateStoreCatalog(()=>{});
});
afterEach(async()=>{await rm(root,{recursive:true,force:true}); for(const key of ['RELEASE_STORAGE_ROOT','OAKTECH_MCP_TOKEN','OAKTECH_MCP_SCOPES','OAKTECH_MCP_PRODUCTS']) {if(saved[key]===undefined) delete process.env[key]; else process.env[key]=saved[key];}});
async function client(){
 const c=new Client({name:'mcp-verification',version:'1.0.0'});
 const transport=new StreamableHTTPClientTransport(new URL('https://store.invalid/api/mcp'),{requestInit:{headers:{Authorization:`Bearer ${token}`}},fetch:async(input,init)=>POST(new Request(input,init))});
 await c.connect(transport); return c;
}
async function call(c:Client,name:string,args:Record<string,unknown>={}){const r=await c.callTool({name,arguments:args}); const first=(r.content as Array<{text:string}>)[0];return {error:r.isError===true,data:JSON.parse(first.text)};}
const fields={category_slug:'ai-tools',name_zh:'测试商品',tagline_zh:'本地工具',description_zh:'说明',icon_url:'/example.png',hero_image_url:'/cover.png'};
const release={product_slug:'mcp-demo',version:'1.0.0',channel:'stable',title_zh:'初版',title_en:'Initial',notes_zh:'说明',notes_en:'Notes'};
test('authentication fails closed and does not accept legacy tokens or cookies',async()=>{
 assert.equal(authenticateStoreMcp(null),null);
 assert.equal(authenticateStoreMcp('Bearer wrong'),null);
 assert.equal(authenticateStoreMcp(`Bearer ${token}`,{NODE_ENV:'test',OAKTECH_MCP_TOKEN:token} as NodeJS.ProcessEnv),null);
 const response=await POST(new Request('https://store.invalid/api/mcp',{method:'POST',body:'{}',headers:{cookie:'session=anything'}})); assert.equal(response.status,401);
});
test('official HTTP client initializes, discovers tools and receives scoped compact products',async()=>{
 const c=await client(); try {const list=await c.listTools(); assert.ok(list.tools.some(t=>t.name==='update_release')); const r=await call(c,'list_products'); assert.deepEqual(r.data.products.map((p:{slug:string})=>p.slug),['gitfinder-2']); assert.equal((await call(c,'get_product',{slug:'open-play'})).data.error,'MCP_FORBIDDEN');} finally {await c.close();}
});
test('product create/patch respects drafts, concurrency, field whitelist and explicit publish',async()=>{
 const c=await client();try {
 const created=await call(c,'create_product',{slug:'mcp-demo',fields});assert.equal(created.error,false);
 assert.equal((await call(c,'create_product',{slug:'mcp-demo',fields})).data.error,'STORE_PRODUCT_SLUG_EXISTS');
 const changed=await call(c,'update_product',{slug:'mcp-demo',editToken:created.data.editToken,patch:{name_zh:'新名称'}});assert.equal(changed.data.product.description_zh,'说明');
 assert.equal((await call(c,'update_product',{slug:'mcp-demo',editToken:created.data.editToken,patch:{name_zh:'过期'}})).data.error,'PRODUCT_EDIT_CONFLICT');
 const invalid=await c.callTool({name:'update_product',arguments:{slug:'mcp-demo',editToken:changed.data.editToken,patch:{visibility:'published'}}});assert.equal(invalid.isError,true);
 assert.equal((await readStoreCatalog()).catalog.products.find(p=>p.slug==='mcp-demo')?.visibility,'draft');
 assert.equal((await call(c,'publish_product',{slug:'mcp-demo',publishToken:created.data.publishToken})).data.error,'PRODUCT_PUBLICATION_CONFLICT');
 assert.equal((await call(c,'publish_product',{slug:'mcp-demo',publishToken:changed.data.publishToken})).error,false);
 assert.equal((await readStoreCatalog()).catalog.products.find(p=>p.slug==='mcp-demo')?.name_zh,'新名称');
 }finally {await c.close();}
});
test('release create/patch blocks duplicate identities, stale edits, published edits and incomplete publication',async()=>{
 const c=await client();try {
 await call(c,'create_product',{slug:'mcp-demo',fields});
 const r=await call(c,'create_release',release);assert.equal(r.error,false);
 assert.equal((await call(c,'create_release',release)).data.error,'PRODUCT_RELEASE_ALREADY_EXISTS');
 const updated=await call(c,'update_release',{slug:'mcp-demo',releaseId:r.data.id,editToken:r.data.editToken,patch:{notes_zh:'新说明'}});assert.equal(updated.data.title_en,'Initial');
 assert.equal((await call(c,'update_release',{slug:'mcp-demo',releaseId:r.data.id,editToken:r.data.editToken,patch:{notes_en:'stale'}})).data.error,'RELEASE_EDIT_CONFLICT');
 assert.equal((await call(c,'get_release',{slug:'gitfinder-2',releaseId:r.data.id})).data.error,'MCP_FORBIDDEN');
 const preview=await call(c,'get_release',{slug:'mcp-demo',releaseId:r.data.id});assert.equal(preview.data.readiness.ready,false);
 const failed=await call(c,'publish_release',{slug:'mcp-demo',releaseId:r.data.id,publishToken:preview.data.publishToken}); assert.equal(failed.error,true);
 assert.equal((await readStoreCatalog()).catalog.releases.find(x=>x.id===r.data.id)?.status,'draft');
 await mutateStoreCatalog(catalog=>{catalog.releases.find(x=>x.id===r.data.id)!.status='published';});
 assert.equal((await call(c,'update_release',{slug:'mcp-demo',releaseId:r.data.id,editToken:updated.data.editToken,patch:{notes_zh:'覆盖'}})).data.error,'PUBLISHED_RELEASE_IS_IMMUTABLE');
 }finally{await c.close();}
});
test('read-only scope hides writes; direct invocation cannot grant capabilities',async()=>{
 process.env.OAKTECH_MCP_SCOPES='read';const c=await client();try{const list=await c.listTools();assert.ok(!list.tools.some(t=>t.name==='create_product'));assert.equal((await c.callTool({name:'create_product',arguments:{slug:'mcp-demo',fields}})).isError,true);}finally{await c.close();}
});
test('origin rejection and streaming request size limit apply before execution',async()=>{
 const headers={Authorization:`Bearer ${token}`,'Content-Type':'application/json',Accept:'application/json, text/event-stream'};
 assert.equal((await POST(new Request('https://store.invalid/api/mcp',{method:'POST',headers:{...headers,Origin:'https://evil.invalid'},body:'{}'}))).status,403);
 assert.equal((await POST(new Request('https://store.invalid/api/mcp',{method:'POST',headers,body:'x'.repeat(256*1024+1)}))).status,413);
});
test('remote image import rejects private network targets without a download',async()=>{
 const c=await client();try{await call(c,'create_product',{slug:'mcp-demo',fields});const r=await call(c,'import_product_image',{slug:'mcp-demo',url:'https://127.0.0.1/secret'});assert.equal(r.data.error,'PUBLIC_HOST_REQUIRED');}finally{await c.close();}
});

test('software publication verifies real fixture bytes and leaves product draft private',async()=>{
 const c=await client();try{
 await call(c,'create_product',{slug:'mcp-demo',fields});
 const r=await call(c,'create_release',release);const bytes=Buffer.from('isolated package fixture');
 const relative='mcp-demo/stable/1.0.0/app.zip';await mkdir(path.dirname(path.join(root,relative)),{recursive:true});await writeFile(path.join(root,relative),bytes);
 await mutateStoreCatalog(catalog=>{catalog.releases.find(x=>x.id===r.data.id)!.release_artifacts.push({id:'fixture',release_id:r.data.id,platform:'chrome',architecture:'universal',package_kind:'zip',file_name:'app.zip',storage_path:relative,public_path:'/releases/'+relative,size_bytes:bytes.length,sha512:createHash('sha512').update(bytes).digest('hex'),content_type:'application/zip'});});
 const preview=await call(c,'get_release',{slug:'mcp-demo',releaseId:r.data.id});assert.equal(preview.data.readiness.ready,true);assert.equal(JSON.stringify(preview.data).includes('storage_path'),false);
 assert.equal((await call(c,'publish_release',{slug:'mcp-demo',releaseId:r.data.id,publishToken:preview.data.publishToken})).error,false);
 const {catalog}=await readStoreCatalog();assert.equal(catalog.releases.find(x=>x.id===r.data.id)?.status,'published');assert.equal(catalog.products.find(p=>p.slug==='mcp-demo')?.visibility,'draft');assert.ok(catalog.productDrafts?.['mcp-demo']);
 }finally{await c.close();}
});
