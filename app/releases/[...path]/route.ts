import type { NextRequest } from "next/server";
import { resolvePublicDownload } from "@/lib/store/downloads";
import { serveDownload } from "@/lib/store/download-response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function serve(request: NextRequest, parts: string[], headOnly: boolean) {
  if (parts.some((p) => !p || p === "." || p === ".." || /[\\/\0]/.test(p))) return new Response("Not found", { status: 404 });
  return serveDownload(request, await resolvePublicDownload(parts), headOnly);
}
export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return serve(request, (await context.params).path, false);
}
export async function HEAD(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return serve(request, (await context.params).path, true);
}
