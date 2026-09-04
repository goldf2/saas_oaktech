import { NextRequest, NextResponse } from "next/server";
import { appendStoreAudit, mutateStoreCatalog, newCatalogId } from "@/lib/store/file-catalog";
import { parseReleaseImport } from "@/lib/store/release-contract";
import { authenticateReleaseWriter } from "@/lib/store/release-writer";
import type { AdminProductReleaseRow } from "@/lib/store/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const writer = authenticateReleaseWriter(request.headers.get("authorization"));
  if (!writer) return NextResponse.json({ error: "RELEASE_WRITER_UNAUTHORIZED" }, { status: 401 });

  try {
    const input = parseReleaseImport(await request.json());
    let release!: AdminProductReleaseRow;
    let created = false;
    await mutateStoreCatalog((catalog) => {
      if (!catalog.products.some((product) => product.slug === input.productSlug)) {
        throw new Error("STORE_PRODUCT_NOT_FOUND");
      }
      const existing = catalog.releases.find((item) => item.product_slug === input.productSlug
        && item.version === input.version && item.channel === input.channel);
      if (existing) {
        if (existing.source_commit && existing.source_commit !== input.sourceCommit) {
          throw new Error("RELEASE_SOURCE_COMMIT_CONFLICT");
        }
        if (existing.status === "published") {
          release = existing;
          return;
        }
        Object.assign(existing, {
          source_commit: input.sourceCommit,
          title_en: input.title.en,
          title_zh: input.title.zh,
          notes_en: input.notes.en,
          notes_zh: input.notes.zh,
        });
        release = existing;
        return;
      }
      created = true;
      release = {
        id: newCatalogId(),
        product_slug: input.productSlug,
        version: input.version,
        channel: input.channel,
        status: "draft",
        is_current: false,
        published_at: null,
        source_commit: input.sourceCommit,
        title_en: input.title.en,
        title_zh: input.title.zh,
        notes_en: input.notes.en,
        notes_zh: input.notes.zh,
        release_artifacts: [],
      };
      catalog.releases.push(release);
    });
    await appendStoreAudit({
      actorUserId: writer.id,
      actorEmail: writer.email,
      action: created ? "store.release.imported" : "store.release.import_reused",
      targetType: "product_release",
      targetId: release.id,
      metadata: { productSlug: release.product_slug, version: release.version, sourceCommit: release.source_commit },
    });
    return NextResponse.json({
      ok: true,
      created,
      releaseId: release.id,
      status: release.status,
      artifacts: release.release_artifacts.map((artifact) => ({
        platform: artifact.platform,
        architecture: artifact.architecture,
        packageKind: artifact.package_kind,
        fileName: artifact.file_name,
        sizeBytes: artifact.size_bytes,
        sha512: artifact.sha512,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "RELEASE_IMPORT_FAILED";
    const status = /CONFLICT|ALREADY_EXISTS/.test(message) ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
