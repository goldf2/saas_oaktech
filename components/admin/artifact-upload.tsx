"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileArchive, RefreshCw, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReleaseActivity } from "./release-flow-context";
import { artifactSlot, fileSelectionError, formatBytes, MAX_UPLOAD_QUEUE, suggestUploadSlot, uploadConflict, type ArtifactRow, type UploadSlot } from "@/lib/store/release-workflow";
import { uploadReleaseFile, UploadProblem } from "@/lib/store/upload-client";
import { useLocale } from "@/i18n/locale-provider";

type QueueItem = UploadSlot & { id: string; file: File; state: "queued" | "uploading" | "uploaded" | "error" | "uncertain"; received: number; message: string };
export function ArtifactUpload({ releaseId, productSlug = "", version = "", artifacts = [], disabled = false, disabledReason }: { releaseId: string; productSlug?: string; version?: string; artifacts?: ArtifactRow[]; disabled?: boolean; disabledReason?: string }) {
  const router = useRouter(), inputId = useId(), fileInput = useRef<HTMLInputElement>(null);
  const { locale } = useLocale();
  const zh = locale === "zh";
  const resolvedDisabledReason = disabledReason ?? (zh ? "正在处理，请稍候再上传。" : "Another operation is in progress. Please wait before uploading.");
  const selectionError = (error: string) => zh ? error : error.includes("空文件") ? "Empty files cannot be uploaded." : error.includes("4 GiB") ? "A file cannot exceed 4 GiB." : error.includes("文件名") ? "The filename contains unsupported characters." : "This file cannot be selected.";
  const [items, setItems] = useState<QueueItem[]>([]), [busy, setBusy] = useState(false), [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState(""), [failed, setFailed] = useState(false);
  const inFlight = useRef(false), stopAfterCurrent = useRef(false);
  const pending = items.filter(x => x.state === "queued" || x.state === "error");
  useReleaseActivity(`upload-${releaseId}`, items.some(x => x.state !== "uploaded"), busy);
  function patch(id: string, update: Partial<QueueItem>) { setItems(previous => previous.map(x => x.id === id ? { ...x, ...update } : x)); }
  function select(files: FileList | File[] | null) {
    if (!files || busy || disabled) return;
    const next: QueueItem[] = [], errors: string[] = [];
    for (const file of Array.from(files)) {
      const error = fileSelectionError(file.name, file.size);
      if (error) { errors.push(`${file.name}: ${selectionError(error)}`); continue; }
      if (artifacts.some(a => a.file_name === file.name) || items.some(x => x.file.name === file.name) || next.some(x => x.file.name === file.name)) { errors.push(zh ? `${file.name} 已在服务器或上传队列中。` : `${file.name} is already on the server or in the upload queue.`); continue; }
      if (items.length + next.length >= MAX_UPLOAD_QUEUE) { errors.push(zh ? `队列最多 ${MAX_UPLOAD_QUEUE} 个文件，请先完成当前上传。` : `The queue supports at most ${MAX_UPLOAD_QUEUE} files. Finish the current upload first.`); break; }
      next.push({ ...suggestUploadSlot(file.name, productSlug, version), id: crypto.randomUUID(), file, state: "queued", received: 0, message: zh ? "等待上传，请确认平台、架构和包类型。" : "Waiting to upload. Confirm platform, architecture, and package type." });
    }
    setItems(previous => [...previous, ...next]); setFailed(errors.length > 0);
    setMessage(errors.join("\n") || (zh ? `已选择 ${next.length} 个文件。确认下方信息后开始上传，尚未公开。` : `${next.length} files selected. Confirm the metadata below before uploading; nothing is public yet.`));
  }
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || disabled || !pending.length) return;
    // Validate the entire queue before any request so missing metadata cannot cause a partial batch.
    const slots = new Set<string>();
    for (const item of pending) {
      const conflict = uploadConflict(item.file.name, item, artifacts);
      if (![item.platform, item.architecture, item.packageKind].every(x => /^[a-z0-9][a-z0-9._-]*$/.test(x.trim()))) { setFailed(true); setMessage(zh ? `请补齐 ${item.file.name} 的平台、架构和包类型。` : `Complete the platform, architecture, and package type for ${item.file.name}.`); return; }
      if (conflict || slots.has(artifactSlot(item))) { setFailed(true); setMessage(zh ? `${item.file.name}：${conflict ?? "队列中有重复的平台 / 架构 / 包类型，请修正。"}` : `${item.file.name}: duplicate filename or platform / architecture / package-type slot.`); return; }
      slots.add(artifactSlot(item));
    }
    inFlight.current = true; stopAfterCurrent.current = false; setBusy(true); setFailed(false); setMessage(zh ? "上传进行中：等待服务器逐片确认。当前版本仍是私有草稿。" : "Upload in progress. Waiting for server acknowledgements; this release is still a private draft.");
    let completed = 0;
    try {
      for (const item of pending) {
        if (stopAfterCurrent.current) break;
        patch(item.id, { state: "uploading", received: 0, message: zh ? "上传并校验中…" : "Uploading and validating…" });
        try {
          const result = await uploadReleaseFile({ releaseId, file: item.file, slot: item, uploadId: crypto.randomUUID(), onAcknowledged: received => patch(item.id, { received }) });
          patch(item.id, { state: "uploaded", received: item.file.size, message: zh ? `上传完成 · SHA-512 ${result.sha512.slice(0, 16)}… · 未发布` : `Upload complete · SHA-512 ${result.sha512.slice(0, 16)}… · not published` }); completed++;
        } catch (error) {
          const problem = error instanceof UploadProblem ? error : new UploadProblem(zh ? "上传未完成，请刷新核对文件。" : "Upload did not finish. Refresh and review the files.", true);
          patch(item.id, { state: problem.mustReconcile ? "uncertain" : "error", message: zh ? problem.message : "Upload result needs review." });
          setFailed(true); setMessage(zh ? `${item.file.name}：${problem.message} 后续文件已暂停，已完成的文件不会重传。` : `${item.file.name}: upload stopped. Later files are paused and completed files will not be resent.`);
          return;
        }
      }
      setMessage(zh ? `上传完成 ${completed} 个文件${stopAfterCurrent.current ? "，后续队列已暂停" : ""}。仍未公开，请到“校验预览”确认发布。` : `${completed} files uploaded${stopAfterCurrent.current ? "; the remaining queue is paused" : ""}. Nothing is public yet; continue to the verification preview to publish.`);
    } finally { inFlight.current = false; setBusy(false); router.refresh(); }
  }
  const total = items.reduce((n, x) => n + x.file.size, 0), received = items.reduce((n, x) => n + x.received, 0);
  return <section data-testid="artifact-upload" className="min-w-0 rounded-lg border bg-background p-3 sm:p-4" aria-label={zh ? "上传安装包与更新清单" : "Upload packages and update manifests"}>
    <div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">2</span><div><h3 className="font-semibold">{zh ? "上传安装包与更新清单" : "Upload packages and update manifests"}</h3><p className="mt-1 text-xs text-muted-foreground">{zh ? "选择或拖入文件 → 确认信息 → 上传。此处不会直接发布。" : "Choose or drag files → confirm metadata → upload. This does not publish them."}</p></div></div>
    <form onSubmit={upload} aria-busy={busy} className="mt-3 min-w-0 space-y-3">
      <div className={`relative rounded-lg border border-dashed px-3 py-3 text-center transition-colors ${dragging ? "border-primary bg-primary/10" : "border-primary/35 bg-primary/5"} ${disabled ? "opacity-60" : ""}`} onDragOver={e => { e.preventDefault(); if (!disabled && !busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); select(e.dataTransfer.files); }}>
        <UploadCloud className="mx-auto h-6 w-6 text-primary" aria-hidden="true" /><p className="mt-1 text-sm font-medium">{zh ? "把软件文件拖到这里" : "Drop software files here"}</p><p className="mt-1 text-xs text-muted-foreground">{zh ? "支持多选 · 单文件最多 4 GiB · 每次最多 12 个" : "Multiple files · up to 4 GiB each · up to 12 per batch"}</p>
        <input id={inputId} ref={fileInput} type="file" name="file" multiple tabIndex={-1} className="sr-only" aria-label={zh ? "选择软件文件" : "Choose software files"} disabled={busy || disabled} onChange={e => { select(e.target.files); e.target.value = ""; }} />
        <Button type="button" className="mt-2 h-9" disabled={busy || disabled} onClick={() => fileInput.current?.click()}><UploadCloud className="mr-2 h-4 w-4" aria-hidden="true" />{zh ? "选择软件文件" : "Choose software files"}</Button>
        {disabled && !busy && <p className="mt-2 text-sm font-medium">{resolvedDisabledReason}</p>}
      </div>
      <div className="grid min-w-0 gap-2">{items.map(item => <div key={item.id} data-queue-file={item.file.name} className="min-w-0 rounded-md border p-2.5">
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="flex items-start gap-2 break-all text-sm font-medium"><FileArchive className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />{item.file.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatBytes(item.file.size)} · {item.state === "uploaded" ? (zh ? "已上传，未发布" : "Uploaded, not published") : item.state === "uploading" ? (zh ? "正在上传" : "Uploading") : item.state === "uncertain" ? (zh ? "结果待核对" : "Result needs review") : item.state === "error" ? (zh ? "上传失败" : "Upload failed") : (zh ? "本地队列" : "Local queue")}</p></div><Button type="button" variant="ghost" size="sm" title={zh ? "仅从本地队列移除，不删除已上传文件" : "Remove from local queue only; uploaded server files are not deleted"} aria-label={zh ? `从队列移除 ${item.file.name}` : `Remove ${item.file.name} from queue`} disabled={busy} onClick={() => setItems(previous => previous.filter(x => x.id !== item.id))}><X className="h-4 w-4" aria-hidden="true" /></Button></div>
        <fieldset disabled={busy || disabled || item.state === "uploaded" || item.state === "uncertain"} className="mt-2 grid min-w-0 grid-cols-3 gap-2">
          <label className="min-w-0 text-xs">{zh ? "平台" : "Platform"}<Input name="platform" list={`${inputId}-platforms`} className="mt-1 h-9 px-2 text-sm" value={item.platform} placeholder={zh ? "选择平台" : "Select platform"} required onChange={e => patch(item.id, { platform: e.target.value })} /></label>
          <label className="min-w-0 text-xs">{zh ? "架构" : "Architecture"}<Input name="architecture" list={`${inputId}-architectures`} className="mt-1 h-9 px-2 text-sm" value={item.architecture} placeholder={zh ? "例如 arm64" : "e.g. arm64"} required onChange={e => patch(item.id, { architecture: e.target.value })} /></label>
          <label className="min-w-0 text-xs">{zh ? "包类型" : "Package type"}<Input name="package_kind" list={`${inputId}-kinds`} className="mt-1 h-9 px-2 text-sm" value={item.packageKind} placeholder={zh ? "例如 zip" : "e.g. zip"} required onChange={e => patch(item.id, { packageKind: e.target.value })} /></label>
        </fieldset>
        {item.state === "uploading" && <progress value={item.received} max={item.file.size} aria-label={zh ? `${item.file.name} 上传进度` : `${item.file.name} upload progress`} className="mt-3 h-2 w-full accent-primary" />}
        <p className={`mt-2 flex items-start gap-1.5 break-words text-xs ${["error", "uncertain"].includes(item.state) ? "text-destructive" : item.state === "uploaded" ? "text-primary" : "text-muted-foreground"}`}>
          {item.state === "uploaded" ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> : ["error", "uncertain"].includes(item.state) ? <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}{item.message}</p>
      </div>)}</div>
      <datalist id={`${inputId}-platforms`}>{["macos", "windows", "linux", "chrome", "firefox", "web"].map(v => <option key={v} value={v} />)}</datalist>
      <datalist id={`${inputId}-architectures`}>{["arm64", "x64", "universal", "any"].map(v => <option key={v} value={v} />)}</datalist>
      <datalist id={`${inputId}-kinds`}>{["zip", "dmg", "nsis", "appimage", "manifest", "blockmap"].map(v => <option key={v} value={v} />)}</datalist>
      {busy && <div><div className="mb-1 flex justify-between text-xs"><span>{zh ? "服务器已确认" : "Server acknowledged"} {formatBytes(received)} / {formatBytes(total)}</span><span>{total ? Math.round(received / total * 100) : 0}%</span></div><progress value={received} max={Math.max(total, 1)} aria-label={zh ? "批量上传进度" : "Batch upload progress"} className="h-2 w-full accent-primary" /></div>}
      <div className="flex flex-wrap gap-2"><Button type="submit" className="h-9" disabled={busy || disabled || !pending.length}>{busy ? (zh ? "上传与校验中…" : "Uploading & validating…") : (zh ? `开始上传${pending.length ? `（${pending.length} 个文件）` : ""}` : `Start upload${pending.length ? ` (${pending.length} files)` : ""}`)}</Button>{busy && <Button type="button" className="h-9" variant="outline" onClick={() => { stopAfterCurrent.current = true; setMessage(zh ? "当前文件完成后停止，不中断服务器正在提交的文件。" : "Stop after the current file; the server submission already in progress is not interrupted."); }}>{zh ? "停止后续上传" : "Stop remaining uploads"}</Button>}{!busy && <Button type="button" className="h-9" variant="outline" onClick={() => router.refresh()}><RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />{zh ? "刷新文件列表" : "Refresh file list"}</Button>}</div>
      {message && <p role={failed ? "alert" : "status"} className={`whitespace-pre-wrap break-words rounded-md p-2.5 text-sm ${failed ? "bg-destructive/5 text-destructive" : "bg-muted/40 text-muted-foreground"}`}>{message}</p>}
      <p className="text-xs leading-relaxed text-muted-foreground">{zh ? "上传完成后自动更新文件清单。" : "The file list updates automatically after upload."}</p>
    </form>
  </section>;
}
