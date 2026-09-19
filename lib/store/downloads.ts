import "server-only";
import { unifiedUpdateIdentities } from "./unified-update-signatures";

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

// Compatibility URLs are aliases of published catalog entries, never arbitrary files.
export async function resolveOpenPlayDownload(name: string, isFeed: boolean): Promise<DownloadDescriptor | null> {
  if (isFeed ? !["appcast.xml", "windows.json"].includes(name) : !/^open-play-\d+\.\d+\.\d+\.\d+-(macos|windows-x64)\.zip$/.test(name)) return null;
  const { catalog, persisted } = await readStoreCatalog();
  if (!persisted || !catalog.products.some((p) => p.slug === "open-play")) return null;
  const candidates = catalog.releases.filter((r) => r.product_slug === "open-play" && r.channel === "stable" && r.status === "published" && (!isFeed || r.is_current));
  if (isFeed && candidates.length !== 1) return null;
  const matches = candidates.flatMap((r) => r.release_artifacts.filter((a) => a.file_name === name && a.release_id === r.id
    && a.storage_path === `open-play/stable/${r.version}/${name}` && a.public_path === `/releases/${a.storage_path}`
    && (isFeed || name === `open-play-${r.version}-macos.zip` || name === `open-play-${r.version}-windows-x64.zip`)));
  if (matches.length !== 1) return null;
  const artifact = matches[0];
  return { absolutePath: absoluteReleasePath(artifact.storage_path), fileName: name,
    contentType: name === "appcast.xml" ? "application/xml; charset=utf-8" : name === "windows.json" ? "application/json; charset=utf-8" : "application/zip",
    immutable: !isFeed };
}

// One fixed endpoint per product resolves only a catalog-published signed artifact.
export async function resolveUnifiedUpdate(product: string): Promise<DownloadDescriptor | null> {
  const identity = unifiedUpdateIdentities[product]; if (!identity) return null;
  const { catalog, persisted } = await readStoreCatalog(); if (!persisted) return null;
  const releases = catalog.releases.filter(r => r.product_slug === product && r.channel === identity.channel && r.status === "published" && r.is_current);
  if (releases.length !== 1) return null;
  const release = releases[0], storage = `${product}/${release.channel}/${release.version}/updates.json`;
  const matches = release.release_artifacts.filter(a => a.release_id === release.id && a.file_name === "updates.json" && a.storage_path === storage && a.public_path === `/releases/${storage}`);
  if (matches.length !== 1) return null;
  return { absolutePath: absoluteReleasePath(storage), fileName: "updates.json", contentType: "application/json; charset=utf-8", immutable: false };
}
