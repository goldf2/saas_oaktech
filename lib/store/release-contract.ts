import { isStoreSlug } from "./policy.ts";
import type { AdminProductReleaseRow } from "./types.ts";

export type ReleaseImport = {
  schemaVersion: 1;
  productSlug: string;
  version: string;
  channel: string;
  sourceCommit: string;
  title: { en: string; zh: string };
  notes: { en: string; zh: string };
};

function requiredText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseReleaseImport(value: unknown): ReleaseImport {
  const input = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const title = input.title && typeof input.title === "object" ? input.title as Record<string, unknown> : {};
  const notes = input.notes && typeof input.notes === "object" ? input.notes as Record<string, unknown> : {};
  const result: ReleaseImport = {
    schemaVersion: 1,
    productSlug: requiredText(input.productSlug),
    version: requiredText(input.version),
    channel: requiredText(input.channel),
    sourceCommit: requiredText(input.sourceCommit),
    title: { en: requiredText(title.en), zh: requiredText(title.zh) },
    notes: { en: requiredText(notes.en), zh: requiredText(notes.zh) },
  };
  if (input.schemaVersion !== 1) throw new Error("UNSUPPORTED_RELEASE_SCHEMA");
  if (!isStoreSlug(result.productSlug) || !isStoreSlug(result.channel)) throw new Error("INVALID_RELEASE_IDENTITY");
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(result.version)) throw new Error("INVALID_RELEASE_VERSION");
  if (!/^[a-f0-9]{7,64}$/i.test(result.sourceCommit)) throw new Error("INVALID_SOURCE_COMMIT");
  if (!result.title.en || !result.title.zh || !result.notes.en || !result.notes.zh) {
    throw new Error("BILINGUAL_RELEASE_CONTENT_REQUIRED");
  }
  return result;
}

export function selectUpdaterArtifacts(artifacts: AdminProductReleaseRow["release_artifacts"]) {
  return {
    mac: artifacts.filter((item) => /mac|darwin/i.test(item.platform) && item.package_kind === "zip"),
    windows: artifacts.filter((item) => /win/i.test(item.platform) && item.package_kind === "nsis"),
  };
}
