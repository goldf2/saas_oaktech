"use client";

import { ArrowLeft, AlertCircle, Globe, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductPublicationSummary } from "./product-publication-summary";
import { formatBytes, productPublicationIssues, releaseReadiness, selectReleaseForPublication } from "@/lib/store/release-workflow";
import type { AdminProductReleaseRow, AdminStoreProductRow } from "@/lib/store/types";
import { useLocale } from "@/i18n/locale-provider";

export type PublicationMode = "product" | "software";
function englishBlocker(text: string) {
  if (text.includes("版本标题或更新说明")) return "Save complete release titles and release notes.";
  if (text.includes("stable 渠道和四段版本号")) return "Open Play signed releases require the stable channel and a four-part version number.";
  if (text.startsWith("缺少 ")) return text.replace(/^缺少 /, "Missing ").replace("安装包", " package").replace("官网更新清单", " update manifest");
  if (text.includes("至少上传一个可下载")) return "Upload at least one downloadable software package; a manifest alone is not enough.";
  if (text.includes("缺少有效的大小或服务端校验")) return text.split(" 缺少")[0] + " is missing valid size or server verification metadata.";
  if (text.includes("文件名或平台")) return "A filename or platform / architecture / package-type slot is duplicated.";
  return "Release files are not ready for publication.";
}
export function PublicationReview({ product, liveProduct = null, onSave, productIsPublished, onFixProduct, releases, selected, setSelected, dirty, releaseDirty, existing, disabled, confirmed, setConfirmed, onPublish, onBack, mode, onModeChange }: {
  product: AdminStoreProductRow; productIsPublished: boolean;
  liveProduct?: AdminStoreProductRow | null; onSave?: () => void;
  onFixProduct: (tab: "details" | "media", field?: string) => void;
  releases: AdminProductReleaseRow[]; selected: string[]; setSelected: (ids: string[]) => void;
  dirty: boolean; releaseDirty: boolean; existing: boolean; disabled: boolean;
  confirmed: boolean; setConfirmed: (value: boolean) => void; onPublish: () => void; onBack: () => void;
  mode: PublicationMode; onModeChange: (mode: PublicationMode) => void;
}) {
  const { locale } = useLocale();
  const zh = locale === "zh";
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
      <h2 className="text-lg font-semibold">{software ? (zh ? "发布软件版本" : "Publish software version") : (zh ? "发布商品资料" : "Publish product information")}</h2>
      <div className="flex flex-wrap gap-1 rounded-lg bg-muted/50 p-1" role="group" aria-label={zh ? "选择发布对象" : "Choose publication target"}>
        <Button type="button" size="sm" variant="ghost" data-publication-mode="product" aria-pressed={!software} disabled={disabled} onClick={() => onModeChange("product")} className="h-9 aria-pressed:bg-background aria-pressed:text-primary aria-pressed:shadow-sm"><Globe className="mr-1.5 h-4 w-4" />{zh ? "商品资料" : "Product info"}</Button>
        <Button type="button" size="sm" variant="ghost" data-publication-mode="software" aria-pressed={software} disabled={disabled} onClick={() => onModeChange("software")} className="h-9 aria-pressed:bg-background aria-pressed:text-primary aria-pressed:shadow-sm"><PackageCheck className="mr-1.5 h-4 w-4" />{zh ? "软件版本" : "Software version"}</Button>
      </div>
    </div>
    {!software ? <>
      <p data-testid="metadata-only-notice" className="rounded-lg bg-primary/5 p-3 text-sm">{zh ? "更新商品名称、介绍、图片和视频。无需安装包；软件版本保持不变。" : "Update product names, descriptions, images, and videos. No software package is required; software versions stay unchanged."}</p>
      <ProductPublicationSummary product={product} live={liveProduct} dirty={dirty} />
      {productIssues.length > 0 && <div data-testid="product-publication-issues" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/20">
        <h3 className="font-semibold">{zh ? "需要处理的项目" : "Items to fix"}</h3><div className="mt-2 flex flex-wrap gap-2">{productIssues.map(issue => <Button key={issue.field} className="h-auto min-h-9 whitespace-normal text-left" variant="outline" type="button" size="sm" onClick={() => onFixProduct(issue.tab, issue.field)} disabled={disabled}>{zh ? issue.label : (issue.field.startsWith("video:") ? "Check video source" : issue.field === "icon_url" ? "Add a valid product icon" : issue.field === "hero_image_url" ? "Add a valid product cover" : issue.field === "name_zh" ? "Add the Chinese product name" : issue.field === "tagline_zh" ? "Add the Chinese tagline" : issue.field === "description_zh" ? "Add the Chinese description" : "Complete required product data")} →</Button>)}</div>
      </div>}
      {dirty && <div role="alert" className="rounded-lg bg-muted/40 p-3 text-sm">{zh ? "有未保存修改，请先保存，再确认发布。" : "There are unsaved changes. Save them before confirming publication."}
        {onSave && <Button type="button" variant="outline" className="ml-3" data-testid="save-for-product-publication" disabled={disabled} onClick={onSave}>{zh ? "保存草稿并继续" : "Save draft and continue"}</Button>}
      </div>}
      {!existing && <p className="text-sm text-muted-foreground">{zh ? "请先保存并创建商品记录。" : "Save the product first to create its record."}</p>}
    </> : <>
      <p data-testid="software-only-notice" className="rounded-lg bg-primary/5 p-3 text-sm">{zh ? "仅开放选中的软件版本和下载；商品介绍及其草稿保持不变。" : "Only selected software versions and downloads are published; product information and its draft remain unchanged."}</p>
      {!productIsPublished && <p data-testid="unlisted-product-release-warning" className="rounded-lg border border-amber-300 p-3 text-sm">{zh ? "商品尚未上架。软件发布后安装包可通过其正式下载地址获取，但不会自动公开商品介绍页。需要展示商品时，请另行发布商品资料。" : "The product page is not published. Publishing software makes its formal download URL available but does not publish the product introduction. Publish product information separately when you want the listing visible."}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">{zh ? "选择本次发布的软件版本" : "Choose software versions to publish"}</h3><Button type="button" variant="outline" onClick={onBack} disabled={disabled}><ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />{zh ? "返回软件版本" : "Back to software versions"}</Button></div>
      <p className="text-xs text-muted-foreground">{zh ? "同一渠道一次只切换一个当前版本；所有选中安装包仍需服务端大小、摘要及适用的签名校验。未选版本保持原状。" : "Only one current version per channel can be switched at a time. Selected packages still require server-side size, checksum, and applicable signature checks. Unselected versions remain unchanged."}</p>
      {drafts.length ? <div className="space-y-2">{drafts.map(release => {
        const readiness = releaseReadiness(release), checked = selected.includes(release.id);
        return <div key={release.id} className={`min-w-0 rounded-lg border p-3 ${checked ? "border-primary bg-primary/5" : ""}`}>
          <label className="flex items-start gap-3 text-sm"><input className="mt-1 h-4 w-4 shrink-0 accent-primary" type="checkbox" data-release-select={release.id} checked={checked} disabled={disabled || releaseDirty || !readiness.ready} onChange={e => setSelected(selectReleaseForPublication(selected, release.id, e.target.checked, releases))} />
            <span className="min-w-0 flex-1"><strong className="text-base">{release.version}</strong><span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">{release.channel}</span>
              <span className={`ml-2 text-xs ${readiness.ready ? "text-primary" : "text-amber-700 dark:text-amber-300"}`}>{readiness.ready ? (zh ? "文件资料齐备 · 待最终校验" : "Files ready · final verification pending") : (zh ? "尚需补齐文件或版本资料" : "Files or release metadata still missing")}</span>
              <span className="mt-2 block text-xs text-muted-foreground">{zh ? `${readiness.installers} 个安装包 · ${readiness.fileCount} 个文件` : `${readiness.installers} installers · ${readiness.fileCount} files`} · {formatBytes(readiness.totalBytes)}</span>
              <span className="mt-1 block whitespace-pre-wrap break-words text-muted-foreground">{(locale === "zh" ? release.notes_zh || release.notes_en : release.notes_en || release.notes_zh) || (zh ? "尚未填写更新说明" : "No release notes yet")}</span>
            </span>
          </label>
          {readiness.blockers.length > 0 && <div className="mt-3 space-y-1 border-t pt-3">{readiness.blockers.map((text, i) => <p key={i} className="flex items-start gap-2 break-all text-xs text-amber-800 dark:text-amber-200"><AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />{zh ? text : englishBlocker(text)}</p>)}</div>}
          {readiness.ready && <details className="ml-7 mt-3"><summary className="cursor-pointer text-xs text-muted-foreground">{zh ? `核对 ${readiness.fileCount} 个待公开文件` : `Review ${readiness.fileCount} files to publish`}</summary><div className="mt-2 space-y-1.5">{release.release_artifacts.map(a => <p key={a.id} className="break-all text-xs text-muted-foreground">{a.file_name} · {a.platform}/{a.architecture} · {formatBytes(a.size_bytes)}</p>)}</div></details>}
        </div>;
      })}</div> : <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">{zh ? "没有待发布软件版本。可以返回软件版本创建版本并上传文件；商品资料发布不受影响。" : "There are no software versions waiting for publication. Return to Software versions to create a release and upload files; product-information publishing is unaffected."}</p>}
      {releaseDirty && <p role="alert" className="rounded-lg bg-destructive/5 p-3 text-sm text-destructive">{zh ? "软件版本有未保存输入或待处理上传队列，请先处理软件版本；不需要保存商品资料。" : "The software release has unsaved input or a pending upload queue. Finish that software work first; product information does not need to be saved."}</p>}
      {(stale || conflict) && <p role="alert" className="text-sm text-destructive">{zh ? "所选版本已变化或渠道冲突，请刷新并核对软件版本。" : "The selected releases changed or conflict by channel. Refresh and review the software versions."}</p>}
    </>}
    <div className="border-t pt-3">
      {software && <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
        <input data-testid="confirm-software-publication" className="mt-1 h-4 w-4 shrink-0 accent-primary" type="checkbox" checked={confirmed} disabled={!canConfirm} onChange={e => setConfirmed(e.target.checked)} />
        <span>{zh ? `我确认公开 ${chosen.length ? chosen.map(r => `${r.version}（${r.channel}）`).join("、") : "所选软件版本"}的安装包与更新清单，不发布商品资料。` : `I confirm publication of packages and update manifests for ${chosen.length ? chosen.map(r => `${r.version} (${r.channel})`).join(", ") : "the selected software versions"}, without publishing product information.`}</span>
      </label>}
      <div className={software ? "mt-3" : ""}><Button type="button" className="h-9" data-testid={software ? "publish-software" : "publish-product"} onClick={onPublish} disabled={!canConfirm || (software && !confirmed)}>{disabled ? (zh ? "正在处理，请稍候…" : "Processing…") : software ? (zh ? `校验并发布 ${chosen.length} 个软件版本` : `Verify and publish ${chosen.length} software versions`) : (zh ? "发布商品资料" : "Publish product info")}</Button></div>
    </div>
  </section>;
}
