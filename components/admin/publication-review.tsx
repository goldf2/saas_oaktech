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
    <div><h2 className="text-lg font-semibold">独立预览与发布</h2><p className="mt-2 text-sm text-muted-foreground">商品资料和软件版本分别确认、分别发布。一次操作只改变当前选中的发布对象。</p></div>
    <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="选择发布对象">
      <button type="button" data-publication-mode="product" aria-pressed={!software} disabled={disabled} onClick={() => onModeChange("product")}
        className="rounded-lg border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-primary/5 disabled:opacity-50">
        <span className="flex items-center gap-2 font-semibold"><Globe className="h-5 w-5" aria-hidden="true" />商品资料发布</span><span className="mt-1 block text-xs text-muted-foreground">名称、介绍、图片与视频；不发布或切换软件版本。</span>
      </button>
      <button type="button" data-publication-mode="software" aria-pressed={software} disabled={disabled} onClick={() => onModeChange("software")}
        className="rounded-lg border p-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-pressed:border-primary aria-pressed:bg-primary/5 disabled:opacity-50">
        <span className="flex items-center gap-2 font-semibold"><PackageCheck className="h-5 w-5" aria-hidden="true" />软件版本发布</span><span className="mt-1 block text-xs text-muted-foreground">版本、安装包和更新清单；不公开或保存商品资料草稿。</span>
      </button>
    </div>
    {!software ? <>
      <p data-testid="metadata-only-notice" className="rounded-lg bg-primary/5 p-3 text-sm">本次仅发布商品资料。已有软件版本和下载保持不变，待上传、待校验或未保存的软件版本不会阻止资料发布。</p>
      <ProductPublicationSummary product={product} live={liveProduct} dirty={dirty} />
      {productIssues.length > 0 && <div data-testid="product-publication-issues" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/20">
        <h3 className="font-semibold">商品资料尚需完善</h3><div className="mt-2 flex flex-wrap gap-2">{productIssues.map(issue => <Button key={issue.field} variant="outline" type="button" size="sm" onClick={() => onFixProduct(issue.tab, issue.field)} disabled={disabled}>{issue.label} →</Button>)}</div>
      </div>}
      {dirty && <div role="alert" className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">商品资料有未保存修改，保存后即可确认发布；软件版本不受影响。
        {onSave && <Button type="button" variant="outline" className="ml-3" data-testid="save-for-product-publication" disabled={disabled} onClick={onSave}>保存草稿并继续</Button>}
      </div>}
      {!existing && <p className="text-sm text-muted-foreground">请先保存并创建商品记录。</p>}
    </> : <>
      <p data-testid="software-only-notice" className="rounded-lg bg-primary/5 p-3 text-sm">本次只发布选中的软件版本。商品介绍、图片、视频及其草稿保持原样；无需先保存、完善或发布正在编辑的商品资料。</p>
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
      <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
        <input data-testid={software ? "confirm-software-publication" : "confirm-product-publication"} className="mt-1 h-4 w-4 shrink-0 accent-primary" type="checkbox" checked={confirmed} disabled={!canConfirm} onChange={e => setConfirmed(e.target.checked)} />
        <span>{software ? `我确认公开 ${chosen.length ? chosen.map(r => `${r.version}（${r.channel}）`).join("、") : "所选软件版本"}的安装包与更新清单，不发布商品资料。` : "我确认仅公开已保存的商品资料，不发布或切换软件版本。"}</span>
      </label>
      <div className="mt-3"><Button className="h-9" data-testid={software ? "publish-software" : "publish-product"} onClick={onPublish} disabled={!canConfirm || !confirmed}>{disabled ? "正在处理，请稍候…" : software ? `校验并发布 ${chosen.length} 个软件版本` : "仅发布商品资料"}</Button></div>
    </div>
  </section>;
}
