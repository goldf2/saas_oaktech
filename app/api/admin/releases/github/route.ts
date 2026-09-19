import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/store/admin";
import { readGithubReleases } from "@/lib/store/remote-download";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    if (request.headers.get("x-oaktech-admin-upload") !== "1") return NextResponse.json({ error: "UPLOAD_HEADER_REQUIRED" }, { status: 403 });
    await requireStoreAdmin();
    const { source } = await request.json();
    if (typeof source !== "string" || source.length > 2048) throw new Error("GITHUB_RELEASE_URL_REQUIRED");
    return NextResponse.json({ releases: await readGithubReleases(source, request.signal) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "GITHUB_IMPORT_FAILED";
    return NextResponse.json({ error: /^[A-Z_0-9]+$/.test(message) ? message : "GITHUB_IMPORT_FAILED" }, { status: message === "STORE_ADMIN_FORBIDDEN" ? 403 : 400 });
  }
}
