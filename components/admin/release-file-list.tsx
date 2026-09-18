import { CheckCircle2, Circle, Download } from "lucide-react";
import { formatBytes } from "@/lib/store/release-workflow";
import { releaseDisplayRows } from "@/lib/store/release-display";
import type { AdminProductReleaseRow } from "@/lib/store/types";

// One list holds both missing requirements and received files. Receipt is not signature approval.
export function ReleaseFileList({ release }: { release: AdminProductReleaseRow }) {
  const published = release.status === "published";
  const rows = releaseDisplayRows(release);
  if (!rows.length) return <p className="py-4 text-center text-sm text-muted-foreground">尚无文件。选择上方软件文件开始上传。</p>;
  return <ul className="mt-2 divide-y" aria-label="版本文件与缺项">
    {rows.map(row => <li key={row.key} data-artifact-row={row.artifact?.id} className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2 gap-y-1 py-2 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
      {row.artifact ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-label="文件已接收" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-label="待上传" />}
      <div className="min-w-0">
        <p className="break-all text-sm font-medium">{row.name}</p>
        <p className="mt-0.5 break-words text-xs text-muted-foreground">{row.label} · {row.platform}/{row.architecture} · {row.kind}{row.artifact ? ` · ${formatBytes(row.artifact.size_bytes)}` : " · 待上传"}</p>
      </div>
      <div className="col-start-2 flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1 text-xs sm:col-start-3 sm:max-w-xs">
        {row.artifact && <details className="min-w-0"><summary className="cursor-pointer py-1 text-muted-foreground">SHA-512</summary><code className="block max-w-xs break-all py-1 text-xs">{row.artifact.sha512}</code></details>}
        {published && row.artifact && <a href={row.artifact.public_path} download={row.artifact.file_name} className="inline-flex min-h-8 items-center gap-1 text-primary underline"><Download className="h-3.5 w-3.5" aria-hidden="true" />下载已发布文件</a>}
      </div>
    </li>)}
  </ul>;
}
