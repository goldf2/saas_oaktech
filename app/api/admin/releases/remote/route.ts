import { NextRequest, NextResponse } from "next/server";
import { importRemoteArtifact } from "@/lib/store/remote-artifact";
import { requireStoreAdmin } from "@/lib/store/admin";
import { appendStoreAudit } from "@/lib/store/file-catalog";
import { isSafeFileName } from "@/lib/store/policy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  let committed = false;
  try {
    if (request.headers.get("x-oaktech-admin-upload") !== "1") return NextResponse.json({ error: "UPLOAD_HEADER_REQUIRED" }, { status: 403 });
    const admin = await requireStoreAdmin();
    const { releaseId, url, fileName, platform, architecture, packageKind } = await request.json();
    if (typeof url !== "string" || url.length > 8192 || typeof fileName !== "string" || !isSafeFileName(fileName)
      || ![platform, architecture, packageKind].every(x => typeof x === "string" && /^[a-z0-9][a-z0-9_-]{0,31}$/.test(x))) throw new Error("INVALID_IMPORT_METADATA");
    const result=await importRemoteArtifact({releaseId,url,fileName,platform,architecture,packageKind},request.signal);
    const artifactId=result.artifactId;
    committed=true;
    await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email, action: "store.artifact.imported", targetType: "release_artifact", targetId: artifactId, metadata: { releaseId, fileName, sizeBytes: result.sizeBytes } });
    return NextResponse.json({ ok: true, artifactId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "REMOTE_IMPORT_FAILED";
    return NextResponse.json({ error: committed ? "ARTIFACT_SAVED_AUDIT_FAILED" : /^[A-Z_0-9]+$/.test(message) ? message : "REMOTE_IMPORT_FAILED", committed }, { status: message === "STORE_ADMIN_FORBIDDEN" ? 403 : /ALREADY_EXISTS|CHANGED/.test(message) ? 409 : 400 });
  }
}
