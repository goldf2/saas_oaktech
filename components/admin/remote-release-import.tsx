"use client";
import { useContext, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocale } from "@/i18n/locale-provider";
import { ReleaseFlowContext, useReleaseActivity } from "./release-flow-context";
import { githubArtifactName } from "@/lib/store/github-assets";
import { releaseErrors } from "@/lib/store/release-errors";
import { ArtifactUpload } from "./artifact-upload";
import { suggestUploadSlot, requiredReleaseFiles, uploadConflict, type UploadSlot, type ArtifactRow } from "@/lib/store/release-workflow";
export type GithubRelease = { source: string; version: string; channel: string; title: string; notes: string; assets: { name: string; url: string; size: number }[] };
type Item = UploadSlot & { name: string; sourceName?: string; url: string; selected: boolean; state: string };
export function RemoteReleaseImport({ productSlug, version, releaseId, artifacts = [], disabled, channel, onRelease }: { productSlug: string; version: string; releaseId?: string; artifacts?: ArtifactRow[]; disabled: boolean; channel?: string; onRelease?: (release: GithubRelease) => void }) {
  const { locale } = useLocale(), zh = locale === "zh", router = useRouter(), params = useSearchParams();
  const { operationBusy } = useContext(ReleaseFlowContext);
  const [mode, setMode] = useState("github"), [source, setSource] = useState(releaseId && params.get("release") === releaseId ? params.get("source") ?? "" : "");
  const [releases, setReleases] = useState<GithubRelease[]>([]), [chosen, setChosen] = useState("");
  const [items, setItems] = useState<Item[]>([]), [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  useReleaseActivity(`remote-${releaseId ?? "new"}`, items.some(i => i.selected && i.state !== "done"), busy);
  const locked = disabled || operationBusy || busy;
  async function call(path: string, body: unknown) {
    const response = await fetch(`/api/admin/releases/${path}`, { method: "POST", headers: { "content-type": "application/json", "x-oaktech-admin-upload": "1" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "IMPORT_FAILED");
    return data;
  }
  function choose(release: GithubRelease) {
    setChosen(release.source);
    if (releaseId && (release.version !== version || release.channel !== channel)) return;
    onRelease?.(release);
    setItems(release.assets.flatMap(a => { const name = githubArtifactName(productSlug, a.name); if (!name) return []; const slot = suggestUploadSlot(name, productSlug, release.version); return [{ ...slot, name, sourceName: a.name, url: a.url, selected: Boolean(releaseId && requiredReleaseFiles(productSlug, release.version).some(f => f.name === name) && !uploadConflict(name, slot, artifacts)), state: "" }]; }));
    setMessage(releaseId ? (zh ? "已读取版本。勾选需要的附件，缺失文件可通过链接或本地上传补齐。" : "Release loaded. Select assets; missing files can be added by URL or local upload.") : "");
  }
  async function inspect() {
    if (locked) return;
    if (items.some(i => i.selected && i.state !== "done") && !window.confirm(zh ? "重新读取会替换尚未导入的远程文件列表，继续吗？" : "Reloading replaces the pending remote file list. Continue?")) return;
    setBusy(true); setMessage("");
    try {
      const data = await call("github", { source });
      const options: GithubRelease[] = data.releases;
      setReleases(options); setItems([]); setChosen("");
      const match = releaseId ? options.find(r => r.version === version && r.channel === channel) : options[0];
      if (match) choose(match);
      else setMessage(zh ? "未找到匹配版本，请检查仓库或 Release 链接。" : "No matching release found. Check the repository or Release URL.");
    } catch (e) { setMessage((zh ? "读取失败：" : "Could not load: ") + (e as Error).message); }
    finally { setBusy(false); }
  }
  const autoLoaded = useRef(false);
  useEffect(() => { if (releaseId && source && !locked && !autoLoaded.current) { autoLoaded.current = true; void inspect(); } }, [releaseId, source, locked]);
  function addUrl() {
    try {
      const parsed = new URL(url); if (parsed.protocol !== "https:") throw new Error();
      const sourceName = decodeURIComponent(parsed.pathname.split("/").pop() ?? "");
      const name = productSlug === "open-play" && /-website\.(xml|json)$/.test(sourceName) ? githubArtifactName(productSlug, sourceName) : sourceName;
      if (!name) throw new Error();
      setItems(old => [...old, { ...suggestUploadSlot(name, productSlug, version), name, url: parsed.href, selected: true, state: "" }]); setUrl(""); setMessage("");
    } catch { setMessage(zh ? "请输入 HTTPS 文件直链。" : "Enter a direct HTTPS file URL."); }
  }
  function errorText(code: string) {
    const messages: Record<string, [string, string]> = {
      REMOTE_DOWNLOAD_TIMEOUT: ["下载超时，请重试或改用本地上传。", "Download timed out. Retry or use local upload."],
      PUBLIC_HOST_REQUIRED: ["只支持公网文件地址。", "Only public file addresses are supported."],
      HTTPS_PUBLIC_URL_REQUIRED: ["请使用 HTTPS 文件直链。", "Use a direct HTTPS file URL."],
      ARTIFACT_SLOT_ALREADY_EXISTS: ["文件或平台位置已存在，请刷新核对。", "The file or platform slot already exists. Refresh to review."],
    };
    return (messages[code] ?? releaseErrors[code])?.[zh ? 0 : 1] ?? code;
  }
  function patch(index: number, data: Partial<Item>) { setItems(old => old.map((item, i) => i === index ? { ...item, ...data } : item)); }
  async function importFiles() {
    if (locked || !releaseId) return;
    setBusy(true); setMessage(""); let count = 0;
    try {
      for (let index = 0; index < items.length; index++) {
        const item = items[index];
        if (!item.selected || item.state === "done") continue;
        const conflict = uploadConflict(item.name, item, artifacts);
        if (conflict) { patch(index, { state: zh ? conflict : "File or platform slot already exists." }); continue; }
        patch(index, { state: "loading" });
        try { await call("remote", { releaseId, url: item.url, fileName: item.name, platform: item.platform, architecture: item.architecture, packageKind: item.packageKind }); patch(index, { state: "done" }); count++; }
        catch (e) { patch(index, { state: (e as Error).message }); }
      }
      setMessage(zh ? `本次导入 ${count} 个文件。已自动刷新文件清单，失败项可核对后重试。` : `${count} files imported. The file list was refreshed; review failed items before retrying.`);
    } finally { setBusy(false); router.refresh(); }
  }
  return <section data-testid="remote-release-import" className="min-w-0 rounded-lg border p-3 sm:p-4">
    <h3 className="font-semibold">{zh ? (releaseId ? "导入发布文件" : "选择版本来源") : (releaseId ? "Import release files" : "Choose release source")}</h3>
    <div className="my-3 flex flex-wrap gap-2" role="group" aria-label={zh ? "导入来源" : "Import source"}>{[["github", "GitHub Release"], ["url", zh ? "下载链接" : "File URL"], ["local", zh ? "本地上传" : "Local upload"]].map(([id, label]) => <Button key={id} type="button" size="sm" variant={mode === id ? "default" : "outline"} disabled={locked} aria-pressed={mode === id} onClick={() => { setMode(id); setMessage(""); }}>{label}</Button>)}</div>
    {mode === "github" && <div className="space-y-2"><label className="block text-sm">{zh ? "公开仓库或 Release 链接" : "Public repository or Release URL"}<Input data-testid="github-source" className="mt-1" value={source} disabled={locked} placeholder="owner/repo · https://github.com/owner/repo/releases/tag/v1.0.0" onChange={e => setSource(e.target.value)} /></label><Button data-testid="github-inspect" type="button" variant="outline" disabled={locked || !source.trim()} onClick={() => void inspect()}>{busy ? (zh ? "处理中…" : "Working…") : (zh ? "读取 GitHub 版本" : "Load GitHub releases")}</Button>{releases.length > 0 && <label className="block text-sm">{zh ? "选择版本" : "Select release"}<select className="mt-1 w-full rounded-md border bg-background p-2" value={chosen} disabled={locked} onChange={e => { const release = releases.find(r => r.source === e.target.value); if (release) choose(release); }}><option value="">{zh ? "请选择" : "Select"}</option>{releases.map(r => <option key={r.source} value={r.source} disabled={Boolean(releaseId && (r.version !== version || r.channel !== channel))}>{r.version} · {r.title} · {r.assets.length} {zh ? "个附件" : "assets"}</option>)}</select></label>}</div>}
    {mode === "url" && (releaseId ? <div className="space-y-2"><label className="block text-sm">{zh ? "文件下载直链" : "Direct file URL"}<Input data-testid="remote-file-url" value={url} disabled={locked} placeholder="https://…/package.zip" onChange={e => setUrl(e.target.value)} /></label><Button type="button" variant="outline" disabled={locked || !url.trim()} data-testid="add-remote-url" onClick={addUrl}>{zh ? "添加到导入列表" : "Add to import list"}</Button></div> : <p className="text-sm text-muted-foreground">{zh ? "先填写并保存下方版本资料，再添加文件链接。" : "Save the release details below, then add file URLs."}</p>)}
    {releaseId && <div hidden={mode !== "local"}><ArtifactUpload releaseId={releaseId} productSlug={productSlug} version={version} artifacts={artifacts} disabled={disabled || operationBusy} /></div>}
    {mode === "local" && !releaseId && <p className="text-sm text-muted-foreground">{zh ? "先填写并保存下方版本资料，再选择本地文件。" : "Save the release details below, then choose local files."}</p>}
    {mode !== "local" && items.length > 0 && <div className="mt-3 space-y-2"><details open={Boolean(releaseId)}><summary className="cursor-pointer text-sm">{zh ? `可导入附件（${items.length}）` : `Available assets (${items.length})`}</summary><div className="max-h-72 space-y-2 overflow-y-auto">{items.map((item, index) => <div key={`${item.url}-${index}`} className="min-w-0 rounded-md border p-2" data-remote-file={item.name}><label className="flex items-start gap-2 text-sm">{releaseId && <input type="checkbox" className="mt-1" disabled={locked || item.state === "done"} checked={item.selected} onChange={e => patch(index, { selected: e.target.checked })} />}<span className="break-all">{item.name}{item.sourceName && item.sourceName !== item.name && <span className="block text-xs text-muted-foreground">{zh ? "官网签名清单来源：" : "Signed website feed: "}{item.sourceName}</span>}</span></label>{releaseId && item.selected && <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">{([['platform', zh ? '平台' : 'Platform'], ['architecture', zh ? '架构' : 'Architecture'], ['packageKind', zh ? '包类型' : 'Package type']] as const).map(([key, label]) => <label key={key} className="min-w-0 text-xs">{label}<Input className="mt-1 h-8" value={item[key]} disabled={locked || item.state === "done"} onChange={e => patch(index, { [key]: e.target.value })} /></label>)}</div>}<p className="mt-1 break-words text-xs text-muted-foreground">{item.state === "done" ? (zh ? "已导入，待发布" : "Imported, not published") : item.state === "loading" ? (zh ? "服务器正在下载…" : "Server downloading…") : errorText(item.state)}</p></div>)}</div></details>{releaseId ? <Button type="button" data-testid="import-remote-files" disabled={locked || !items.some(i => i.selected && i.state !== "done")} onClick={() => void importFiles()}>{zh ? "导入选中文件" : "Import selected files"}</Button> : <p className="text-sm text-muted-foreground">{zh ? "资料已自动填入下方；保存版本后即可确认导入附件。" : "Details are filled below. Save the release, then confirm which assets to import."}</p>}</div>}
    {message && <p role="status" className="mt-3 break-words text-sm">{message}</p>}
    <p className="mt-3 text-xs text-muted-foreground">{zh ? "文件导入到商城后保存为草稿，检查完成后再确认发布。" : "Files are stored in the store as a draft. Review them before confirming publication."}</p>
  </section>;
}
