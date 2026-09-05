import { Download, Laptop, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Locale, ReleaseArtifact } from "@/lib/store/types";

const copy = {
  en: {
    architecture: "Architecture",
    file: "Package",
    integrity: "SHA-512 verified",
    download: "Download for",
  },
  zh: {
    architecture: "处理器架构",
    file: "安装包",
    integrity: "SHA-512 已校验",
    download: "下载",
  },
} as const;

function formatPackageKind(value: string) {
  const labels: Record<string, string> = {
    nsis: "NSIS installer",
    portable: "Portable ZIP",
    zip: "ZIP archive",
    dmg: "Disk image",
  };
  return labels[value.toLowerCase()] ?? value;
}

export function StoreDownloadCard({
  artifact,
  locale,
  compact = false,
}: {
  artifact: ReleaseArtifact;
  locale: Locale;
  compact?: boolean;
}) {
  const labels = copy[locale];
  const size = `${(artifact.sizeBytes / 1024 / 1024).toFixed(1)} MB`;
  const checksum = artifact.sha512 ? `${artifact.sha512.slice(0, 12)}…` : "—";

  return (
    <article className={cn("store-download-card store-pressable", compact && "store-download-card-compact")}>
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--store-surface-muted))] text-[hsl(var(--store-blue))]">
          <Laptop className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className="store-chip">{size}</span>
      </div>
      <p className="mt-5 text-xs font-semibold text-[hsl(var(--store-secondary))]">{labels.architecture} · {artifact.architecture}</p>
      <h3 className="mt-1 text-xl font-semibold tracking-[-0.025em]">{artifact.platform}</h3>
      <p className="mt-2 text-sm text-[hsl(var(--store-secondary))]">{labels.file} · {formatPackageKind(artifact.packageKind)}</p>
      <p className="mb-5 mt-4 flex items-center gap-2 text-xs text-[hsl(var(--store-secondary))]">
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        {labels.integrity} · <code title={artifact.sha512}>{checksum}</code>
      </p>
      <a
        href={artifact.publicPath}
        download={artifact.fileName}
        className="store-download-action"
        aria-label={`${labels.download} ${artifact.platform}, ${artifact.architecture}, ${size}`}
      >
        {labels.download} {artifact.platform}
        <Download className="h-4 w-4" aria-hidden="true" />
      </a>
    </article>
  );
}
