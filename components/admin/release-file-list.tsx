"use client";

import { useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { removeDraftArtifactAction } from "@/app/admin/products/editor-actions";
import { ReleaseFlowContext, useReleaseActivity } from "./release-flow-context";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Download } from "lucide-react";
import { formatBytes } from "@/lib/store/release-workflow";
import { releaseDisplayRows } from "@/lib/store/release-display";
import type { AdminProductReleaseRow } from "@/lib/store/types";
import { useLocale } from "@/i18n/locale-provider";

// One list holds both missing requirements and received files. Receipt is not signature approval.
export function ReleaseFileList({ release }: { release: AdminProductReleaseRow }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const router = useRouter();
  const { operationBusy } = useContext(ReleaseFlowContext);
  const [removing, setRemoving] = useState(false), [message, setMessage] = useState("");
  useReleaseActivity(`remove-artifact-${release.id}`, false, removing);
  async function remove(artifact: AdminProductReleaseRow["release_artifacts"][number]) {
    if (operationBusy || removing || !window.confirm(zh ? `移除草稿文件 ${artifact.file_name}？其他文件保留，之后可以重新导入。` : `Remove draft file ${artifact.file_name}? Other files remain and this file can be imported again.`)) return;
    setRemoving(true); setMessage("");
    try {
      const form = new FormData(); form.set("release_id", release.id); form.set("artifact_id", artifact.id); form.set("confirm_file", artifact.file_name); form.set("sha512", artifact.sha512);
      const result = await removeDraftArtifactAction(form);
      setMessage(zh ? (result.error ?? result.warning ?? "草稿文件已移除，可以重新导入。") : result.ok ? "Draft file removed. You can import it again." : "Could not remove the file. Refresh and review its state.");
      router.refresh();
    } catch { setMessage(zh ? "移除结果未确认，请刷新核对后再操作。" : "Removal was not confirmed. Refresh before retrying."); }
    finally { setRemoving(false); }
  }
  const label = (value: string) => zh ? value : value
    .replace("macOS 安装包", "macOS package")
    .replace("Windows 安装包", "Windows package")
    .replace("macOS 官网更新清单", "macOS update manifest")
    .replace("Windows 官网更新清单", "Windows update manifest")
    .replace("更新清单", "Update manifest")
    .replace("版本文件", "Release file");
  const published = release.status === "published";
  const rows = releaseDisplayRows(release);
  if (!rows.length) return <p className="py-4 text-center text-sm text-muted-foreground">{zh ? "尚无文件。选择上方软件文件开始上传。" : "No files yet. Choose software files above to start uploading."}</p>;
  return <><ul className="mt-2 divide-y" aria-label={zh ? "版本文件与缺项" : "Release files and missing requirements"}>
    {rows.map(row => <li key={row.key} data-artifact-row={row.artifact?.id} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1 py-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      {row.artifact ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-label={zh ? "文件已接收" : "File received"} /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-label={zh ? "待上传" : "Upload required"} />}
      <div className="min-w-0">
        <p className="break-all text-sm font-medium">{!row.artifact && <span className="mr-2 text-amber-700">{zh ? "缺少" : "Missing"}</span>}{row.name}</p>
        <p className="mt-0.5 break-words text-xs text-muted-foreground">{label(row.label)} · {row.platform}/{row.architecture} · {row.kind}{row.artifact ? ` · ${formatBytes(row.artifact.size_bytes)}` : (zh ? " · 预期文件名" : " · expected filename")}</p>
      </div>
      <div className="col-start-2 flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1 text-xs sm:col-start-3 sm:max-w-xs">
        {row.artifact && <details className="min-w-0"><summary className="cursor-pointer py-1 text-muted-foreground">SHA-512</summary><code className="block max-w-xs break-all py-1 text-xs">{row.artifact.sha512}</code></details>}
        {!published && row.artifact && <Button type="button" size="sm" variant="ghost" data-remove-artifact={row.artifact.file_name} disabled={operationBusy || removing} onClick={() => void remove(row.artifact!)}>{zh ? "移除" : "Remove"}</Button>}
        {published && row.artifact && <a href={row.artifact.public_path} download={row.artifact.file_name} className="inline-flex min-h-8 items-center gap-1 text-primary underline"><Download className="h-3.5 w-3.5" aria-hidden="true" />{zh ? "下载已发布文件" : "Download published file"}</a>}
      </div>
    </li>)}
  </ul>{message && <p role="status" className="mt-2 text-sm">{message}</p>}</>;
}
