import type { NextRequest } from "next/server";
import { resolveOpenPlayDownload } from "@/lib/store/downloads";
import { serveDownload } from "@/lib/store/download-response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ file: string }> };
export async function GET(request: NextRequest, context: Context) {
  return serveDownload(request, await resolveOpenPlayDownload((await context.params).file, false), false);
}
export async function HEAD(request: NextRequest, context: Context) {
  return serveDownload(request, await resolveOpenPlayDownload((await context.params).file, false), true);
}
