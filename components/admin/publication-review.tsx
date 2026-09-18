"use client";

import { ArrowLeft, AlertCircle, Globe, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPublicationSummary } from "./product-publication-summary";
import { formatBytes, productPublicationIssues, releaseReadiness, selectReleaseForPublication } from "@/lib/store/release-workflow";
import type { AdminProductReleaseRow, AdminStoreProductRow } from "@/lib/store/types";

export type PublicationMode = "product" | "software";
export function PublicationReview({ product, liveProduct = null, onSave, productIsPublished, onFixProduct, releases, selected, setSelected, dirty, releaseDirty, existing, disabled, confirmed, setConfirmed, onPublish, onBack, mode, onModeChange }: {
  product: AdminStoreProductRow; productIsPublished: boolean;
  liveProduct?: AdminStoreProductRow | null; onSave?: () => void;
  onFixProduct: (tab: "details" | "media", field?: string) => void;
  releases: AdminProductReleaseRow[]; selected: string[]; setSelected: (ids: string[]) => void;
  dirty: boolean; releaseDirty: boolean; existing: boolean; disabled: boolean;
  confirmed: boolean; setConfirmed: (value: boolean) => void; onPublish: () => void; onBack: () => void;
  mode: PublicationMode; onModeChange: (mode: PublicationMode) => void;
}) {
  const productIssues = productPublicationIssues(product);
  const drafts = releases.filter(r => r.status === "draft");
  const chosen = drafts.filter(r => selected.includes(r.id));
  const software = mode === "software";
  const stale = chosen.length !== selected.length;
  const conflict = new Set(chosen.map(r => r.channel)).size !== chosen.length;
  const blockedFiles = chosen.some(r => !releaseReadiness(r).ready);
  const canConfirm = existing && !disabled && (software
    ? !releaseDirty && chosen.length > 0 && !stale && !conflict && !blockedFiles
    : !dirty && productIssues.length === 0);
  return <section data-testid="publication-review" data-publication-scope={mode} className="min-w-0 space-y-2 rounded-lg border bg-background p-3 sm:p-4">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
      <h2 className="text-lg font-semibold">{software ? "发布软件版本" : "发布商品资料"}</h2>
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted/50 p-1" role="group" aria-label="选择发布对象">
        <Button type="button" size="sm" variant="ghost" data-publication-mode="product" aria-pressed={!software} disabled={disabled} onClick={() => onModeChange("product")} className="h-9 aria-pressed:bg-background aria-pressed:text-primary aria-pressed:shadow-sm"><Globe className="mr-1.5 h-4 w-4" />商品资料</Button>
        <Button type="button" size="sm" variant="ghost" data-publication-mode="software" aria-pressed={software} disabled={disabled} onClick={() => onModeChange("software")} className="h-9 aria-pressed:bg-background aria-pressed:text-primary aria-pressed:shadow-sm"><PackageCheck className="mr-1.5 h-4 w-4" />软件版本</Button>
      </div>
    </div>
    {!software ? <>
      <p data-testid="metadata-only-notice" className="rounded-lg bg-primary/5 p-3 text-sm">更新商品名称、介绍、图片和视频。无需安装包；软件版本保持不变。</p>
      <ProductPublicationSummary product={product} live={liveProduct} dirty={dirty} />
      {productIssues.length > 0 && <div data-testid="product-publication-issues" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/20">
        <h3 className="font-semibold">需要处理的项目</h3><div className="mt-2 flex flex-wrap gap-2">{productIssues.map(issue => <Button key={issue.field} className="h-auto min-h-9 whitespace-normal text-left" variant="outline" type="button" size="sm" onClick={() => onFixProduct(issue.tab, issue.field)} disabled={disabled}>{issue.label} →</Button>)}</div>
      </div>}
      {dirty && <div role="alert" className="rounded-lg bg-muted/40 p-3 text-sm">有未保存修改，请先保存，再确认发布。
        {onSave && <Button type="button" variant="outline" className="ml-3" data-testid="save-for-product-publication" disabled={disabled} onClick={onSave}>保存草稿并继续</Button>}
      </div>}
      {!existing && <p className="text-sm text-muted-foreground">请先保存并创建商品记录。</p>}
    </> : <>
      <p data-testid="software-only-notice" className="rounded-lg bg-primary/5 p-3 text-sm">仅开放选中的软件版本和下载；商品介绍及其草稿保持不变。</p>
      {!productIsPublished && <p data-testid="unlisted-product-release-warning" className="rounded-lg border border-amber-300 p-3 text-sm">商品尚未上架。软件发布后安装包可通过其正式下载地址获取，但不会自动公开商品介绍页。需要展示商品时，请另行发布商品资料。</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">选择本次发布的软件版本</h3><Button type="button" variant="outline" onClick={onBack} disabled={disabled}><ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />返回软件版本</Button></div>
      <p className="text-xs text-muted-foreground">同一渠道一次只切换一个当前版本；所有选中安装包仍需服务端大小、摘要及适用的签名校验。未选版本保持原状。</p>
      {drafts.length ? <div className="space-y-2">{drafts.map(release => {
        const readiness = releaseReadiness(release), checked = selected.includes(release.id);
        return <div key={release.id} className={`min-w-0 rounded-lg border p-3 ${checked ? "border-primary bg-primary/5" : ""}`}>
          <label className="flex items-start gap-3 text-sm"><input className="mt-1 h-4 w-4 shrink-0 accent-primary" type="checkbox" data-release-select={release.id} checked={checked} disabled={disabled || releaseDirty || !readiness.ready} onChange={e => setSelected(selectReleaseForPublication(selected, release.id, e.target.checked, releases))} />
            <span className="min-w-0 flex-1"><strong className="text-base">{release.version}</strong><span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{release.channel}</span>
              <span className={`ml-2 text-xs ${readiness.ready ? "text-primary" : "text-amber-700 dark:text-amber-300"}`}>{readiness.ready ? "文件资料齐备 · 待最终校验" : "尚需补齐文件或版本资料"}</span>
              <span className="mt-2 block text-xs text-muted-foreground">{readiness.installers} 个安装包 · {readiness.fileCount} 个文件 · {formatBytes(readiness.totalBytes)}</span>
              <span className="mt-1 block whitespace-pre-wrap break-words text-muted-foreground">{release.notes_zh || release.notes_en || "尚未填写更新说明"}</span>
            </span>
          </label>
          {readiness.blockers.length > 0 && <div className="mt-3 space-y-1 border-t pt-3">{readiness.blockers.map((text, i) => <p key={i} className="flex items-start gap-2 break-all text-xs text-amber-800 dark:text-amber-200"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{text}</p>)}</div>}
          {readiness.ready && <details className="ml-7 mt-3"><summary className="cursor-pointer text-xs text-muted-foreground">核对 {readiness.fileCount} 个待公开文件</summary><div className="mt-2 space-y-1.5">{release.release_artifacts.map(a => <p key={a.id} className="break-all text-xs text-muted-foreground">{a.file_name} · {a.platform}/{a.architecture} · {formatBytes(a.size_bytes)}</p>)}</div></details>}
        </div>;
      })}</div> : <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">没有待发布软件版本。可以返回软件版本创建版本并上传文件；商品资料发布不受影响。</p>}
      {releaseDirty && <p role="alert" className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">软件版本有未保存输入或待处理上传队列，请先处理软件版本；不需要保存商品资料。</p>}
      {(stale || conflict) && <p role="alert" className="text-sm text-destructive">所选版本已变化或渠道冲突，请刷新并核对软件版本。</p>}
    </>}
    <div className="border-t pt-3">
      {software && <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
        <input data-testid="confirm-software-publication" className="mt-1 h-4 w-4 shrink-0 accent-primary" type="checkbox" checked={confirmed} disabled={!canConfirm} onChange={e => setConfirmed(e.target.checked)} />
        <span>{`我确认公开 ${chosen.length ? chosen.map(r => `${r.version}（${r.channel}）`).join("、") : "所选软件版本"}的安装包与更新清单，不发布商品资料。`}</span>
      </label>}
      <div className={software ? "mt-3" : ""}><Button type="button" className="h-9" data-testid={software ? "publish-software" : "publish-product"} onClick={onPublish} disabled={!canConfirm || (software && !confirmed)}>{disabled ? "正在处理，请稍候…" : software ? `校验并发布 ${chosen.length} 个软件版本` : "发布商品资料"}</Button></div>
    </div>
  </section>;
}
