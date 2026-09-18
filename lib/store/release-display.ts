import type { AdminProductReleaseRow } from "./types.ts";
import { requiredReleaseFiles, type ArtifactRow } from "./release-workflow.ts";

export type ReleaseDisplayRow = { key: string; name: string; label: string; platform: string; architecture: string; kind: string; artifact?: ArtifactRow };

// Display only: do not reuse this to bypass server readiness, hashes or publication checks.
export function releaseDisplayRows(release: AdminProductReleaseRow): ReleaseDisplayRow[] {
  const consumed = new Set<string>();
  const rows: ReleaseDisplayRow[] = requiredReleaseFiles(release.product_slug, release.version).map(expected => {
    const artifact = release.release_artifacts.find(a => !consumed.has(a.id) && a.file_name === expected.name && a.platform === expected.platform && a.architecture === expected.architecture && a.package_kind === expected.packageKind);
    if (artifact) consumed.add(artifact.id);
    return { key: "expected:" + expected.name, name: expected.name, label: expected.label, platform: expected.platform, architecture: expected.architecture, kind: expected.packageKind, artifact };
  });
  for (const artifact of release.release_artifacts) {
    if (consumed.has(artifact.id)) continue;
    rows.push({ key: "artifact:" + artifact.id, name: artifact.file_name, label: artifact.package_kind === "manifest" ? "更新清单" : "版本文件", platform: artifact.platform, architecture: artifact.architecture, kind: artifact.package_kind, artifact });
  }
  return rows;
}
