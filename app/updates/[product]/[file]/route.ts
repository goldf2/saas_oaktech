import type { NextRequest } from "next/server";
import { resolveUnifiedUpdate } from "@/lib/store/downloads";
import { serveDownload } from "@/lib/store/download-response";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ product: string; file: string }> };
export async function GET(request: NextRequest, context: Context) {
  const { product, file } = await context.params;
  return serveDownload(request, file === "updates.json" ? await resolveUnifiedUpdate(product) : null, false);
}
export async function HEAD(request: NextRequest, context: Context) {
  const { product, file } = await context.params;
  return serveDownload(request, file === "updates.json" ? await resolveUnifiedUpdate(product) : null, true);
}
