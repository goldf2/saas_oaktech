import { requiresUnifiedManifest } from "./unified-update-policy.ts";
import { createPublicKey, verify } from "node:crypto";
import type { AdminProductReleaseRow } from "./types";
import identities from "./unified-update-keys.json" with { type: "json" };

type Artifact = AdminProductReleaseRow["release_artifacts"][number];
type Identity = { appId: string; keyId: string; publicKey: string; channel: string };
export const unifiedUpdateIdentities: Record<string, Identity> = identities;
function invalid(): never { throw new Error("UNIFIED_UPDATE_INVALID"); }
function signed(payload: Buffer, signature: string, publicKey: string) {
  const raw = Buffer.from(publicKey, "base64"), sig = Buffer.from(signature, "base64");
  if (raw.length !== 32 || sig.length !== 64) invalid();
  const key = createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), raw]), format: "der", type: "spki" });
  if (!verify(null, payload, key, sig)) invalid();
}
export async function verifyUnifiedRelease(release: AdminProductReleaseRow,
  read: (artifact: Artifact) => Promise<Buffer>, sha256: (artifact: Artifact) => Promise<string>,
  registry = unifiedUpdateIdentities, now = Date.now()) {
  const matches = release.release_artifacts.filter(a => a.file_name === "updates.json");
  if (!matches.length) { if (requiresUnifiedManifest(release.product_slug, release.version)) invalid(); return; }
  const identity = registry[release.product_slug];
  if (!identity || matches.length !== 1 || matches[0].size_bytes > 1048576) invalid();
  const bytes = await read(matches[0]); if (bytes.length > 1048576) invalid();
  try {
    const e = JSON.parse(bytes.toString("utf8"));
    if (e.schema !== 1 || !Array.isArray(e.keyTransitions ?? []) || (e.keyTransitions ?? []).length > 32) invalid();
    let key = identity.publicKey, id = identity.keyId;
    const seen = new Set([id]);
    for (const [index, t] of (e.keyTransitions ?? []).entries()) {
      const raw = Buffer.from(t.payload, "base64"), p = JSON.parse(raw.toString("utf8"));
      if (p.appId !== identity.appId || p.version !== index + 1 || p.fromKeyId !== id || typeof p.toKeyId !== "string" || !p.toKeyId || p.toKeyId.length > 128 || seen.has(p.toKeyId) || p.toPublicKey === key) invalid();
      signed(raw, t.oldSignature, key); signed(raw, t.newSignature, p.toPublicKey);
      key = p.toPublicKey; id = p.toKeyId; seen.add(id);
    }
    const raw = Buffer.from(e.payload, "base64");
    if (e.keyId !== id) invalid(); signed(raw, e.signature, key);
    const p = JSON.parse(raw.toString("utf8"));
    if (p.appId !== identity.appId || !Number.isSafeInteger(p.manifestRevision) || p.manifestRevision <= 0
      || !Number.isFinite(Date.parse(p.issuedAt)) || Date.parse(p.issuedAt) > now + 86400000
      || !(Date.parse(p.expiresAt) > now && Date.parse(p.expiresAt) > Date.parse(p.issuedAt))
      || !Array.isArray(p.releases) || p.releases.length > 64) invalid();
    const current = p.releases.filter((r: { version: string; channel: string }) => r.version === release.version && r.channel === release.channel);
    if (current.length !== 1 || current[0].withdrawn || !Number.isSafeInteger(current[0].build) || current[0].build <= 0) invalid();
    const packages = Object.values(current[0].platforms ?? {}) as { file: string; size: number; sha256: string; sources: { id: string; enabled: boolean; url: string }[] }[];
    if (!packages.length) invalid();
    for (const pkg of packages) {
      const artifacts = release.release_artifacts.filter(a => a.file_name === pkg.file && a.release_id === release.id);
      if (artifacts.length !== 1 || artifacts[0].size_bytes !== pkg.size || !/^[a-f0-9]{64}$/i.test(pkg.sha256) || await sha256(artifacts[0]) !== pkg.sha256.toLowerCase()) invalid();
      if (!Array.isArray(pkg.sources) || !pkg.sources.some(s => s.enabled) || new Set(pkg.sources.map(s => s.id)).size !== pkg.sources.length) invalid();
      for (const source of pkg.sources) {
        const url = new URL(source.url);
        if (url.protocol !== "https:" || !url.hostname || url.username || url.password || url.hash) invalid();
      }
    }
  } catch { invalid(); }
}
