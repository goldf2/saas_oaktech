import "server-only";

import { absoluteReleasePath } from "./storage";
import { readStoreCatalog } from "./file-catalog";

export type DownloadDescriptor = {
  absolutePath: string;
  fileName: string;
  contentType: string;
  immutable: boolean;
};

export async function resolvePublicDownload(parts: string[]): Promise<DownloadDescriptor | null> {
  const { catalog, persisted } = await readStoreCatalog();
  if (!persisted) return null;
  if (parts.length === 3 && (parts[2] === "latest.yml" || parts[2] === "latest-mac.yml")) {
    const [productSlug, channel, manifestName] = parts;
    const release = catalog.releases.find((item) => item.product_slug === productSlug
      && item.channel === channel && item.status === "published" && item.is_current);
    if (!release) return null;
    return {
      absolutePath: absoluteReleasePath(`${productSlug}/${channel}/${release.version}/${manifestName}`),
      fileName: manifestName,
      contentType: "text/yaml; charset=utf-8",
      immutable: false,
    };
  }

  const publicPath = `/releases/${parts.join("/")}`;
  const publishedIds = new Set(catalog.releases.filter((item) => item.status === "published").map((item) => item.id));
  const artifact = catalog.releases.flatMap((item) => item.release_artifacts)
    .find((item) => item.public_path === publicPath && publishedIds.has(item.release_id));
  if (!artifact) return null;
  return {
    absolutePath: absoluteReleasePath(artifact.storage_path),
    fileName: artifact.file_name,
    contentType: artifact.content_type,
    immutable: true,
  };
}
