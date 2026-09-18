// Shared pure validation. Never fetch user-provided URLs or execute supplied embed HTML.
export type ProductVideoSource = { id: string; label: string; url: string };
export type ProductVideo = { id: string; title: string; poster_url: string; sources: ProductVideoSource[] };
export type VideoSourceInfo = {
  provider: "youtube" | "bilibili" | "external";
  label: string;
  watchUrl: string;
  embedUrl: string | null;
};
export const MAX_PRODUCT_VIDEOS = 6;
export const MAX_VIDEO_SOURCES = 4;
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const BVID = /^BV[A-Za-z0-9]{10}$/;

function webUrl(value: unknown): URL {
  if (typeof value !== "string" || !value.trim() || value.length > 2048 || /[\u0000-\u0020<>"\\]/.test(value.trim())) throw new Error("PRODUCT_VIDEO_URL_INVALID");
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw new Error("PRODUCT_VIDEO_URL_INVALID"); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.port || !host.includes(".")
    || /^[\d.]+$/.test(host) || host.includes(":") || host.endsWith(".")
    || /(?:^|\.)(?:localhost|local|internal|home|lan|test|invalid)$/.test(host)) throw new Error("PRODUCT_VIDEO_URL_INVALID");
  return url;
}
function uniqueParam(url: URL, key: string): string | null {
  if (url.searchParams.getAll(key).length > 1) throw new Error("PRODUCT_VIDEO_URL_INVALID");
  return url.searchParams.get(key);
}
function startSeconds(value: string | null): number {
  if (!value) return 0;
  let seconds: number;
  if (/^\d+s?$/.test(value)) seconds = Number(value.replace(/s$/, ""));
  else {
    const match = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(value);
    if (!match) throw new Error("PRODUCT_VIDEO_URL_INVALID");
    seconds = Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
  }
  if (!Number.isSafeInteger(seconds) || seconds < 0 || seconds > 86400) throw new Error("PRODUCT_VIDEO_URL_INVALID");
  return seconds;
}

export function parseVideoSource(value: string): VideoSourceInfo {
  const url = webUrl(value);
  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);
  const youtube = ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host);
  if (youtube || host === "youtu.be" || host === "www.youtu.be") {
    let id: string | null = null;
    if (host.endsWith("youtu.be") && parts.length === 1) id = parts[0];
    else if (url.pathname === "/watch") id = uniqueParam(url, "v");
    else if (parts.length === 2 && ["embed", "shorts", "live"].includes(parts[0])) id = parts[1];
    if (!id || !YOUTUBE_ID.test(id)) throw new Error("PRODUCT_VIDEO_YOUTUBE_LINK");
    const start = startSeconds(uniqueParam(url, "start") ?? uniqueParam(url, "t"));
    const watch = new URL("https://www.youtube.com/watch"); watch.searchParams.set("v", id);
    const embed = new URL(`https://www.youtube-nocookie.com/embed/${id}`);
    embed.searchParams.set("autoplay", "0"); embed.searchParams.set("playsinline", "1"); embed.searchParams.set("rel", "0");
    if (start) { watch.searchParams.set("t", `${start}s`); embed.searchParams.set("start", String(start)); }
    return { provider: "youtube", label: "YouTube", watchUrl: watch.href, embedUrl: embed.href };
  }
  const bilibili = ["bilibili.com", "www.bilibili.com", "m.bilibili.com", "player.bilibili.com"].includes(host);
  if (bilibili) {
    let bvid: string | null = null, aid: string | null = null;
    if (host === "player.bilibili.com" && url.pathname === "/player.html") {
      bvid = uniqueParam(url, "bvid"); aid = uniqueParam(url, "aid");
    } else if (parts.length === 2 && parts[0] === "video") {
      if (BVID.test(parts[1])) bvid = parts[1];
      else if (/^av[1-9]\d{0,14}$/i.test(parts[1])) aid = parts[1].slice(2);
    }
    if (bvid ? !BVID.test(bvid) : !aid || !/^[1-9]\d{0,14}$/.test(aid)) throw new Error("PRODUCT_VIDEO_BILIBILI_LINK");
    const p = uniqueParam(url, "p") ?? uniqueParam(url, "page") ?? "1";
    if (!/^[1-9]\d{0,3}$/.test(p) || Number(p) > 1000) throw new Error("PRODUCT_VIDEO_URL_INVALID");
    const start = startSeconds(uniqueParam(url, "t"));
    const watch = new URL(`https://www.bilibili.com/video/${bvid || `av${aid}`}/`);
    const embed = new URL("https://player.bilibili.com/player.html");
    embed.searchParams.set(bvid ? "bvid" : "aid", bvid || aid!);
    embed.searchParams.set("p", p); embed.searchParams.set("autoplay", "0"); embed.searchParams.set("danmaku", "0"); embed.searchParams.set("poster", "1");
    if (p !== "1") watch.searchParams.set("p", p);
    if (start) { watch.searchParams.set("t", String(start)); embed.searchParams.set("t", String(start)); }
    return { provider: "bilibili", label: "B站", watchUrl: watch.href, embedUrl: embed.href };
  }
  // Unknown providers and short links are safe external links only, never arbitrary iframe sources.
  return { provider: "external", label: host === "b23.tv" ? "B站短链接" : host, watchUrl: url.href, embedUrl: null };
}
export function videoSourceInfo(value: string): VideoSourceInfo | null {
  try { return parseVideoSource(value); } catch { return null; }
}
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("PRODUCT_VIDEO_INVALID");
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number): string {
  if (typeof value !== "string" || value.length > max || /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) throw new Error("PRODUCT_VIDEO_INVALID");
  return value.trim();
}
function validId(value: unknown): string {
  if (typeof value !== "string" || !ID.test(value)) throw new Error("PRODUCT_VIDEO_INVALID");
  return value;
}
export function normalizeProductVideos(value: unknown, publishing = false): ProductVideo[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_PRODUCT_VIDEOS) throw new Error("PRODUCT_VIDEO_LIMIT");
  const videoIds = new Set<string>();
  return value.map(item => {
    const input = record(item), id = validId(input.id);
    if (videoIds.has(id)) throw new Error("PRODUCT_VIDEO_INVALID"); videoIds.add(id);
    const title = text(input.title, 160), poster = text(input.poster_url ?? "", 2048);
    if (poster && !(poster.startsWith("/") && !poster.startsWith("//") && !/[\\<>\s]/.test(poster))) webUrl(poster);
    if (!Array.isArray(input.sources) || input.sources.length > MAX_VIDEO_SOURCES) throw new Error("PRODUCT_VIDEO_SOURCE_LIMIT");
    const ids = new Set<string>(), urls = new Set<string>();
    const sources = input.sources.map(item => {
      const source = record(item), sourceId = validId(source.id), raw = text(source.url, 2048);
      if (ids.has(sourceId)) throw new Error("PRODUCT_VIDEO_INVALID"); ids.add(sourceId);
      const info = raw ? parseVideoSource(raw) : null;
      const url = info?.watchUrl ?? "";
      if (url && urls.has(url)) throw new Error("PRODUCT_VIDEO_DUPLICATE_SOURCE");
      if (url) urls.add(url);
      if (publishing && !url) throw new Error("PRODUCT_VIDEO_INCOMPLETE");
      return { id: sourceId, label: text(source.label ?? "", 80), url };
    });
    if (publishing && (!title || !sources.length)) throw new Error("PRODUCT_VIDEO_INCOMPLETE");
    return { id, title, poster_url: poster, sources };
  });
}
export const videoMessages: Record<string, string> = {
  PRODUCT_VIDEO_URL_INVALID: "请填写完整的 HTTPS 视频链接，不要粘贴 HTML、脚本、本地地址或带密码的链接。",
  PRODUCT_VIDEO_YOUTUBE_LINK: "未识别到 YouTube 视频，请使用观看页、分享链接、Shorts 或直播视频地址。",
  PRODUCT_VIDEO_BILIBILI_LINK: "未识别到 B站视频，请使用包含 BV/av 编号的完整视频页或官方播放器链接。",
  PRODUCT_VIDEO_INVALID: "视频资料格式不正确，请检查标题、来源及封面。",
  PRODUCT_VIDEO_LIMIT: "每个商品最多添加6段视频。",
  PRODUCT_VIDEO_SOURCE_LIMIT: "同一视频最多添加4个播放来源。",
  PRODUCT_VIDEO_DUPLICATE_SOURCE: "同一视频不能重复添加相同的播放来源。",
  PRODUCT_VIDEO_INCOMPLETE: "发布前请补齐每段视频的标题和至少一个有效来源，或删除未填写的视频。",
};
