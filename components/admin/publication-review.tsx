"use client";

import { ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, PackageCheck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, productPublicationIssues, releaseReadiness, selectReleaseForPublication } from "@/lib/store/release-workflow";
import type { AdminProductReleaseRow, AdminStoreProductRow } from "@/lib/store/types";

export function PublicationReview({ product, onFixProduct, releases, selected, setSelected, dirty, releaseDirty, existing, disabled, confirmed, setConfirmed, onPublish, onBack }: {
  product: AdminStoreProductRow; onFixProduct: (tab: "details" | "media") => void;
  releases: AdminProductReleaseRow[]; selected: string[]; setSelected: (ids: string[]) => void;
  dirty: boolean; releaseDirty: boolean; existing: boolean; disabled: boolean;
  confirmed: boolean; setConfirmed: (value: boolean) => void; onPublish: () => void; onBack: () => void;
}) {
  const productIssues = productPublicationIssues(product);
  const drafts = releases.filter(r => r.status === "draft");
  const chosen = drafts.filter(r => selected.includes(r.id));
  const blockers = chosen.flatMap(r => releaseReadiness(r).blockers);
  const stale = chosen.length !== selected.length;
  const conflict = new Set(chosen.map(r => r.channel)).size !== chosen.length;
  const canConfirm = existing && !dirty && !releaseDirty && !disabled && !stale && !conflict && blockers.length === 0 && productIssues.length === 0;
  return <section data-testid="publication-review" className="min-w-0 space-y-5 rounded-xl border bg-background p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">3</span><div><h2 className="text-xl font-semibold">校验预览与发布确认</h2><p className="mt-2 text-sm text-muted-foreground">先确认本次发布范围。文件只会在服务器最终校验通过后公开。</p></div></div><Button type="button" variant="outline" onClick={onBack} disabled={disabled}><ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />返回软件版本</Button></div>
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg bg-muted/35 p-3"><p className="flex items-center gap-2 text-sm font-medium"><Globe className="h-4 w-4 text-primary" aria-hidden="true" />商品资料</p><p className="mt-2 text-xs text-muted-foreground">{!existing ? "尚未创建商品" : dirty ? "有未保存的图文修改" : productIssues.length ? `还需补齐 ${productIssues.length} 项资料` : "使用已保存的商品介绍"}</p></div>
      <div className="rounded-lg bg-muted/35 p-3"><p className="flex items-center gap-2 text-sm font-medium"><PackageCheck className="h-4 w-4 text-primary" aria-hidden="true" />软件版本</p><p className="mt-2 text-xs text-muted-foreground">{chosen.length ? `已选 ${chosen.length} 个版本 / ${chosen.reduce((n, r) => n + r.release_artifacts.length, 0)} 个文件` : "未选择软件版本，不会新增下载"}</p></div>
      <div className="rounded-lg bg-muted/35 p-3"><p className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />最终校验</p><p className="mt-2 text-xs text-muted-foreground">{chosen.some(r => r.product_slug === "open-play") ? "发布时校验文件、摘要和原生更新签名" : "发布时校验文件、摘要和对应更新协议"}</p></div>
    </div>
    {productIssues.length > 0 && <div data-testid="product-publication-issues" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/20"><h3 className="font-semibold">发布前还需完善商品资料</h3><div className="mt-2 flex flex-wrap gap-2">{productIssues.map(issue => <Button key={issue.field} variant="outline" type="button" size="sm" onClick={() => onFixProduct(issue.tab)} disabled={disabled}>{issue.label} →</Button>)}</div><p className="mt-2 text-xs text-muted-foreground">完善后先保存商品资料；软件版本和上传队列会保留。</p></div>}
    <div><h3 className="text-sm font-semibold">选择本次发布的软件版本</h3><p className="mt-1 text-xs text-muted-foreground">每个渠道最多选择一个版本。未选中的草稿保持私有，同渠道历史版本不会被覆盖。</p></div>
    {drafts.length ? <div className="space-y-3">{drafts.map(release => {
      const readiness = releaseReadiness(release), checked = selected.includes(release.id);
      return <div key={release.id} className={`min-w-0 rounded-xl border p-4 ${checked ? "border-primary bg-primary/5" : ""}`}>
        <label className="flex items-start gap-3 text-sm"><input className="mt-1 h-4 w-4 shrink-0 accent-primary" type="checkbox" data-release-select={release.id} checked={checked} disabled={disabled || releaseDirty || !readiness.ready} onChange={e => setSelected(selectReleaseForPublication(selected, release.id, e.target.checked, releases))} /><span className="min-w-0 flex-1"><strong className="text-base">{release.version}</strong><span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{release.channel}</span><span className={`ml-2 text-xs ${readiness.ready ? "text-primary" : "text-amber-700 dark:text-amber-300"}`}>{readiness.ready ? "文件资料齐备 · 待服务端最终校验" : "暂不可发布 · 需要补齐文件或资料"}</span><span className="mt-2 block text-xs text-muted-foreground">{readiness.installers} 个安装包 · {readiness.fileCount} 个文件 · {formatBytes(readiness.totalBytes)}</span><span className="mt-2 block whitespace-pre-wrap break-words text-sm text-muted-foreground">{release.notes_zh || release.notes_en || "尚未填写更新说明"}</span></span></label>
        {readiness.blockers.length > 0 && <div className="mt-3 space-y-1 border-t pt-3">{readiness.blockers.map((text, i) => <p key={i} className="flex items-start gap-2 break-all text-xs text-amber-800 dark:text-amber-200"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{text}</p>)}</div>}
        {readiness.ready && <details className="ml-7 mt-3"><summary className="cursor-pointer text-xs text-muted-foreground">核对 {readiness.fileCount} 个待公开文件</summary><div className="mt-2 space-y-1.5">{release.release_artifacts.map(a => <p key={a.id} className="break-all text-xs text-muted-foreground">{a.file_name} · {a.platform}/{a.architecture} · {formatBytes(a.size_bytes)}</p>)}</div></details>}
      </div>;
    })}</div> : <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">没有待发布的软件版本。可以仅更新商品介绍，或返回软件版本添加安装包。</div>}
    {selected.length === 0 && <p data-testid="metadata-only-notice" className="rounded-lg bg-amber-50 p-3 text-sm leading-relaxed text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">本次仅发布商品介绍。已有公开软件版本保持不变；没有已发布安装包时，商品页不会出现软件下载按钮。</p>}
    {(dirty || releaseDirty || stale || conflict || !existing) && <p role="alert" className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">{!existing ? "请先保存商品资料。" : dirty ? "图文存在未保存修改，请先保存商品资料。" : releaseDirty ? "版本资料或上传队列尚未完成，请返回软件版本保存并处理文件。" : "所选版本状态发生变化，请刷新后重新选择。"}</p>}
    <div className="border-t pt-5"><div className="mb-3 flex items-center gap-2 text-sm font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">4</span>确认正式发布</div>
      <label className="flex items-start gap-3 rounded-lg border p-3 text-sm"><input data-testid="confirm-product-publication" className="mt-1 h-4 w-4 shrink-0 accent-primary" type="checkbox" checked={confirmed} disabled={!canConfirm} onChange={e => setConfirmed(e.target.checked)} /><span>我确认公开已保存的商品资料{chosen.length ? `，以及 ${chosen.map(r => `${r.version}（${r.channel}）`).join("、")}` : "，本次不新增软件版本"}。<span className="mt-1 block text-xs text-muted-foreground">发布过程会校验实际文件。遇到错误将显示原因；请先核对结果，不要重复点击或上传。</span></span></label>
      <div className="mt-4 flex flex-wrap items-center gap-3"><Button data-testid="publish-product" onClick={onPublish} disabled={!canConfirm || !confirmed}>{disabled ? "正在处理，请稍候…" : chosen.length ? `校验并发布 ${chosen.length} 个版本` : "仅发布商品资料"}</Button><span className="flex items-center gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />保留签名校验与原有发布权限</span></div>
    </div>
  </section>;
}
