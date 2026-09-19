import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { isIP } from "node:net";
import type { IncomingMessage } from "node:http";

// Resolve once and pin the connection to a public IPv4 address; redirects are checked afresh.
export function isPublicAddress(address: string) {
  if (isIP(address) !== 4) return false;
  const [a, b] = address.split(".").map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || a === 169 && b === 254
    || a === 172 && b >= 16 && b <= 31 || a === 192 && [0, 168].includes(b)
    || a === 100 && b >= 64 && b <= 127 || a === 198 && [18, 19, 51].includes(b)
    || a === 203 && b === 0);
}
export function remoteUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.port && url.port !== "443") throw new Error("HTTPS_PUBLIC_URL_REQUIRED");
  if (isIP(url.hostname) && !isPublicAddress(url.hostname)) throw new Error("PUBLIC_HOST_REQUIRED");
  return url;
}
export async function downloadRemote(value: string, signal?: AbortSignal, redirects = 0): Promise<IncomingMessage> {
  const url = remoteUrl(value);
  const addresses = await lookup(url.hostname, { all: true, family: 4 });
  if (!addresses.length || addresses.some(x => !isPublicAddress(x.address))) throw new Error("PUBLIC_HOST_REQUIRED");
  const response = await new Promise<IncomingMessage>((resolve, reject) => {
    const req = request(url, {
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15 * 60_000)]) : AbortSignal.timeout(15 * 60_000),
      headers: { "User-Agent": "OakTech-Release-Importer", Accept: "*/*", "Accept-Encoding": "identity" },
      family: 4,
      lookup: (_host, _options, callback) => callback(null, addresses[0].address, 4),
    }, resolve);
    req.on("error", reject);
    req.setTimeout(30_000, () => req.destroy(new Error("REMOTE_DOWNLOAD_TIMEOUT")));
    req.end();
  });
  if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
    response.destroy();
    if (redirects >= 5 || !response.headers.location) throw new Error("REMOTE_REDIRECT_LIMIT");
    return downloadRemote(new URL(response.headers.location, url).href, signal, redirects + 1);
  }
  if (response.statusCode !== 200) { response.destroy(); throw new Error(`REMOTE_HTTP_${response.statusCode}`); }
  return response;
}
export function githubSource(value: string) {
  const raw = value.trim();
  const url = new URL(raw.includes("://") ? raw : `https://github.com/${raw}`);
  const parts = url.pathname.split("/").filter(Boolean);
  if (url.origin !== "https://github.com" || url.username || url.password || parts.length < 2
    || !parts.slice(0, 2).every(p => /^[\w.-]+$/.test(p))
    || parts.length > 2 && !(parts[2] === "releases" && (parts.length === 3 || parts[3] === "tag" && parts.length >= 5 || parts[3] === "latest" && parts.length === 4))) throw new Error("GITHUB_RELEASE_URL_REQUIRED");
  return { repo: parts.slice(0, 2).join("/"), tag: parts[3] === "tag" ? decodeURIComponent(parts.slice(4).join("/")) : "" };
}
export async function readGithubReleases(source: string, signal?: AbortSignal) {
  const { repo, tag } = githubSource(source);
  const stream = await downloadRemote(`https://api.github.com/repos/${repo}/releases${tag ? `/tags/${encodeURIComponent(tag)}` : "?per_page=30"}`, signal);
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of stream) {
    size += chunk.length;
    if (size > 2 * 1024 * 1024) { stream.destroy(); throw new Error("GITHUB_RESPONSE_TOO_LARGE"); }
    chunks.push(Buffer.from(chunk));
  }
  const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  return (Array.isArray(data) ? data : [data]).filter(r => !r.draft).map(r => ({
    source: `https://github.com/${repo}/releases/tag/${encodeURIComponent(r.tag_name)}`,
    version: String(r.tag_name).replace(/^v(?=\d)/, ""), channel: r.prerelease ? "beta" : "stable",
    title: String(r.name || r.tag_name), notes: String(r.body || ""),
    assets: (r.assets ?? []).map((a: { name: string; browser_download_url: string; size: number }) => ({ name: a.name, url: a.browser_download_url, size: a.size })),
  }));
}
