import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/store/admin";
import { appendStoreAudit, mutateStoreCatalog, newCatalogId, readStoreCatalog } from "@/lib/store/file-catalog";
import { isSafeFileName } from "@/lib/store/policy";
import { appendUploadChunk, removeStoredFile } from "@/lib/store/storage";
import { authenticateReleaseWriter } from "@/lib/store/release-writer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let stored: Extract<Awaited<ReturnType<typeof appendUploadChunk>>, { complete: true }> | null = null;
  try {
    const writer = authenticateReleaseWriter(request.headers.get("authorization"));
    if (!writer && request.headers.get("authorization")) {
      return NextResponse.json({ error: "RELEASE_WRITER_UNAUTHORIZED" }, { status: 401 });
    }
    if (!writer && request.headers.get("x-oaktech-admin-upload") !== "1") {
      return NextResponse.json({ error: "UPLOAD_HEADER_REQUIRED" }, { status: 403 });
    }
    const admin = writer ?? await requireStoreAdmin();
    const releaseId = request.nextUrl.searchParams.get("releaseId")?.trim() ?? "";
    const platform = request.nextUrl.searchParams.get("platform")?.trim() ?? "";
    const architecture = request.nextUrl.searchParams.get("architecture")?.trim() ?? "";
    const packageKind = request.nextUrl.searchParams.get("packageKind")?.trim() ?? "";
    const uploadId = request.nextUrl.searchParams.get("uploadId")?.trim() ?? "";
    const offset = Number(request.nextUrl.searchParams.get("offset"));
    const finalChunk = request.nextUrl.searchParams.get("final") === "true";
    const fileName = decodeURIComponent(request.headers.get("x-file-name") ?? "");
    const contentType = (request.headers.get("content-type") ?? "application/octet-stream").split(";")[0];
    if (!request.body || !releaseId || !platform || !architecture || !packageKind || !isSafeFileName(fileName)) {
      return NextResponse.json({ error: "INVALID_UPLOAD_METADATA" }, { status: 400 });
    }
    const release = (await readStoreCatalog()).catalog.releases.find((item) => item.id === releaseId);
    if (!release || release.status !== "draft") return NextResponse.json({ error: "DRAFT_RELEASE_NOT_FOUND" }, { status: 404 });
    if (release.release_artifacts.some((item) => item.platform === platform && item.architecture === architecture && item.package_kind === packageKind)) {
      return NextResponse.json({ error: "ARTIFACT_SLOT_ALREADY_EXISTS" }, { status: 409 });
    }
    const chunkResult = await appendUploadChunk({ body: request.body, uploadId, offset, finalChunk, productSlug: release.product_slug, channel: release.channel, version: release.version, fileName });
    if (!chunkResult.complete) return NextResponse.json({ ok: true, receivedBytes: chunkResult.receivedBytes });
    stored = chunkResult;
    const artifactId = newCatalogId();
    await mutateStoreCatalog((catalog) => {
      const target = catalog.releases.find((item) => item.id === releaseId);
      if (!target || target.status !== "draft") throw new Error("DRAFT_RELEASE_CHANGED");
      target.release_artifacts.push({
        id: artifactId,
        release_id: releaseId,
        platform,
        architecture,
        package_kind: packageKind,
        file_name: fileName,
        storage_path: stored!.storagePath,
        public_path: stored!.publicPath,
        size_bytes: stored!.sizeBytes,
        sha512: stored!.sha512,
        content_type: contentType,
      });
    });
    await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email, action: "store.artifact.uploaded", targetType: "release_artifact", targetId: artifactId, metadata: { releaseId, fileName, sizeBytes: stored.sizeBytes, sha512: stored.sha512 } });
    return NextResponse.json({ ok: true, artifactId, sizeBytes: stored.sizeBytes, sha512: stored.sha512 });
  } catch (error) {
    if (stored) await removeStoredFile(stored.storagePath);
    return NextResponse.json({ error: error instanceof Error ? error.message : "UPLOAD_FAILED" }, { status: 400 });
  }
}
