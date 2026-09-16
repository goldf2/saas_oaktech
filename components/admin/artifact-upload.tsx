"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSafeFileName, isSha512 } from "@/lib/store/policy";

const CHUNK_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024 * 1024;
const uploadErrors: Record<string, string> = {
  ARTIFACT_SLOT_ALREADY_EXISTS: "该平台、架构和包类型已有文件，请勿重复上传。",
  UPLOAD_OFFSET_MISMATCH: "分片接收位置不一致，本次上传未完成，请重新上传。",
  DRAFT_RELEASE_NOT_FOUND: "草稿不存在或已发布，请刷新页面。",
  DRAFT_RELEASE_CHANGED: "上传期间草稿发生变化，请刷新后重试。",
  STORE_ADMIN_FORBIDDEN: "没有上传权限，请重新登录管理员账户。",
  ARTIFACT_SAVED_AUDIT_FAILED: "文件已保存，但审计记录写入失败。请检查存储状态，不要重复上传。",
};

type UploadResult = { receivedBytes?: number; sizeBytes?: number; sha512?: string; error?: string; committed?: boolean };

export function ArtifactUpload({ releaseId }: { releaseId: string }) {
  const router = useRouter();
  const inputId = useId();
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    // React's event.currentTarget is cleared after an async boundary.
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get("file");
    setFailed(false);
    setProgress(0);
    if (!(file instanceof File) || !file.size) {
      setFailed(true);
      setMessage("请选择非空的软件包。");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES || !isSafeFileName(file.name)) {
      setFailed(true);
      setMessage(file.size > MAX_UPLOAD_BYTES ? "单个软件包不能超过 4 GiB。" : "文件名请使用英文字母、数字、点、连字符、下划线或加号，不要包含空格。");
      return;
    }
    setBusy(true);
    setMessage("开始分片上传…");
    try {
      const uploadId = crypto.randomUUID();
      let result: UploadResult = {};
      for (let offset = 0; offset < file.size; offset += CHUNK_BYTES) {
        const end = Math.min(offset + CHUNK_BYTES, file.size);
        const query = new URLSearchParams({
          releaseId,
          platform: String(form.get("platform") ?? "").trim(),
          architecture: String(form.get("architecture") ?? "").trim(),
          packageKind: String(form.get("package_kind") ?? "").trim(),
          uploadId,
          offset: String(offset),
          final: String(end === file.size),
        });
        setMessage(end === file.size ? "正在上传最后一片并进行 SHA-512 校验…" : `已上传 ${Math.floor((offset / file.size) * 100)}%…`);
        const response = await fetch(`/api/admin/releases/upload?${query}`, {
          method: "POST",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "x-file-name": encodeURIComponent(file.name),
            "x-oaktech-admin-upload": "1",
          },
          body: file.slice(offset, end),
        });
        result = await response.json().catch(() => ({ error: `上传服务返回 HTTP ${response.status}，请检查网络或反向代理。` }));
        if (!response.ok) {
          if (result.committed) router.refresh();
          throw new Error(uploadErrors[result.error ?? ""] ?? result.error ?? `上传失败：HTTP ${response.status}`);
        }
        if (end < file.size && result.receivedBytes !== end) throw new Error("服务器未确认完整分片，本次上传未完成。");
        if (end === file.size && (result.sizeBytes !== file.size || !isSha512(result.sha512 ?? ""))) {
          throw new Error("服务器未返回有效的文件大小和校验值，请刷新并核对文件。");
        }
        // Progress advances only after the server acknowledges each chunk.
        setProgress(Math.round((end / file.size) * 100));
      }
      setMessage(`上传完成 · ${result.sizeBytes} 字节 · SHA-512 ${result.sha512!.slice(0, 16)}…`);
      formElement.reset();
      router.refresh();
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "上传失败，请检查网络后重试。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={upload} className="mt-5 rounded-md border bg-muted/30 p-4" aria-busy={busy}>
      <fieldset disabled={busy} className="grid min-w-0 gap-3 md:grid-cols-4">
        <label className="min-w-0 text-sm">平台<Input name="platform" list={`${inputId}-platforms`} placeholder="macos / windows / chrome" required /></label>
        <datalist id={`${inputId}-platforms`}>{["macos", "windows", "linux", "chrome", "firefox", "web"].map((value) => <option key={value} value={value} />)}</datalist>
        <label className="min-w-0 text-sm">架构<Input name="architecture" placeholder="arm64 / x64 / universal" required /></label>
        <label className="min-w-0 text-sm">包类型<Input name="package_kind" placeholder="zip / nsis / dmg / appimage" required /></label>
        <label className="min-w-0 text-sm">软件包<Input name="file" type="file" required /></label>
        <div className="flex flex-wrap items-center gap-3 md:col-span-4">
          <Button type="submit" size="sm" disabled={busy}>{busy ? "上传与校验中…" : "上传软件包"}</Button>
          <span className="text-xs text-muted-foreground">8 MiB 分片 · 单文件上限 4 GiB · 上传后仍需审核发布</span>
        </div>
      </fieldset>
      {(busy || progress > 0) && <progress value={progress} max={100} aria-label="上传进度" className="mt-3 h-2 w-full" />}
      {message && <p role={failed ? "alert" : "status"} className={`mt-2 break-words text-xs ${failed ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>}
    </form>
  );
}
