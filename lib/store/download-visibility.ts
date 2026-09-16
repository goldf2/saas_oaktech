// Metadata stays available at updater URLs; only installable artifacts get download cards.
export function isSoftwareDownload(artifact: { packageKind: string; fileName: string }) {
  return !["blockmap", "manifest"].includes(artifact.packageKind.toLowerCase())
    && !["appcast.xml", "windows.json", "appcast-website.xml", "windows-website.json", "latest.yml", "latest-mac.yml"].includes(artifact.fileName.toLowerCase());
}
