import { normalizeProductVideos, videoMessages } from "./product-videos.ts";
import type { AdminProductReleaseRow, AdminStoreProductRow } from "./types";
import { isSoftwareDownload } from "./download-visibility.ts";
import { isSafeFileName, isSha512, isManagedAssetUrl } from "./policy.ts";

export type ArtifactRow = AdminProductReleaseRow["release_artifacts"][number];
export type UploadSlot = { platform: string; architecture: string; packageKind: string };
export type RequiredFile = UploadSlot & { name: string; label: string };
export const MAX_PACKAGE_BYTES = 4 * 1024 ** 3;
export const MAX_UPLOAD_QUEUE = 12;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MiB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GiB`;
}
export function artifactSlot(slot: UploadSlot): string {
  return [slot.platform, slot.architecture, slot.packageKind].map(x => x.trim().toLowerCase()).join("/");
}
export function requiredReleaseFiles(product: string, version: string): RequiredFile[] {
  if (product !== "open-play") return [];
  return [
    { name: `open-play-${version}-macos.zip`, label: "macOS 安装包", platform: "macos", architecture: "arm64", packageKind: "zip" },
    { name: `open-play-${version}-windows-x64.zip`, label: "Windows 安装包", platform: "windows", architecture: "x64", packageKind: "zip" },
    { name: "appcast.xml", label: "macOS 官网更新清单", platform: "macos", architecture: "arm64", packageKind: "manifest" },
    { name: "windows.json", label: "Windows 官网更新清单", platform: "windows", architecture: "x64", packageKind: "manifest" },
  ];
}
// These are suggestions only. The operator confirms editable metadata before upload.
export function suggestUploadSlot(name: string, product = "", version = ""): UploadSlot {
  const expected = requiredReleaseFiles(product, version).find(x => x.name === name);
  if (expected) return expected;
  const lower = name.toLowerCase();
  const platform = /macos|darwin|mac-|\.dmg$|latest-mac|appcast/.test(lower) ? "macos" : /windows|win32|win64|win-|\.exe$/.test(lower) ? "windows" : /linux|\.appimage$|\.deb$/.test(lower) ? "linux" : /\.crx$/.test(lower) ? "chrome" : "";
  const architecture = /universal/.test(lower) ? "universal" : /arm64|aarch64/.test(lower) ? "arm64" : /x64|amd64|x86_64/.test(lower) ? "x64" : "";
  const packageKind = /\.(xml|json|ya?ml)$/.test(lower) ? "manifest" : /\.blockmap$/.test(lower) ? "blockmap" : /\.exe$/.test(lower) ? "nsis" : lower.split(".").pop() ?? "";
  return { platform, architecture, packageKind };
}
export function fileSelectionError(name: string, size: number): string | null {
  if (!Number.isSafeInteger(size) || size <= 0) return "不能上传空文件。";
  if (size > MAX_PACKAGE_BYTES) return "单个文件不能超过 4 GiB。";
  if (!isSafeFileName(name)) return "文件名只能包含英文字母、数字、点、连字符、下划线或加号，不能包含空格。";
  return null;
}
export function uploadConflict(name: string, slot: UploadSlot, existing: ArtifactRow[]): string | null {
  if (existing.some(a => a.file_name === name)) return "这个文件名已经存在，不能重复上传或覆盖。";
  if (existing.some(a => artifactSlot({ platform: a.platform, architecture: a.architecture, packageKind: a.package_kind }) === artifactSlot(slot))) return "该平台 / 架构 / 包类型已有文件，请检查元数据或使用新版本。";
  return null;
}

// Advisory metadata checks only: hash and signature verification remain server-side at publication.
export function releaseReadiness(release: AdminProductReleaseRow) {
  const blockers: string[] = [];
  const files = release.release_artifacts;
  const required = requiredReleaseFiles(release.product_slug, release.version);
  if (![release.title_zh, release.title_en, release.notes_zh, release.notes_en].every(x => x?.trim())) blockers.push("版本标题或更新说明尚未保存完整。");
  if (required.length) {
    if (release.channel !== "stable" || !/^\d+\.\d+\.\d+\.\d+$/.test(release.version)) blockers.push("open play 的签名版本需要 stable 渠道和四段版本号。");
    for (const expected of required) {
      if (!files.some(f => f.file_name === expected.name && f.platform === expected.platform && f.architecture === expected.architecture && f.package_kind === expected.packageKind)) blockers.push(`缺少 ${expected.label}：${expected.name}`);
    }
  } else if (!files.some(a => isSoftwareDownload({ packageKind: a.package_kind, fileName: a.file_name }))) blockers.push("至少上传一个可下载的软件安装包，不能只有更新清单。");
  const slots = new Set<string>(), names = new Set<string>();
  for (const a of files) {
    if (a.size_bytes <= 0 || !isSha512(a.sha512)) blockers.push(`${a.file_name} 缺少有效的大小或服务端校验记录，请刷新核对。`);
    const slot = artifactSlot({ platform: a.platform, architecture: a.architecture, packageKind: a.package_kind });
    if (slots.has(slot) || names.has(a.file_name)) blockers.push("文件名或平台 / 架构 / 包类型重复，请先整理版本文件。");
    slots.add(slot); names.add(a.file_name);
  }
  const installers = files.filter(a => isSoftwareDownload({ packageKind: a.package_kind, fileName: a.file_name })).length;
  return { ready: blockers.length === 0, blockers, required, installers, fileCount: files.length, totalBytes: files.reduce((total, a) => total + a.size_bytes, 0) };
}
export function selectReleaseForPublication(current: string[], id: string, checked: boolean, releases: AdminProductReleaseRow[]) {
  const target = releases.find(r => r.id === id && r.status === "draft");
  const available = current.filter(x => releases.some(r => r.id === x && r.status === "draft"));
  if (!target || !checked) return available.filter(x => x !== id);
  if (!releaseReadiness(target).ready) return available;
  return [...available.filter(x => releases.find(r => r.id === x)?.channel !== target.channel), id];
}

export function productPublicationIssues(product: AdminStoreProductRow) {
  const fields = [
    ["name_zh", "商品名称", "details"], ["tagline_zh", "一句话简介", "details"], ["description_zh", "详细说明", "details"],
    ["icon_url", "商品图标", "media"], ["hero_image_url", "商品封面", "media"],
  ] as const;
  const issues: { field: string; label: string; tab: "details" | "media" }[] = fields.flatMap(([field, label, tab]) => {
    const value = product[field];
    if (!value?.trim()) return [{ field, label: `请补齐${label}`, tab }];
    if (value.length > (field === "description_zh" ? 30000 : 2048)) return [{ field, label: `${label}超出长度限制`, tab }];
    if ((field === "icon_url" || field === "hero_image_url") && !isManagedAssetUrl(value)) return [{ field, label: `${label}地址无效`, tab }];
    return [];
  });
  try { normalizeProductVideos(product.videos, true); }
  catch (error) { issues.push({ field: "videos", label: videoMessages[(error as Error).message] ?? "请完善视频介绍", tab: "details" }); }
  return issues;
}
