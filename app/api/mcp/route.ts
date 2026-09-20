import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { revalidatePath } from 'next/cache';
import { authenticateStoreMcp } from '@/lib/store/mcp-auth';
import { createStoreMcpServer } from '@/lib/store/mcp-server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const principal = authenticateStoreMcp(request.headers.get('authorization'));
  if (!principal) return Response.json({error:'MCP_UNAUTHORIZED'}, {status:401,headers:{'Cache-Control':'no-store'}});
  const origin=request.headers.get('origin');
  const configured=process.env.NEXTAUTH_URL || process.env.BASE_URL;
  if(origin && (!configured || origin!==new URL(configured).origin)) return Response.json({error:'MCP_ORIGIN_FORBIDDEN'},{status:403});
  // MCP carries small metadata, never binary payloads. Bound the streamed body,
  // not just Content-Length, before allowing the SDK to parse it.
  if(!request.body) return Response.json({error:'MCP_BODY_REQUIRED'},{status:400});
  const reader=request.body.getReader(); const chunks:Uint8Array[]=[]; let length=0;
  try { for(;;) { const {value,done}=await reader.read(); if(done) break; length+=value.byteLength; if(length>256*1024) {await reader.cancel(); return Response.json({error:'MCP_BODY_TOO_LARGE'},{status:413});} chunks.push(value); } } finally {reader.releaseLock();}
  let body:unknown; try {body=JSON.parse(Buffer.concat(chunks).toString('utf8'));} catch{return Response.json({error:'MCP_INVALID_JSON'},{status:400});}
  const server=createStoreMcpServer(principal,slug=>{
    for(const route of ['/dashboard','/zh','/en',`/admin/products/${slug}`,`/zh/products/${slug}`,`/en/products/${slug}`]) revalidatePath(route);
  });
  const transport=new WebStandardStreamableHTTPServerTransport({sessionIdGenerator:undefined,enableJsonResponse:true});
  try {await server.connect(transport); return await transport.handleRequest(request,{parsedBody:body});}
  finally {await server.close();}
}
export async function GET() {return new Response(null,{status:405,headers:{Allow:'POST'}});}
export async function DELETE() {return new Response(null,{status:405,headers:{Allow:'POST'}});}
