"use client";

import { useRouter } from "next/navigation";
import { useActionState, useContext, useEffect, useRef, useState } from "react";
import { Check, Info, LockKeyhole, Plus, UploadCloud, ArrowRight } from "lucide-react";
import { saveReleaseDraftInWorkspaceAction, unpublishReleaseAction, deleteReleaseAction } from "@/app/admin/actions";
import { AdminActionForm } from "./action-form";
import { ArtifactUpload } from "./artifact-upload";
import { ReleaseFileList } from "./release-file-list";
import { ReleaseFlowContext, useReleaseActivity } from "./release-flow-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatBytes, releaseReadiness, requiredReleaseFiles } from "@/lib/store/release-workflow";
import type { AdminActionResult, AdminProductReleaseRow, AdminStoreProductRow } from "@/lib/store/types";
import { useLocale } from "@/i18n/locale-provider";

function ReleaseEditor({ product, release }: { product: AdminStoreProductRow; release?: AdminProductReleaseRow }) {
  const router = useRouter();
  const { locale } = useLocale();
  const zh = locale === "zh";
  const published = release?.status === "published", { goPreview, operationBusy } = useContext(ReleaseFlowContext);
  const initial = { version: release?.version ?? "", channel: release?.channel ?? "stable", title_zh: release?.title_zh ?? "", notes_zh: release?.notes_zh ?? "", title_en: release?.title_en ?? "", notes_en: release?.notes_en ?? "" };
  const [value, setValue] = useState(initial);
  const [sameEnglish, setSameEnglish] = useState(!release || release.title_en === release.title_zh && release.notes_en === release.notes_zh);
  const sent = { ...value, title_en: sameEnglish ? value.title_zh : value.title_en, notes_en: sameEnglish ? value.notes_zh : value.notes_en };
  const normalized = (input: typeof initial) => JSON.stringify(Object.fromEntries(Object.entries(input).map(([key, text]) => [key, text.trim()])));
  const dirty = !published && normalized(sent) !== normalized(initial);
  const submitting = useRef(false);
  const [state, action, pending] = useActionState<AdminActionResult, FormData>(async (_previous, form) => {
    try {
      const result = await saveReleaseDraftInWorkspaceAction(form);
      if (!result.error && result.releaseId && result.productSlug === product.slug) {
        if (release?.id === result.releaseId) router.refresh();
        else router.replace(`/admin/products/${encodeURIComponent(product.slug)}?tab=versions&release=${encodeURIComponent(result.releaseId)}&saved=1`, { scroll: false });
      }
      return result;
    } finally { submitting.current = false; }
  }, {});
  useReleaseActivity(`release-form-${release?.id ?? "new"}`, dirty, pending);
  const readiness = release ? releaseReadiness(release) : null;
  const expected = requiredReleaseFiles(product.slug, value.version || (zh ? "<版本号>" : "<version>"));
  function field(name: keyof typeof value, next: string) { setValue(previous => ({ ...previous, [name]: next })); }
  return <div className="mt-2 space-y-3">
    <div className={`grid min-w-0 items-start gap-3 ${!published ? "lg:grid-cols-2" : ""}`}>
      <section className="min-w-0 rounded-lg border bg-background p-3 sm:p-4">
        <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">1</span><div><h3 className="font-semibold">{zh ? "版本资料" : "Release details"}</h3></div></div>
        <form action={action} data-testid="release-details-form" aria-busy={pending} onReset={event => event.preventDefault()} onSubmit={event => { if (published || submitting.current) { event.preventDefault(); return; } submitting.current = true; }} className="mt-3">
          <input type="hidden" name="id" value={release?.id ?? ""} /><input type="hidden" name="product_slug" value={product.slug} />
          <fieldset disabled={pending || operationBusy} className="grid min-w-0 gap-2.5 sm:grid-cols-2">
            <label className="min-w-0 text-sm font-medium">{zh ? "版本号" : "Version"} <span className="text-destructive">*</span><Input className="mt-1 h-9" name="version" value={value.version} readOnly={Boolean(release)} onChange={e => field("version", e.target.value)} placeholder={product.slug === "open-play" ? (zh ? "例如 0.6.6.13" : "e.g. 0.6.6.13") : (zh ? "例如 1.0.0" : "e.g. 1.0.0")} required />{release && <span className="mt-1 block text-xs font-normal text-muted-foreground">{zh ? "版本号保存后固定；新构建请新增版本。" : "The version is fixed after saving; create a new version for a new build."}</span>}</label>
            <label className="min-w-0 text-sm font-medium">{zh ? "发布渠道" : "Release channel"} <span className="text-destructive">*</span><Input className="mt-1 h-9" name="channel" value={value.channel} readOnly={Boolean(release)} onChange={e => field("channel", e.target.value)} list={`channels-${release?.id ?? "new"}`} required /><datalist id={`channels-${release?.id ?? "new"}`}><option value="stable" /><option value="beta" /></datalist><span className="mt-1 block text-xs font-normal text-muted-foreground">{zh ? "stable 稳定版 / beta 测试版" : "stable / beta"}</span></label>
            <label className="min-w-0 text-sm font-medium sm:col-span-2">{zh ? "版本标题（中文）" : "Release title (Chinese)"} <span className="text-destructive">*</span><Input className="mt-1 h-9" name="title_zh" value={value.title_zh} readOnly={published} onChange={e => field("title_zh", e.target.value)} placeholder={zh ? "概括本次更新，例如：启动检查与更新提醒" : "Chinese release title"} required /></label>
            <label className="min-w-0 text-sm font-medium sm:col-span-2">{zh ? "更新说明（中文）" : "Release notes (Chinese)"} <span className="text-destructive">*</span><Textarea className="mt-1 min-h-[76px] resize-y py-2" name="notes_zh" rows={3} value={value.notes_zh} readOnly={published} onChange={e => field("notes_zh", e.target.value)} placeholder={zh ? "说明新增功能、修复内容和升级注意事项。" : "Describe changes in Chinese."} required /></label>
            <div className="rounded-md bg-muted/30 px-3 py-2 sm:col-span-2"><label className="flex items-start gap-2 text-sm"><input className="mt-1 accent-primary" data-testid="release-reuse-chinese" type="checkbox" checked={sameEnglish} disabled={published} onChange={e => setSameEnglish(e.target.checked)} /><span>{zh ? "英文页面暂时使用同一份中文说明" : "Use the Chinese title and notes as the English fallback"}</span></label></div>
            {sameEnglish ? <><input type="hidden" name="title_en" value={value.title_zh} /><input type="hidden" name="notes_en" value={value.notes_zh} /></> : <><label className="text-sm font-medium sm:col-span-2">English title <span className="text-destructive">*</span><Input className="mt-1 h-9" name="title_en" value={value.title_en} readOnly={published} onChange={e => field("title_en", e.target.value)} required /></label><label className="text-sm font-medium sm:col-span-2">English release notes <span className="text-destructive">*</span><Textarea className="mt-1 min-h-[76px] resize-y py-2" name="notes_en" value={value.notes_en} readOnly={published} onChange={e => field("notes_en", e.target.value)} required /></label></>}
            {!published && <div className="flex flex-wrap items-center gap-3 sm:col-span-2"><Button type="submit" className="h-9" disabled={pending}>{pending ? (zh ? "保存中…" : "Saving…") : release ? (zh ? "保存版本资料" : "Save release details") : (zh ? "保存版本并继续上传" : "Save release and continue to upload")}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button><span className="text-xs text-muted-foreground">{dirty ? (zh ? "有未保存的版本资料" : "Unsaved release details") : release ? (zh ? "版本资料已保存" : "Release details saved") : (zh ? "第 1 步 / 共 4 步" : "Step 1 of 4")}</span></div>}
          </fieldset>
          {state.error && <p role="alert" className="mt-3 rounded-lg bg-destructive/5 p-3 text-sm text-destructive">{zh ? state.error : "The release details could not be saved."} {zh ? "输入内容已保留，请修正后重试。" : "Your input was preserved; correct the issue and try again."}</p>}
        </form>
      </section>
      {!published && (release ? <ArtifactUpload releaseId={release.id} productSlug={product.slug} version={release.version} artifacts={release.release_artifacts} disabled={dirty || pending || operationBusy} disabledReason={dirty ? (zh ? "版本资料有未保存修改，请先保存，再上传文件。" : "Release details have unsaved changes. Save them before uploading files.") : (zh ? "正在保存或上传其他文件，请等待当前操作完成。" : "Another save or upload is in progress. Wait for it to finish.")} /> : <section data-testid="upload-awaiting-release" className="min-w-0 rounded-lg border bg-muted/20 p-3 sm:p-4">
        <div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold">2</span><h3 className="font-semibold">{zh ? "上传安装包与更新清单" : "Upload packages and update manifests"}</h3></div>
        <div className="mt-3 flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed px-4 py-3 text-center"><UploadCloud className="h-6 w-6 text-muted-foreground" aria-hidden="true" /><p className="mt-1.5 text-sm font-medium">{zh ? "先保存版本，随后在这里上传" : "Save the release first, then upload here"}</p><p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{zh ? "保存版本后，可在此多选或拖入文件；不会直接公开。" : "After saving the release, select or drag multiple files here. Uploading does not publish them."}</p><Button type="button" className="mt-2 h-9" disabled><LockKeyhole className="mr-2 h-4 w-4" aria-hidden="true" />{zh ? "保存版本后解锁上传" : "Save release to unlock uploads"}</Button></div>
        {expected.length > 0 && <div className="mt-3 rounded-md bg-background p-2.5"><p className="text-sm font-medium">{zh ? "本商品需要 4 份文件" : "This product requires 4 files"}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{zh ? "macOS 安装包、Windows 安装包，以及两份官网专用签名清单 appcast.xml / windows.json。请保持签名字节不变。" : "A macOS package, a Windows package, and the two signed update manifests appcast.xml / windows.json. Keep signed bytes unchanged."}</p></div>}
      </section>)}
    </div>
    {release && <>
      <section data-testid="version-files" className="min-w-0 rounded-lg border bg-background p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">{zh ? "版本文件" : "Release files"} <span className="ml-1 text-sm font-normal text-muted-foreground">{release.release_artifacts.length} {zh ? "个" : "files"} · {formatBytes(readiness!.totalBytes)}</span></h3><p className="mt-1 text-xs text-muted-foreground">{published ? (zh ? "这个版本已发布，下方文件可以公开下载。" : "This version is published; the files below are publicly downloadable.") : (zh ? "仅管理员可见。服务器收到文件，不代表已经通过最终签名校验或公开发布。" : "Administrator-only. A received file is not yet signature-approved or publicly published.")}</p></div><span className={`rounded-full px-3 py-1 text-xs ${published ? "bg-primary/10 text-primary" : "bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200"}`}>{published ? (zh ? "已发布" : "Published") : readiness?.ready ? (zh ? "文件资料齐备 · 待最终校验" : "Files ready · final verification pending") : (zh ? "尚未准备齐全" : "Not ready")}</span></div>
        <ReleaseFileList release={release} />
        {!published && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3"><p className="text-sm text-muted-foreground">{dirty ? (zh ? "版本资料尚未保存，先完成保存。" : "Release details are unsaved. Save them first.") : readiness?.ready ? (zh ? "下一步核对版本和文件；服务端会在发布时最终验签。" : "Next, review the release and files; the server performs final signature checks at publication.") : (zh ? "补齐需要的文件后，再进入校验预览。" : "Add the required files before opening the publication preview.")}</p><Button type="button" className="h-9" data-preview-release={release.id} disabled={!readiness?.ready || dirty || pending || operationBusy} onClick={() => goPreview(release.id)}>{zh ? "预览并发布软件" : "Preview & publish software"}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button></div>}
      </section>
      <details className="rounded-lg border px-3 py-2.5"><summary className="cursor-pointer text-sm text-muted-foreground">{zh ? "高级操作" : "Advanced actions"}：{published ? (zh ? "撤回版本" : "Unpublish version") : (zh ? "删除草稿" : "Delete draft")}{release.source_commit ? (zh ? " / 来源提交" : " / source commit") : ""}</summary>
        {release.source_commit && <p className="mt-3 break-all text-xs">{zh ? "来源提交" : "Source commit"}：<code>{release.source_commit}</code></p>}
        {published ? <AdminActionForm action={unpublishReleaseAction} className="mt-3 space-y-2"><input type="hidden" name="release_id" value={release.id} /><label className="flex items-start gap-2 text-sm"><input type="checkbox" required disabled={operationBusy} className="mt-1" />{zh ? "我理解撤回后将停止此版本的新下载请求，不会自动回退到历史版本。" : "I understand that unpublishing stops new downloads for this version and does not automatically roll back to an older version."}</label><Button disabled={operationBusy} variant="outline" type="submit">{zh ? "撤回版本为草稿" : "Unpublish to draft"}</Button></AdminActionForm> : <AdminActionForm action={deleteReleaseAction} className="mt-4 flex flex-wrap gap-3"><input type="hidden" name="release_id" value={release.id} /><Input name="confirm_version" aria-label={zh ? "输入版本号确认删除" : "Enter version to confirm deletion"} placeholder={zh ? `输入 ${release.version} 确认删除` : `Enter ${release.version} to confirm`} className="max-w-xs" required /><Button disabled={operationBusy} variant="destructive" type="submit">{zh ? "删除版本草稿" : "Delete release draft"}</Button></AdminActionForm>}
      </details>
    </>}
  </div>;
}

export function ProductReleases({ product, releases, selectedRelease, notice }: { product: AdminStoreProductRow; releases: AdminProductReleaseRow[]; selectedRelease?: string; notice?: string }) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const selected = useRef<HTMLDetailsElement>(null);
  useEffect(() => { if (selectedRelease) selected.current?.scrollIntoView({ behavior: "auto", block: "start" }); }, [selectedRelease]);
  const current = releases.find(r => r.id === selectedRelease);
  const step = !current ? 1 : current.status === "published" ? 4 : releaseReadiness(current).ready ? 3 : 2;
  return <section data-testid="product-releases" className="min-w-0 space-y-3">
    <h2 className="sr-only">{zh ? "软件版本与安装包" : "Software versions and packages"}</h2>
    <ol aria-label={zh ? "软件发布流程" : "Software publication flow"} className="grid grid-cols-2 gap-1 rounded-lg border bg-muted/20 p-1.5 sm:grid-cols-4">{(zh ? ["填写版本资料", "上传安装包与清单", "校验预览", "确认正式发布"] : ["Release details", "Upload packages & manifests", "Verification preview", "Confirm publication"]).map((title, index) => <li key={title} aria-current={index + 1 === step ? "step" : undefined} className="flex items-center gap-2 px-1 py-1 text-xs sm:text-sm"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index + 1 === step ? "bg-primary text-primary-foreground" : index + 1 < step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{index + 1 < step ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : index + 1}</span>{title}</li>)}</ol>
    {notice && <p role="status" className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm"><Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />{notice} {zh ? "上传区在当前版本下方，文件上传后仍需确认发布。" : "The upload area is below the current version; uploaded files still require publication confirmation."}</p>}
    <details key={`new-${releases.length}`} data-testid="new-product-release" open={!releases.length} className="rounded-lg border bg-muted/10 p-3"><summary className="cursor-pointer list-none font-semibold"><span className="inline-flex items-center gap-2"><Plus className="h-5 w-5 text-primary" aria-hidden="true" />{zh ? "添加软件版本" : "Add software version"}</span><span className="ml-3 text-xs font-normal text-muted-foreground">{zh ? "保存为草稿，上传后再确认发布" : "Save as draft, upload files, then confirm publication"}</span></summary><ReleaseEditor product={product} /></details>
    {releases.map(release => <details key={release.id} ref={selectedRelease === release.id ? selected : undefined} data-release-id={release.id} id={`release-${release.id}`} open={selectedRelease === release.id} className="scroll-mt-24 rounded-lg border p-3">
      <summary className="cursor-pointer break-words text-base font-semibold">{release.version} <span className="ml-2 text-sm font-normal text-muted-foreground">{release.channel}</span><span className={`ml-3 inline-block rounded-full px-2.5 py-0.5 text-xs ${release.status === "published" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{release.status === "published" ? (zh ? "已发布" : "Published") : (zh ? "草稿" : "Draft")}{release.is_current ? (zh ? " · 当前版本" : " · current version") : ""}</span></summary>
      <ReleaseEditor product={product} release={release} />
    </details>)}
  </section>;
}
