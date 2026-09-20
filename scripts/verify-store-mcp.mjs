// Isolated production-server smoke test. Never reads or writes the live catalog.
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const root=await mkdtemp(path.join(os.tmpdir(),'oaktech-mcp-http-'));
const socket=net.createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
const token=randomBytes(32).toString('hex');const base=`http://127.0.0.1:${port}`;
const app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{env:{...process.env,RELEASE_STORAGE_ROOT:root,OAKTECH_MCP_TOKEN:token,OAKTECH_MCP_SCOPES:'read,product:write,release:write',OAKTECH_MCP_PRODUCTS:'mcp-demo',NEXTAUTH_URL:base},stdio:'ignore'});
const c=new Client({name:'oaktech-production-smoke',version:'1.0.0'});
try {
 for(let i=0;i<120;i++){if(app.exitCode!==null) throw new Error('server exited');try{const r=await fetch(base+'/api/health');if(r.ok)break;}catch{}if(i===119)throw new Error('server startup timeout');await new Promise(r=>setTimeout(r,250));}
 assert.equal((await fetch(base+'/api/mcp',{method:'POST',body:'{}'})).status,401);
 await c.connect(new StreamableHTTPClientTransport(new URL(base+'/api/mcp'),{requestInit:{headers:{Authorization:`Bearer ${token}`}}}));
 const list=await c.listTools();assert.equal(list.tools.length,11);
 const created=await c.callTool({name:'create_product',arguments:{slug:'mcp-demo',fields:{category_slug:'ai-tools',name_zh:'隔离验证'}}});assert.ok(!created.isError,JSON.stringify(created));
 const read=await c.callTool({name:'get_product',arguments:{slug:'mcp-demo'}});const data=JSON.parse(read.content[0].text);assert.equal(data.product.visibility,'draft');
 const changed=await c.callTool({name:'update_product',arguments:{slug:'mcp-demo',editToken:data.editToken,patch:{tagline_zh:'局部修改'}}});assert.ok(!changed.isError);
 const version=await c.callTool({name:'create_release',arguments:{product_slug:'mcp-demo',version:'1.0.0',channel:'stable',title_zh:'验证',title_en:'Test',notes_zh:'验证',notes_en:'Test'}});assert.ok(!version.isError);
 console.log(JSON.stringify({passed:true,transport:'Streamable HTTP',tools:list.tools.length,checks:['unauthenticated denied','initialize/discovery','create/read/patch product','create release'],productionDataTouched:false}));
}finally{await c.close().catch(()=>{});app.kill('SIGTERM');await new Promise(resolve=>{if(app.exitCode!==null)resolve();else app.once('exit',resolve);});await rm(root,{recursive:true,force:true});}
