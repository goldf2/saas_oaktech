import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";
import { requireStoreAdmin } from "@/lib/store/admin";
import { appendStoreAudit, mutateStoreCatalog, newCatalogId, readStoreCatalog } from "@/lib/store/file-catalog";
import { storeUpload, removeStoredFile } from "@/lib/store/storage";
import { downloadRemote } from "@/lib/store/remote-download";
import { isSafeFileName } from "@/lib/store/policy";
import { uploadConflict } from "@/lib/store/release-workflow";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  let stored: Awaited<ReturnType<typeof storeUpload>> | undefined;
  let committed = false;
  try {
    if (request.headers.get("x-oaktech-admin-upload") !== "1") return NextResponse.json({ error: "UPLOAD_HEADER_REQUIRED" }, { status: 403 });
    const admin = await requireStoreAdmin();
    const { releaseId, url, fileName, platform, architecture, packageKind } = await request.json();
    if (typeof url !== "string" || url.length > 8192 || typeof fileName !== "string" || !isSafeFileName(fileName)
      || ![platform, architecture, packageKind].every(x => typeof x === "string" && /^[a-z0-9][a-z0-9_-]{0,31}$/.test(x))) throw new Error("INVALID_IMPORT_METADATA");
    const release = (await readStoreCatalog()).catalog.releases.find(r => r.id === releaseId);
    if (!release || release.status !== "draft") throw new Error("DRAFT_RELEASE_NOT_FOUND");
    const slot = { platform, architecture, packageKind };
    if (uploadConflict(fileName, slot, release.release_artifacts)) throw new Error("ARTIFACT_SLOT_ALREADY_EXISTS");
    const stream = await downloadRemote(url, request.signal);
    if (Number(stream.headers["content-length"]) > 4 * 1024 ** 3 || /text\/html/.test(stream.headers["content-type"] ?? "")) {
      stream.destroy(); throw new Error("REMOTE_FILE_INVALID");
    }
    stored = await storeUpload({ body: Readable.toWeb(stream) as ReadableStream<Uint8Array>, productSlug: release.product_slug, channel: release.channel, version: release.version, fileName });
    const artifactId = newCatalogId();
    await mutateStoreCatalog(catalog => {
      const target = catalog.releases.find(r => r.id === releaseId);
      if (!target || target.status !== "draft" || target.version !== release.version || target.channel !== release.channel || target.product_slug !== release.product_slug) throw new Error("DRAFT_RELEASE_CHANGED");
      if (uploadConflict(fileName, slot, target.release_artifacts)) throw new Error("ARTIFACT_SLOT_ALREADY_EXISTS");
      target.release_artifacts.push({ id: artifactId, release_id: releaseId, platform, architecture, package_kind: packageKind, file_name: fileName, storage_path: stored!.storagePath, public_path: stored!.publicPath, size_bytes: stored!.sizeBytes, sha512: stored!.sha512, content_type: stream.headers["content-type"] ?? "application/octet-stream" });
    });
    committed = true;
    await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email, action: "store.artifact.imported", targetType: "release_artifact", targetId: artifactId, metadata: { releaseId, fileName, sizeBytes: stored.sizeBytes } });
    return NextResponse.json({ ok: true, artifactId });
  } catch (error) {
    if (stored && !committed) await removeStoredFile(stored.storagePath);
    const message = error instanceof Error ? error.message : "REMOTE_IMPORT_FAILED";
    return NextResponse.json({ error: committed ? "ARTIFACT_SAVED_AUDIT_FAILED" : /^[A-Z_0-9]+$/.test(message) ? message : "REMOTE_IMPORT_FAILED", committed }, { status: message === "STORE_ADMIN_FORBIDDEN" ? 403 : /ALREADY_EXISTS|CHANGED/.test(message) ? 409 : 400 });
  }
}
