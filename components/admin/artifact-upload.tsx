"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, FileArchive, RefreshCw, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useReleaseActivity } from "./release-flow-context";
import { artifactSlot, fileSelectionError, formatBytes, MAX_UPLOAD_QUEUE, suggestUploadSlot, uploadConflict, type ArtifactRow, type UploadSlot } from "@/lib/store/release-workflow";
import { uploadReleaseFile, UploadProblem } from "@/lib/store/upload-client";

type QueueItem = UploadSlot & { id: string; file: File; state: "queued" | "uploading" | "uploaded" | "error" | "uncertain"; received: number; message: string };
export function ArtifactUpload({ releaseId, productSlug = "", version = "", artifacts = [], disabled = false, disabledReason = "正在处理，请稍候再上传。" }: { releaseId: string; productSlug?: string; version?: string; artifacts?: ArtifactRow[]; disabled?: boolean; disabledReason?: string }) {
  const router = useRouter(), inputId = useId(), fileInput = useRef<HTMLInputElement>(null);
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
      if (error) { errors.push(`${file.name}：${error}`); continue; }
      if (artifacts.some(a => a.file_name === file.name) || items.some(x => x.file.name === file.name) || next.some(x => x.file.name === file.name)) { errors.push(`${file.name} 已在服务器或上传队列中。`); continue; }
      if (items.length + next.length >= MAX_UPLOAD_QUEUE) { errors.push(`队列最多 ${MAX_UPLOAD_QUEUE} 个文件，请先完成当前上传。`); break; }
      next.push({ ...suggestUploadSlot(file.name, productSlug, version), id: crypto.randomUUID(), file, state: "queued", received: 0, message: "等待上传，请确认平台、架构和包类型。" });
    }
    setItems(previous => [...previous, ...next]); setFailed(errors.length > 0);
    setMessage(errors.join("\n") || `已选择 ${next.length} 个文件。确认下方信息后开始上传，尚未公开。`);
  }
  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || disabled || !pending.length) return;
    // Validate the entire queue before any request so missing metadata cannot cause a partial batch.
    const slots = new Set<string>();
    for (const item of pending) {
      const conflict = uploadConflict(item.file.name, item, artifacts);
      if (![item.platform, item.architecture, item.packageKind].every(x => /^[a-z0-9][a-z0-9._-]*$/.test(x.trim()))) { setFailed(true); setMessage(`请补齐 ${item.file.name} 的平台、架构和包类型。`); return; }
      if (conflict || slots.has(artifactSlot(item))) { setFailed(true); setMessage(`${item.file.name}：${conflict ?? "队列中有重复的平台 / 架构 / 包类型，请修正。"}`); return; }
      slots.add(artifactSlot(item));
    }
    inFlight.current = true; stopAfterCurrent.current = false; setBusy(true); setFailed(false); setMessage("上传进行中：等待服务器逐片确认。当前版本仍是私有草稿。");
    let completed = 0;
    try {
      for (const item of pending) {
        if (stopAfterCurrent.current) break;
        patch(item.id, { state: "uploading", received: 0, message: "上传并校验中…" });
        try {
          const result = await uploadReleaseFile({ releaseId, file: item.file, slot: item, uploadId: crypto.randomUUID(), onAcknowledged: received => patch(item.id, { received }) });
          patch(item.id, { state: "uploaded", received: item.file.size, message: `上传完成 · SHA-512 ${result.sha512.slice(0, 16)}… · 未发布` }); completed++;
        } catch (error) {
          const problem = error instanceof UploadProblem ? error : new UploadProblem("上传未完成，请刷新核对文件。", true);
          patch(item.id, { state: problem.mustReconcile ? "uncertain" : "error", message: problem.message });
          setFailed(true); setMessage(`${item.file.name}：${problem.message} 后续文件已暂停，已完成的文件不会重传。`);
          return;
        }
      }
      setMessage(`上传完成 ${completed} 个文件${stopAfterCurrent.current ? "，后续队列已暂停" : ""}。仍未公开，请到“校验预览”确认发布。`);
    } finally { inFlight.current = false; setBusy(false); router.refresh(); }
  }
  const total = items.reduce((n, x) => n + x.file.size, 0), received = items.reduce((n, x) => n + x.received, 0);
  return <section data-testid="artifact-upload" className="min-w-0 rounded-lg border bg-background p-3 sm:p-4" aria-label="上传安装包与更新清单">
    <div className="flex items-center gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">2</span><div><h3 className="font-semibold">上传安装包与更新清单</h3><p className="mt-1 text-xs text-muted-foreground">选择或拖入文件 → 确认信息 → 上传。此处不会直接发布。</p></div></div>
    <form onSubmit={upload} aria-busy={busy} className="mt-3 min-w-0 space-y-3">
      <div className={`relative rounded-lg border border-dashed px-3 py-3 text-center transition-colors ${dragging ? "border-primary bg-primary/10" : "border-primary/35 bg-primary/5"} ${disabled ? "opacity-60" : ""}`} onDragOver={e => { e.preventDefault(); if (!disabled && !busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); select(e.dataTransfer.files); }}>
        <UploadCloud className="mx-auto h-6 w-6 text-primary" aria-hidden="true" /><p className="mt-1 text-sm font-medium">把软件文件拖到这里</p><p className="mt-1 text-xs text-muted-foreground">支持多选 · 单文件最多 4 GiB · 每次最多 12 个</p>
        <input id={inputId} ref={fileInput} type="file" name="file" multiple tabIndex={-1} className="sr-only" aria-label="选择软件文件" disabled={busy || disabled} onChange={e => { select(e.target.files); e.target.value = ""; }} />
        <Button type="button" className="mt-2 h-9" disabled={busy || disabled} onClick={() => fileInput.current?.click()}><UploadCloud className="mr-2 h-4 w-4" aria-hidden="true" />选择软件文件</Button>
        {disabled && !busy && <p className="mt-2 text-sm font-medium">{disabledReason}</p>}
      </div>
      <div className="grid min-w-0 gap-2">{items.map(item => <div key={item.id} data-queue-file={item.file.name} className="min-w-0 rounded-md border p-2.5">
        <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="flex items-start gap-2 break-all text-sm font-medium"><FileArchive className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />{item.file.name}</p><p className="mt-1 text-xs text-muted-foreground">{formatBytes(item.file.size)} · {item.state === "uploaded" ? "已上传，未发布" : item.state === "uploading" ? "正在上传" : item.state === "uncertain" ? "结果待核对" : item.state === "error" ? "上传失败" : "本地队列"}</p></div><Button type="button" variant="ghost" size="sm" title="仅从本地队列移除，不删除已上传文件" aria-label={`从队列移除 ${item.file.name}`} disabled={busy} onClick={() => setItems(previous => previous.filter(x => x.id !== item.id))}><X className="h-4 w-4" aria-hidden="true" /></Button></div>
        <fieldset disabled={busy || disabled || item.state === "uploaded" || item.state === "uncertain"} className="mt-2 grid min-w-0 grid-cols-3 gap-2">
          <label className="min-w-0 text-xs">平台<Input name="platform" list={`${inputId}-platforms`} className="mt-1 h-9 px-2 text-sm" value={item.platform} placeholder="选择平台" required onChange={e => patch(item.id, { platform: e.target.value })} /></label>
          <label className="min-w-0 text-xs">架构<Input name="architecture" list={`${inputId}-architectures`} className="mt-1 h-9 px-2 text-sm" value={item.architecture} placeholder="例如 arm64" required onChange={e => patch(item.id, { architecture: e.target.value })} /></label>
          <label className="min-w-0 text-xs">包类型<Input name="package_kind" list={`${inputId}-kinds`} className="mt-1 h-9 px-2 text-sm" value={item.packageKind} placeholder="例如 zip" required onChange={e => patch(item.id, { packageKind: e.target.value })} /></label>
        </fieldset>
        {item.state === "uploading" && <progress value={item.received} max={item.file.size} aria-label={`${item.file.name} 上传进度`} className="mt-3 h-2 w-full accent-primary" />}
        <p className={`mt-2 flex items-start gap-1.5 break-words text-xs ${["error", "uncertain"].includes(item.state) ? "text-destructive" : item.state === "uploaded" ? "text-primary" : "text-muted-foreground"}`}>
          {item.state === "uploaded" ? <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" /> : ["error", "uncertain"].includes(item.state) ? <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}{item.message}</p>
      </div>)}</div>
      <datalist id={`${inputId}-platforms`}>{["macos", "windows", "linux", "chrome", "firefox", "web"].map(v => <option key={v} value={v} />)}</datalist>
      <datalist id={`${inputId}-architectures`}>{["arm64", "x64", "universal", "any"].map(v => <option key={v} value={v} />)}</datalist>
      <datalist id={`${inputId}-kinds`}>{["zip", "dmg", "nsis", "appimage", "manifest", "blockmap"].map(v => <option key={v} value={v} />)}</datalist>
      {busy && <div><div className="mb-1 flex justify-between text-xs"><span>服务器已确认 {formatBytes(received)} / {formatBytes(total)}</span><span>{total ? Math.round(received / total * 100) : 0}%</span></div><progress value={received} max={Math.max(total, 1)} aria-label="批量上传进度" className="h-2 w-full accent-primary" /></div>}
      <div className="flex flex-wrap gap-2"><Button type="submit" className="h-9" disabled={busy || disabled || !pending.length}>{busy ? "上传与校验中…" : `开始上传${pending.length ? `（${pending.length} 个文件）` : ""}`}</Button>{busy && <Button type="button" className="h-9" variant="outline" onClick={() => { stopAfterCurrent.current = true; setMessage("当前文件完成后停止，不中断服务器正在提交的文件。"); }}>停止后续上传</Button>}{!busy && <Button type="button" className="h-9" variant="outline" onClick={() => router.refresh()}><RefreshCw className="mr-1.5 h-4 w-4" aria-hidden="true" />刷新文件列表</Button>}</div>
      {message && <p role={failed ? "alert" : "status"} className={`whitespace-pre-wrap break-words rounded-md p-2.5 text-sm ${failed ? "bg-destructive/5 text-destructive" : "bg-muted/40 text-muted-foreground"}`}>{message}</p>}
      <p className="text-xs leading-relaxed text-muted-foreground">上传采用 8 MiB 分片；进度以服务器确认结果为准。上传校验不是正式发布签名验收；文件保存后不允许直接覆盖。</p>
    </form>
  </section>;
}
