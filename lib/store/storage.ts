import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { link, mkdir, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { AdminProductReleaseRow } from "./types";
import { selectUpdaterArtifacts } from "./release-contract";

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 * 1024;
const MAX_CHUNK_BYTES = 20 * 1024 * 1024;

function safeSegment(value: string, label: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(value) || value === "." || value === "..") {
    throw new Error(`INVALID_${label.toUpperCase()}`);
  }
  return value;
}

export function getReleaseStorageRoot() {
  const configured = process.env.RELEASE_STORAGE_ROOT?.trim();
  if (!configured || !path.isAbsolute(configured)) throw new Error("RELEASE_STORAGE_ROOT_REQUIRED");
  return path.resolve(configured);
}

export function releaseStoragePath(productSlug: string, channel: string, version: string, fileName: string) {
  return [
    safeSegment(productSlug, "product_slug"),
    safeSegment(channel, "channel"),
    safeSegment(version, "version"),
    safeSegment(fileName, "file_name"),
  ].join("/");
}

export function absoluteReleasePath(storagePath: string) {
  if (storagePath.startsWith("/") || storagePath.split("/").some((part) => part === ".." || part === ".")) {
    throw new Error("INVALID_STORAGE_PATH");
  }
  const root = getReleaseStorageRoot();
  const absolute = path.resolve(root, storagePath);
  if (!absolute.startsWith(`${root}${path.sep}`)) throw new Error("INVALID_STORAGE_PATH");
  return absolute;
}

export async function storeUpload(input: {
  body: ReadableStream<Uint8Array>;
  productSlug: string;
  channel: string;
  version: string;
  fileName: string;
}) {
  const storagePath = releaseStoragePath(input.productSlug, input.channel, input.version, input.fileName);
  const destination = absoluteReleasePath(storagePath);
  await mkdir(path.dirname(destination), { recursive: true });
  const temporary = `${destination}.upload-${randomUUID()}`;
  const hash = createHash("sha512");
  let sizeBytes = 0;
  const meter = new Transform({
    transform(chunk, _encoding, callback) {
      sizeBytes += chunk.length;
      if (sizeBytes > MAX_UPLOAD_BYTES) return callback(new Error("RELEASE_UPLOAD_TOO_LARGE"));
      hash.update(chunk);
      callback(null, chunk);
    },
  });

  try {
    await pipeline(
      Readable.fromWeb(input.body as never),
      meter,
      createWriteStream(temporary, { flags: "wx", mode: 0o640 }),
    );
    if (sizeBytes === 0) throw new Error("RELEASE_UPLOAD_EMPTY");
    await link(temporary, destination);
    await unlink(temporary);
  } catch (error) {
    await unlink(temporary).catch(() => undefined);
    throw error;
  }

  return {
    storagePath,
    publicPath: `/releases/${storagePath}`,
    sizeBytes,
    sha512: hash.digest("hex"),
  };
}

export async function appendUploadChunk(input: {
  body: ReadableStream<Uint8Array>;
  uploadId: string;
  offset: number;
  finalChunk: boolean;
  productSlug: string;
  channel: string;
  version: string;
  fileName: string;
}) {
  if (!/^[a-f0-9-]{36}$/i.test(input.uploadId) || !Number.isSafeInteger(input.offset) || input.offset < 0) {
    throw new Error("INVALID_UPLOAD_SESSION");
  }
  const root = getReleaseStorageRoot();
  const temporaryDirectory = path.join(root, ".uploads");
  const temporary = path.join(temporaryDirectory, `${input.uploadId}.part`);
  await mkdir(temporaryDirectory, { recursive: true });
  const current = await stat(temporary).catch(() => null);
  if ((current?.size ?? 0) !== input.offset) throw new Error("UPLOAD_OFFSET_MISMATCH");

  let chunkBytes = 0;
  const meter = new Transform({
    transform(chunk, _encoding, callback) {
      chunkBytes += chunk.length;
      if (chunkBytes > MAX_CHUNK_BYTES) return callback(new Error("UPLOAD_CHUNK_TOO_LARGE"));
      if (input.offset + chunkBytes > MAX_UPLOAD_BYTES) return callback(new Error("RELEASE_UPLOAD_TOO_LARGE"));
      callback(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(input.body as never), meter, createWriteStream(temporary, { flags: "a", mode: 0o640 }));
  if (!chunkBytes) throw new Error("UPLOAD_CHUNK_EMPTY");
  if (!input.finalChunk) return { complete: false as const, receivedBytes: input.offset + chunkBytes };

  const storagePath = releaseStoragePath(input.productSlug, input.channel, input.version, input.fileName);
  const destination = absoluteReleasePath(storagePath);
  await mkdir(path.dirname(destination), { recursive: true });
  const hash = createHash("sha512");
  await pipeline(createReadStream(temporary), new Transform({
    transform(chunk, _encoding, callback) {
      hash.update(chunk);
      callback(null, chunk);
    },
  }));
  const details = await stat(temporary);
  await link(temporary, destination);
  await unlink(temporary);
  return {
    complete: true as const,
    storagePath,
    publicPath: `/releases/${storagePath}`,
    sizeBytes: details.size,
    sha512: hash.digest("hex"),
  };
}

export async function removeStoredFile(storagePath: string) {
  await unlink(absoluteReleasePath(storagePath)).catch(() => undefined);
}

export async function verifyStoredArtifact(artifact: AdminProductReleaseRow["release_artifacts"][number]) {
  const filePath = absoluteReleasePath(artifact.storage_path);
  const details = await stat(filePath);
  if (!details.isFile() || details.size !== Number(artifact.size_bytes)) throw new Error(`ARTIFACT_SIZE_MISMATCH:${artifact.file_name}`);
  const hash = createHash("sha512");
  await pipeline(createReadStream(filePath), new Transform({
    transform(chunk, _encoding, callback) {
      hash.update(chunk);
      callback(null, chunk);
    },
  }));
  if (hash.digest("hex") !== artifact.sha512.toLowerCase()) throw new Error(`ARTIFACT_SHA512_MISMATCH:${artifact.file_name}`);
}

function yamlString(value: string) {
  return JSON.stringify(value);
}

function updaterSha512(hexDigest: string) {
  return Buffer.from(hexDigest, "hex").toString("base64");
}

function updaterManifest(release: AdminProductReleaseRow, artifacts: AdminProductReleaseRow["release_artifacts"]) {
  const primary = artifacts[0];
  const date = release.published_at ?? new Date().toISOString();
  return [
    `version: ${yamlString(release.version)}`,
    "files:",
    ...artifacts.flatMap((artifact) => [
      `  - url: ${yamlString(`${release.version}/${artifact.file_name}`)}`,
      `    sha512: ${yamlString(updaterSha512(artifact.sha512))}`,
      `    size: ${artifact.size_bytes}`,
    ]),
    `path: ${yamlString(`${release.version}/${primary.file_name}`)}`,
    `sha512: ${yamlString(updaterSha512(primary.sha512))}`,
    `releaseDate: ${yamlString(date)}`,
    "",
  ].join("\n");
}

async function atomicWrite(filePath: string, content: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.next-${randomUUID()}`;
  await new Promise<void>((resolve, reject) => {
    const stream = createWriteStream(temporary, { flags: "wx", mode: 0o640 });
    stream.on("error", reject);
    stream.on("finish", resolve);
    stream.end(content);
  });
  await rename(temporary, filePath);
}

export async function prepareUpdaterManifests(release: AdminProductReleaseRow) {
  if (!release.release_artifacts.length) throw new Error("RELEASE_ARTIFACT_REQUIRED");
  await Promise.all(release.release_artifacts.map(verifyStoredArtifact));

  const { mac, windows } = selectUpdaterArtifacts(release.release_artifacts);
  const base = releaseStoragePath(release.product_slug, release.channel, release.version, "placeholder").replace(/\/placeholder$/, "");
  const files: string[] = [];
  if (mac.length) {
    const storagePath = `${base}/latest-mac.yml`;
    await atomicWrite(absoluteReleasePath(storagePath), updaterManifest(release, mac));
    files.push(storagePath);
  }
  if (windows.length) {
    const storagePath = `${base}/latest.yml`;
    await atomicWrite(absoluteReleasePath(storagePath), updaterManifest(release, windows));
    files.push(storagePath);
  }
  if (!files.length) throw new Error("MAC_OR_WINDOWS_ARTIFACT_REQUIRED");
  return files;
}
