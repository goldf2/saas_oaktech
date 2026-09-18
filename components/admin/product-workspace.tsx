"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { saveWorkspaceAction, publishWorkspaceAction, publishSoftwareAction } from "@/app/admin/products/editor-actions";
import { ReleaseFlowContext, type ReleaseActivity } from "./release-flow-context";
import { PublicationReview, type PublicationMode } from "./publication-review";
import { productPublicationIssues, releaseReadiness, selectReleaseForPublication } from "@/lib/store/release-workflow";
import { ProductDetailsEditor } from "./product-details-editor";
import { DatabaseProductPage } from "@/components/database-product-page";
import { Button } from "@/components/ui/button";
import type { AdminStoreProductRow, AdminProductReleaseRow, Locale, ProductRelease, StoreProduct } from "@/lib/store/types";

const tabs = [["details", "商品资料"], ["versions", "软件版本"], ["preview", "预览发布"]] as const;
type Tab = typeof tabs[number][0];
const imageErrors: Record<string, string> = {
  PRODUCT_IMAGE_TYPE: "请选择PNG、JPEG或WebP图片，不支持SVG或动图。",
  PRODUCT_IMAGE_INVALID: "无法解析图片，请选择有效的静态图片（不少于16px，最多2400万像素）。",
  PRODUCT_IMAGE_TOO_LARGE: "图片不能超过8 MiB。",
  PRODUCT_IMAGE_LIMIT: "该商品已达到历史图片数量限制，请联系维护人员整理未使用素材。",
  PRODUCT_UPLOAD_ORIGIN: "上传请求来源不匹配，请从本站重新打开页面。",
  STORE_ADMIN_FORBIDDEN: "当前账号没有上传权限，请重新登录。",
};
function blankProduct(): AdminStoreProductRow {
  return { id: "", slug: "", category_slug: "desktop-apps", status: "beta", visibility: "draft", name_zh: "", name_en: "", tagline_zh: "", tagline_en: "", description_zh: "", description_en: "", icon_url: "", hero_image_url: "", gallery_urls: [], supported_platforms: [], featured: false };
}
function previewProduct(p: AdminStoreProductRow, locale: Locale): StoreProduct {
  const local = (en: string, zh: string) => locale === "en" ? en || zh : zh;
  return { id: p.id, slug: p.slug, name: local(p.name_en, p.name_zh) || "未命名商品", tagline: local(p.tagline_en, p.tagline_zh), description: local(p.description_en, p.description_zh), status: p.status, visibility: "draft", categorySlug: p.category_slug, iconUrl: p.icon_url, heroImageUrl: p.hero_image_url, galleryUrls: p.gallery_urls ?? [], videos: p.videos ?? [], supportedPlatforms: p.supported_platforms, featured: p.featured };
}
function previewReleases(rows: AdminProductReleaseRow[], locale: Locale): ProductRelease[] {
  return rows.map(row => ({ id: row.id, productSlug: row.product_slug, version: row.version, channel: row.channel, status: row.status, isCurrent: row.is_current, publishedAt: row.published_at ?? undefined, title: locale === "en" ? row.title_en || row.title_zh : row.title_zh, notes: locale === "en" ? row.notes_en || row.notes_zh : row.notes_zh, artifacts: [] }));
}

export function ProductWorkspace({ product = blankProduct(), editToken = "", publishToken = "", releasePublishToken = "", publishedProduct = null, releases = [], releasePanel, initialTab = "details", hasDraft = false }: {
  product?: AdminStoreProductRow; publishedProduct?: AdminStoreProductRow | null; editToken?: string; publishToken?: string; releasePublishToken?: string; releases?: AdminProductReleaseRow[]; releasePanel?: ReactNode; initialTab?: string; hasDraft?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState<AdminStoreProductRow>({ ...product, gallery_urls: product.gallery_urls ?? [], videos: product.videos ?? [] });
  const [saved, setSaved] = useState(() => JSON.stringify({ ...product, gallery_urls: product.gallery_urls ?? [], videos: product.videos ?? [] }));
  const [tokens, setTokens] = useState({ edit: editToken, publish: publishToken });
  // A successful save is already a pending draft before the route refresh returns.
  const [pendingProductDraft, setPendingProductDraft] = useState(hasDraft);
  useEffect(() => { setPendingProductDraft(hasDraft); }, [hasDraft]);
  const [tab, setTab] = useState<Tab>(tabs.some(([id]) => id === initialTab) ? initialTab as Tab : "details");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [publishedReceipt, setPublishedReceipt] = useState<{ slug: string; videos: number } | null>(null);
  const [error, setError] = useState("");
  const [locale, setLocale] = useState<Locale>("zh");
  const [mobile, setMobile] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [publicationMode, setPublicationMode] = useState<PublicationMode>("product");
  const [softwareToken, setSoftwareToken] = useState(releasePublishToken);
  const [activities, setActivities] = useState<Record<string, ReleaseActivity>>({});
  const setActivity = useCallback((id: string, state: ReleaseActivity | null) => setActivities(previous => {
    if (state && previous[id]?.dirty === state.dirty && previous[id]?.busy === state.busy || !state && !previous[id]) return previous;
    const next = { ...previous }; if (state) next[id] = state; else delete next[id]; return next;
  }), []);
  const releaseDirty = Object.values(activities).some(state => state.dirty);
  const releaseBusy = Object.values(activities).some(state => state.busy);
  const dirty = saved !== JSON.stringify(value);
  const unsaved = dirty || releaseDirty;
  const operationInFlight = useRef(false);
  const feedbackRef = useRef<HTMLParagraphElement>(null);
  const dirtyRef = useRef(dirty); dirtyRef.current = dirty;
  const disabled = busy || uploading || releaseBusy;
  const existing = Boolean(value.id);
  const publishedVersionCount = releases.filter(r => r.status === "published").length;
  function activateTab(next: Tab) {
    setTab(next);
    requestAnimationFrame(() => {
      const panel = document.getElementById(`panel-${next}`);
      const toolbar = document.querySelector<HTMLElement>('[data-testid="product-action-bar"]');
      if (panel) window.scrollTo({ top: Math.max(0, panel.getBoundingClientRect().top + window.scrollY - (toolbar?.getBoundingClientRect().height ?? 64) - 72), behavior: "instant" });
    });
  }
  function goPreview(id?: string) {
    if (disabled) return;
    setPublicationMode("software"); setConfirmed(false);
    if (id) setSelected(previous => selectReleaseForPublication(previous, id, true, releases));
    activateTab("preview");
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[data-tab="preview"]')?.focus());
  }
  function goVersions() { if (!disabled) activateTab("versions"); }
  useEffect(() => { if (error) feedbackRef.current?.focus(); }, [error]);
  useEffect(() => { if (initialTab === "media") document.getElementById("product-artwork")?.scrollIntoView({ block: "start" }); }, [initialTab]);

  useEffect(() => {
    if (!dirtyRef.current) {
      const next = { ...product, gallery_urls: product.gallery_urls ?? [], videos: product.videos ?? [] };
      setValue(next); setSaved(JSON.stringify(next)); setTokens({ edit: editToken, publish: publishToken });
    }
  }, [editToken, publishToken, product]);
  useEffect(() => {
    if (!unsaved && !disabled) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved, disabled]);
  useEffect(() => { setSoftwareToken(releasePublishToken); }, [releasePublishToken]);
  useEffect(() => { if (publicationMode === "product") setConfirmed(false); }, [value, publishToken, publicationMode]);
  useEffect(() => { if (publicationMode === "software") setConfirmed(false); }, [selected, releasePublishToken, releaseDirty, releaseBusy, publicationMode]);
  function update<K extends keyof AdminStoreProductRow>(field: K, next: AdminStoreProductRow[K]) { setValue(prev => ({ ...prev, [field]: next })); setMessage(""); setPublishedReceipt(null); }

  function showProductPublication() {
    setPublicationMode("product"); setConfirmed(false); setPreviewOpen(true); activateTab("preview");
  }
  async function prepareProductPublication() {
    if (disabled || operationInFlight.current) return;
    showProductPublication();
    // Prepare only. Saving here never publishes; the reviewed snapshot requires
    // a separate explicit confirmation through the existing product-only action.
    if (dirty || !existing) await save(true);
  }
  async function save(preparePublication = false) {
    if (disabled || operationInFlight.current) return;
    operationInFlight.current = true;
    setBusy(true); setError(""); setMessage(""); setPublishedReceipt(null);
    try {
      const form = new FormData();
      for (const key of ["id", "slug", "category_slug", "status", "name_en", "name_zh", "tagline_en", "tagline_zh", "description_en", "description_zh", "icon_url", "hero_image_url"] as const) form.set(key, value[key]);
      form.set("gallery_urls", JSON.stringify(value.gallery_urls ?? []));
      form.set("videos", JSON.stringify(value.videos ?? []));
      form.set("supported_platforms", value.supported_platforms.join(","));
      form.set("featured", value.featured ? "on" : ""); form.set("edit_token", tokens.edit);
      const result = await saveWorkspaceAction(form);
      if (!result.ok) { setError(result.error ?? "草稿保存失败"); return; }
      dirtyRef.current = false;
      setSaved(JSON.stringify(value));
      setPendingProductDraft(true);
      setTokens({ edit: result.editToken!, publish: result.publishToken! });
      setMessage(result.warning ?? "草稿已保存，线上内容没有改变。");
      if (!existing) router.push(`/admin/products/${result.slug}?tab=${preparePublication ? "preview" : "media"}&saved=1`);
      else router.refresh();
    } catch { setError("保存请求未完成，请检查网络，刷新核对后再重试。"); }
    finally { operationInFlight.current = false; setBusy(false); }
  }
  async function publish() {
    if (disabled || !existing || operationInFlight.current) return;
    const software = publicationMode === "software";
    // Clicking the product publication button is the explicit publishing intent.
    // Software still has its separate package-selection confirmation.
    if (software && !confirmed) return;
    if (!software && (dirty || productPublicationIssues(value).length)) {
      setConfirmed(false); setError("请先保存并完善商品资料；软件版本不受影响。"); return;
    }
    if (software) {
      const chosen = releases.filter(r => r.status === "draft" && selected.includes(r.id));
      if (releaseDirty || !chosen.length || chosen.length !== selected.length || new Set(chosen.map(r => r.channel)).size !== chosen.length || chosen.some(r => !releaseReadiness(r).ready)) {
        setError("所选软件版本尚未准备好，请核对版本资料和文件；无需保存商品资料。"); setConfirmed(false); return;
      }
    }
    operationInFlight.current = true;
    setBusy(true); setError(""); setMessage(""); setPublishedReceipt(null);
    try {
      const form = new FormData(); form.set("slug", value.slug); form.set("confirm", "on");
      if (software) {
        form.set("release_token", softwareToken);
        for (const id of selected) form.append("release_id", id);
      } else form.set("publish_token", tokens.publish);
      const result = await (software ? publishSoftwareAction(form) : publishWorkspaceAction(form));
      if (!result.ok) { setConfirmed(false); setError((result.error ?? "发布未完成") + " 请核对本次发布对象后重新确认。"); return; }
      // A software response must not advance the product edit token or overwrite
      // local copy. Otherwise an unrelated stale edit could be accepted later.
      if (software) { setSoftwareToken(result.releaseToken!); setSelected([]); }
      else { setTokens({ edit: result.editToken!, publish: result.publishToken! }); setPendingProductDraft(false); }
      setConfirmed(false);
      if (!software) setPublishedReceipt({ slug: result.slug!, videos: value.videos?.length ?? 0 });
      setMessage(result.warning ?? (software ? "软件版本已发布。商品资料及其草稿保持不变。" : `商品资料已发布，包含 ${value.videos?.length ?? 0} 段视频。软件版本和下载保持不变。`));
      router.refresh();
    } catch { setConfirmed(false); setError("发布响应未完成，请刷新检查结果，避免重复操作。"); }
    finally { operationInFlight.current = false; setBusy(false); }
  }
  async function upload(file: File | undefined, field: "icon_url" | "hero_image_url" | "gallery_urls" | `video:${string}`) {
    if (!file || disabled || !existing) return;
    if (file.size > 8 * 1024 * 1024) { setError(imageErrors.PRODUCT_IMAGE_TOO_LARGE); return; }
    if (field === "gallery_urls" && (value.gallery_urls?.length ?? 0) >= 8) { setError("最多添加8张截图。"); return; }
    setUploading(true); setPublishedReceipt(null); setError(""); setMessage("图片上传与校验中…");
    try {
      const response = await fetch(`/api/admin/products/${value.slug}/media`, { method: "POST", headers: { "Content-Type": file.type || "application/octet-stream", "x-oaktech-product-upload": "1" }, body: file });
      const result = await response.json();
      if (!response.ok || !result.media?.url) throw new Error(imageErrors[result.error] ?? "图片上传失败，请检查文件或网络。");
      if (field === "gallery_urls") setValue(prev => ({ ...prev, gallery_urls: [...(prev.gallery_urls ?? []), result.media.url] }));
      else if (field.startsWith("video:")) setValue(prev => ({ ...prev, videos: (prev.videos ?? []).map(video => video.id === field.slice(6) ? { ...video, poster_url: result.media.url } : video) }));
      else update(field as "icon_url" | "hero_image_url", result.media.url);
      setMessage("图片已上传，请保存草稿。确认发布前不会公开新图片。");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "图片上传失败。"); }
    finally { setUploading(false); }
  }
  function reorder(index: number, delta: number) {
    const images = [...(value.gallery_urls ?? [])], target = index + delta;
    if (target < 0 || target >= images.length) return;
    [images[index], images[target]] = [images[target], images[index]]; update("gallery_urls", images);
  }
  const displayedReleases = publicationMode === "software"
    ? releases.filter(r => selected.includes(r.id))
    : releases.filter(r => r.status === "published").sort((a, b) => Number(b.is_current) - Number(a.is_current));
  const previewRecord = publicationMode === "product" ? value : publishedProduct;

  return <ReleaseFlowContext.Provider value={{ setActivity, goPreview, goVersions, operationBusy: disabled }}><div className="container max-w-7xl px-3 py-4 sm:px-4" data-testid="product-workspace">
    <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><Link href="/dashboard?view=products" className="text-xs text-primary" onClick={event => { if ((unsaved || disabled) && !window.confirm("有未保存修改或上传正在进行，确定离开吗？")) event.preventDefault(); }}>← 商品管理</Link><h1 className="mt-2 break-words text-2xl font-semibold">{existing ? value.name_zh || value.slug : "新增商品"}</h1>
        <p data-testid="product-state-line" className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground"><span>线上介绍：{publishedProduct || publishedReceipt ? "已公开" : "尚未公开"}</span><span className={dirty || pendingProductDraft ? "font-medium text-amber-700 dark:text-amber-300" : ""}>本次资料：{dirty ? "尚未保存" : pendingProductDraft && !publishedReceipt ? "草稿已保存，待发布" : publishedProduct || publishedReceipt ? "与线上一致" : existing ? "未发布" : "尚未创建"}</span></p>
      </div>
      {tab === "versions" && <p className="self-end text-sm text-muted-foreground">软件：{publishedVersionCount ? `${publishedVersionCount} 个已发布版本` : "尚无已发布版本"}</p>}
    </div>
    <div data-testid="product-action-bar" className="sticky top-14 z-30 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background/95 p-2 shadow-sm backdrop-blur">
      <nav role="tablist" className="flex flex-wrap gap-1" aria-label="商品编辑分区">{tabs.map(([id, title], index) => <Button className={`h-9 rounded-md px-3 ${tab === id ? "bg-primary/10 text-primary" : "text-muted-foreground"}`} key={id} id={`tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} data-tab={id} variant="ghost" disabled={disabled} onClick={() => activateTab(id)} onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
        activateTab(tabs[next][0]); document.querySelector<HTMLButtonElement>(`[data-tab="${tabs[next][0]}"]`)?.focus();
      }}>{title}</Button>)}</nav>
      <div className="flex flex-wrap gap-2"><Button className="h-9" variant="outline" data-testid="save-product-draft" disabled={disabled} onClick={() => void save()}>{busy ? "处理中…" : "保存草稿"}</Button><Button className="h-9" data-preview-product variant="outline" disabled={disabled} onClick={showProductPublication}>预览</Button><Button className="h-9" data-testid="prepare-product-publication" disabled={disabled} onClick={() => void prepareProductPublication()}>发布商品资料</Button></div>
    </div>
    {(dirty || pendingProductDraft && !publishedReceipt) && <div data-testid="product-publish-pending" className="mb-3 rounded-lg border border-amber-300 bg-amber-50/60 px-3 py-2 text-sm dark:border-amber-800 dark:bg-amber-950/20">
      <strong>{dirty ? "本次修改尚未保存" : "草稿已保存，尚未发布"}</strong> · {publishedProduct ? "商品已上架，但访客仍看到上一次发布的资料。" : "商品介绍尚未公开。"}

    </div>}
    {publishedReceipt && !dirty && <div data-testid="product-publication-success" className="mb-3 rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm">
      <strong>商品资料发布成功 · {publishedReceipt.videos} 段视频</strong>
      <span className="ml-3 inline-flex flex-wrap gap-3"><a className="underline" target="_blank" rel="noopener noreferrer" href={`/zh/products/${encodeURIComponent(publishedReceipt.slug)}`}>查看中文商品页 ↗</a><a className="underline" target="_blank" rel="noopener noreferrer" href={`/en/products/${encodeURIComponent(publishedReceipt.slug)}`}>查看英文商品页 ↗</a></span>
    </div>}
    {message && <p role="status" className="mb-3 mt-3 rounded-lg border bg-muted/20 p-3 text-sm">{message}</p>}
    {error && <p ref={feedbackRef} tabIndex={-1} role="alert" className="mb-3 mt-3 rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>}
    <div id="panel-details" role="tabpanel" aria-labelledby="tab-details" hidden={tab !== "details"}>
      <ProductDetailsEditor value={value} disabled={disabled} existing={existing} update={update} onUpload={(file, field) => { void upload(file, field); }} onMoveScreenshot={reorder} onSave={() => { void save(); }} onPreparePublication={() => { void prepareProductPublication(); }} />
    </div>
    <div id="panel-versions" role="tabpanel" aria-labelledby="tab-versions" hidden={tab !== "versions"}>
      {!existing ? <p className="rounded-lg border p-5">请先保存商品草稿，再添加属于该商品的软件版本。</p> : <>{dirty && <p data-testid="independent-version-editing" className="mb-4 rounded-lg border p-4 text-sm">商品资料有未保存修改，但不影响软件版本操作。版本发布不会保存或公开这些修改。</p>}<div className="min-w-0">{releasePanel}</div></>}
    </div>
    <div id="panel-preview" className="scroll-mt-44" role="tabpanel" aria-labelledby="tab-preview" hidden={tab !== "preview"}>
      <PublicationReview mode={publicationMode} onModeChange={mode => { setPublicationMode(mode); setConfirmed(false); }} productIsPublished={Boolean(publishedProduct)} liveProduct={publishedProduct} product={value} onSave={() => void save()} onFixProduct={(target, field) => { if (!disabled) { setTab("details"); requestAnimationFrame(() => {
        let element: HTMLElement | null = null;
        if (field?.startsWith("video:")) {
          const [, index, part, source] = field.split(":");
          const video = document.querySelectorAll<HTMLElement>("[data-edit-video]")[Number(index)];
          element = (part === "title" ? video?.querySelector<HTMLElement>("[data-video-title]") : part === "source" ? video?.querySelectorAll<HTMLElement>("[data-video-url]")[Number(source)] : video) ?? null;
        } else if (field === "videos") element = document.querySelector<HTMLElement>('[data-testid="product-video-editor"]');
        else if (target === "media") element = document.getElementById("product-artwork");
        else if (field) element = document.querySelector<HTMLElement>(`[name="${field}"]`);
        element?.scrollIntoView({ behavior: "smooth", block: "center" }); element?.focus({ preventScroll: true });
      }); } }} releases={releases} selected={selected} setSelected={setSelected} dirty={dirty} releaseDirty={releaseDirty} existing={existing} disabled={disabled} confirmed={confirmed} setConfirmed={setConfirmed} onPublish={() => void publish()} onBack={goVersions} />
      <details data-testid="preview-disclosure" className="mt-3 rounded-lg border" open={previewOpen} onToggle={event => setPreviewOpen(event.currentTarget.open)}>
        <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium">商品页预览<span className="ml-2 text-xs font-normal text-muted-foreground">{previewOpen ? "收起" : "展开查看"} · 不提供草稿下载</span></summary>
        <div className="border-t p-3">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 data-testid="publication-preview-caption" className="text-sm font-medium">{publicationMode === "product" ? "商品资料预览 · 软件版本保持不变" : "软件版本预览 · 使用线上商品资料，不包含商品草稿"}</h2><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setLocale(locale === "zh" ? "en" : "zh")}>{locale === "zh" ? "切换英文" : "切换中文"}</Button><Button size="sm" variant="outline" onClick={() => setMobile(!mobile)}>{mobile ? "桌面宽度" : "手机宽度"}</Button></div></div>
          <div data-testid="product-preview" className={`mx-auto overflow-hidden rounded-lg border ${mobile ? "max-w-[390px]" : "w-full"}`}>{tab === "preview" && previewOpen && (previewRecord ? <DatabaseProductPage product={previewProduct(previewRecord, locale)} releases={previewReleases(displayedReleases, locale)} locale={locale} preview /> : <div className="p-6 text-sm"><h3 className="font-semibold">商品尚未上架，暂不预览商品介绍。</h3><p className="mt-3 text-muted-foreground">上方已列出本次软件版本、说明和文件。软件发布只开放这些下载，不发布商品草稿。</p></div>)}</div>
        </div>
      </details>
    </div>
  </div></ReleaseFlowContext.Provider>;
}
