import 'server-only';
import { Readable } from 'node:stream';
import { mutateStoreCatalog, newCatalogId, readStoreCatalog } from './file-catalog';
import { storeUpload, removeStoredFile } from './storage';
import { downloadRemote } from './remote-download';
import { isSafeFileName } from './policy';
import { uploadConflict } from './release-workflow';
export async function importRemoteArtifact(input: {releaseId:string;url:string;fileName:string;platform:string;architecture:string;packageKind:string}, signal?:AbortSignal) {
  const {releaseId,url,fileName,platform,architecture,packageKind}=input;
  if (url.length>8192 || !isSafeFileName(fileName) || ![platform,architecture,packageKind].every(x=>/^[a-z0-9][a-z0-9_-]{0,31}$/.test(x))) throw new Error('INVALID_IMPORT_METADATA');
  let stored: Awaited<ReturnType<typeof storeUpload>> | undefined;
  let committed=false;
  try {
    const release = (await readStoreCatalog()).catalog.releases.find(r => r.id === releaseId);
    if (!release || release.status !== "draft") throw new Error("DRAFT_RELEASE_NOT_FOUND");
    const source = new URL(url);
    if (release.product_slug === "open-play" && source.hostname === "github.com" && /^\/goldf2\/open-play-releases\/releases\/download\/[^/]+\/(appcast.xml|windows.json)$/.test(source.pathname)) throw new Error("OPEN_PLAY_WEBSITE_FEED_REQUIRED");
    const slot = { platform, architecture, packageKind };
    if (uploadConflict(fileName, slot, release.release_artifacts)) throw new Error("ARTIFACT_SLOT_ALREADY_EXISTS");
    const stream = await downloadRemote(url, signal);
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
    return {artifactId,sizeBytes:stored.sizeBytes};
  } catch(error) { if(stored && !committed) await removeStoredFile(stored.storagePath); throw error; }
}
