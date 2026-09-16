import { createHash, createPublicKey, verify } from "node:crypto";
import type { AdminProductReleaseRow } from "./types";
import { openPlayPublicKeys } from "./open-play-public-keys";

type Artifact = AdminProductReleaseRow["release_artifacts"][number];
function verifySignature(bytes: Buffer, signature: string, rawKey: string) {
  const raw = Buffer.from(rawKey, "base64"), sig = Buffer.from(signature, "base64");
  if (raw.length !== 32 || sig.length !== 64) throw new Error("OPEN_PLAY_SIGNATURE_INVALID");
  const key = createPublicKey({ key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), raw]), format: "der", type: "spki" });
  if (!verify(null, bytes, key, sig)) throw new Error("OPEN_PLAY_SIGNATURE_INVALID");
}
function one(xml: string, expression: RegExp) {
  const matches = Array.from(xml.matchAll(expression));
  if (matches.length !== 1 || !matches[0][1]) throw new Error("OPEN_PLAY_FEED_FORMAT_INVALID");
  return matches[0][1];
}
export async function verifyOpenPlayRelease(release: AdminProductReleaseRow,
  read: (artifact: Artifact) => Promise<Buffer>, keys = openPlayPublicKeys, now = Date.now()) {
  if (release.product_slug !== "open-play") return;
  if (release.channel !== "stable" || !/^\d+\.\d+\.\d+\.\d+$/.test(release.version)) throw new Error("OPEN_PLAY_RELEASE_IDENTITY_INVALID");
  const names = ["appcast.xml", "windows.json", `open-play-${release.version}-macos.zip`, `open-play-${release.version}-windows-x64.zip`];
  const files = new Map<string, Buffer>();
  for (const name of names) {
    const matches = release.release_artifacts.filter((a) => a.file_name === name && a.release_id === release.id);
    if (matches.length !== 1) throw new Error("OPEN_PLAY_SIGNED_ARTIFACTS_REQUIRED");
    const a = matches[0];
    if (a.storage_path !== `open-play/stable/${release.version}/${name}` || a.public_path !== `/releases/${a.storage_path}`
      || a.size_bytes <= 0 || a.size_bytes > (name.endsWith(".zip") ? 128 << 20 : 1 << 20)) throw new Error("OPEN_PLAY_ARTIFACT_INVALID");
    files.set(name, await read(a));
  }
  const macFeed = files.get("appcast.xml")!;
  const marker = Buffer.from("<!-- sparkle-signatures:");
  const trailerAt = macFeed.lastIndexOf(marker);
  if (trailerAt < 0) throw new Error("OPEN_PLAY_UNSIGNED_FEED");
  const trailer = macFeed.subarray(trailerAt).toString("utf8");
  const signature = one(trailer, /^edSignature: ([A-Za-z0-9+/=]+)$/gm);
  const length = Number(one(trailer, /^length: (\d+)$/gm));
  if (length !== trailerAt) throw new Error("OPEN_PLAY_SIGNED_LENGTH_INVALID");
  verifySignature(macFeed.subarray(0, length), signature, keys.mac);
  const xml = macFeed.subarray(0, length).toString("utf8");
  if (/<!(DOCTYPE|ENTITY)/i.test(xml) || Array.from(xml.matchAll(/<item(?:\s|>)/g)).length !== 1) throw new Error("OPEN_PLAY_FEED_FORMAT_INVALID");
  const version = one(xml, /<sparkle:shortVersionString>([^<]+)<\/sparkle:shortVersionString>/g);
  const build = Number(one(xml, /<sparkle:version>(\d+)<\/sparkle:version>/g));
  const enclosure = one(xml, /<enclosure\s+([^>]+)>/g);
  const url = one(enclosure, /(?:^|\s)url="([^"]+)"/g);
  const packageLength = Number(one(enclosure, /(?:^|\s)length="(\d+)"/g));
  const packageSig = one(enclosure, /(?:^|\s)sparkle:edSignature="([A-Za-z0-9+/=]+)"/g);
  const mac = files.get(names[2])!;
  if (version !== release.version || !Number.isSafeInteger(build) || build <= 0
    || url !== `https://oaktechz.com/downloads/${names[2]}` || packageLength !== mac.length) throw new Error("OPEN_PLAY_MAC_METADATA_MISMATCH");
  verifySignature(mac, packageSig, keys.mac);
  const envelope = JSON.parse(files.get("windows.json")!.toString("utf8"));
  const payload = Buffer.from(envelope.payload, "base64");
  verifySignature(payload, envelope.signature, keys.windows);
  const m = JSON.parse(payload.toString("utf8")), win = files.get(names[3])!;
  if (m.schema !== 1 || m.app !== "local.codex-auth-switcher" || m.platform !== "windows-amd64" || m.channel !== "stable"
    || m.version !== version || m.build !== build || m.url !== `https://oaktechz.com/downloads/${names[3]}`
    || m.size !== win.length || m.sha256 !== createHash("sha256").update(win).digest("hex")
    || !Number.isFinite(Date.parse(m.issuedAt)) || Date.parse(m.issuedAt) > now + 86400000
    || !(Date.parse(m.expiresAt) > now && Date.parse(m.expiresAt) > Date.parse(m.issuedAt))) throw new Error("OPEN_PLAY_WINDOWS_METADATA_MISMATCH");
}
