import { isSha512 } from "./policy.ts";
import type { UploadSlot } from "./release-workflow";

export const UPLOAD_CHUNK_BYTES = 8 * 1024 * 1024;
export class UploadProblem extends Error {
  readonly mustReconcile: boolean;
  constructor(message: string, mustReconcile = false) { super(message); this.mustReconcile = mustReconcile; }
}
const messages: Record<string, string> = {
  ARTIFACT_SLOT_ALREADY_EXISTS: "该平台 / 架构 / 包类型已有文件，请刷新核对，不能重复覆盖。",
  UPLOAD_OFFSET_MISMATCH: "服务器接收位置不一致，本次上传未完成，请重新上传。",
  DRAFT_RELEASE_NOT_FOUND: "版本不存在或已经发布，请刷新核对。",
  DRAFT_RELEASE_CHANGED: "上传时版本被其他操作修改，请刷新核对。",
  STORE_ADMIN_FORBIDDEN: "没有上传权限，请使用有权限的管理员账户。",
  ARTIFACT_SAVED_AUDIT_FAILED: "文件可能已经保存，但审计记录失败。请刷新核对，不要重复上传。",
};
export async function uploadReleaseFile(input: {
  releaseId: string; file: Blob & { name: string }; slot: UploadSlot; uploadId: string;
  fetcher?: typeof fetch; onAcknowledged: (bytes: number) => void;
}) {
  const { file, slot, releaseId, uploadId, onAcknowledged } = input;
  const fetcher = input.fetcher ?? fetch;
  let last: { sizeBytes?: number; sha512?: string } = {};
  for (let offset = 0; offset < file.size; offset += UPLOAD_CHUNK_BYTES) {
    const end = Math.min(offset + UPLOAD_CHUNK_BYTES, file.size), final = end === file.size;
    const query = new URLSearchParams({ releaseId, platform: slot.platform.trim(), architecture: slot.architecture.trim(), packageKind: slot.packageKind.trim(), uploadId, offset: String(offset), final: String(final) });
    let response: Response;
    try {
      response = await fetcher(`/api/admin/releases/upload?${query}`, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream", "x-file-name": encodeURIComponent(file.name), "x-oaktech-admin-upload": "1" }, body: file.slice(offset, end) });
    } catch { throw new UploadProblem("连接中断，无法确认服务器是否已保存。请刷新版本文件后再决定是否重试。", true); }
    let result: { error?: string; committed?: boolean; receivedBytes?: number; sizeBytes?: number; sha512?: string };
    try { result = await response.json(); }
    catch { throw new UploadProblem(`上传响应无法解析（HTTP ${response.status}）。请刷新核对服务器文件。`, true); }
    if (!response.ok) {
      const uncertain = !!result.committed || response.status >= 500 || ["ARTIFACT_SLOT_ALREADY_EXISTS", "DRAFT_RELEASE_CHANGED", "DRAFT_RELEASE_NOT_FOUND"].includes(result.error ?? "");
      throw new UploadProblem(messages[result.error ?? ""] ?? `上传失败（HTTP ${response.status}），请检查文件、网络及版本状态。`, uncertain);
    }
    if (!final && result.receivedBytes !== end) throw new UploadProblem("服务器没有确认完整分片，已暂停上传，请刷新核对。", true);
    if (final && (result.sizeBytes !== file.size || !isSha512(result.sha512 ?? ""))) throw new UploadProblem("没有收到有效的大小和校验值，无法确认上传完成。请刷新核对，不要重复提交。", true);
    onAcknowledged(end);
    last = result;
  }
  return { sizeBytes: last.sizeBytes!, sha512: last.sha512! };
}
