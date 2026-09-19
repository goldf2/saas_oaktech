import type { NextRequest } from "next/server";
import { resolveOpenPlayDownload, resolveUnifiedUpdate } from "@/lib/store/downloads";
import { serveDownload } from "@/lib/store/download-response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ file: string }> };
export async function GET(request: NextRequest, context: Context) {
  return serveDownload(request, (await context.params).file === "updates.json" ? await resolveUnifiedUpdate("open-play") : await resolveOpenPlayDownload((await context.params).file, true), false);
}
export async function HEAD(request: NextRequest, context: Context) {
  return serveDownload(request, (await context.params).file === "updates.json" ? await resolveUnifiedUpdate("open-play") : await resolveOpenPlayDownload((await context.params).file, true), true);
}
