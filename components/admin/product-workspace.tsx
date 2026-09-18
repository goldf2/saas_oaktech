"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { saveWorkspaceAction, publishWorkspaceAction, publishSoftwareAction } from "@/app/admin/products/editor-actions";
import { ReleaseFlowContext, type ReleaseActivity } from "./release-flow-context";
import { PublicationReview, type PublicationMode } from "./publication-review";
import { productPublicationIssues, releaseReadiness, selectReleaseForPublication } from "@/lib/store/release-workflow";
import { ProductVideoEditor } from "./product-video-editor";
import { DatabaseProductPage } from "@/components/database-product-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminStoreProductRow, AdminProductReleaseRow, Locale, ProductRelease, StoreProduct } from "@/lib/store/types";

const categories = [["desktop-apps", "桌面应用"], ["browser-extensions", "浏览器扩展"], ["trading-tools", "交易研究工具"], ["developer-tools", "开发工具"], ["ai-tools", "AI工具"], ["productivity-tools", "效率工具"]];
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
  const [tab, setTab] = useState<Tab>(tabs.some(([id]) => id === initialTab) ? initialTab as Tab : "details");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [locale, setLocale] = useState<Locale>("zh");
  const [mobile, setMobile] = useState(false);
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
  function goPreview(id?: string) {
    if (disabled) return;
    setPublicationMode("software"); setConfirmed(false);
    if (id) setSelected(previous => selectReleaseForPublication(previous, id, true, releases));
    setTab("preview");
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[data-tab="preview"]')?.focus());
  }
  function goVersions() { if (!disabled) setTab("versions"); }
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
  function update<K extends keyof AdminStoreProductRow>(field: K, next: AdminStoreProductRow[K]) { setValue(prev => ({ ...prev, [field]: next })); setMessage(""); }

  async function save() {
    if (disabled || operationInFlight.current) return;
    operationInFlight.current = true;
    setBusy(true); setError(""); setMessage("");
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
      setTokens({ edit: result.editToken!, publish: result.publishToken! });
      setMessage(result.warning ?? "草稿已保存，线上内容没有改变。");
      if (!existing) router.push(`/admin/products/${result.slug}?tab=media&saved=1`);
      else router.refresh();
    } catch { setError("保存请求未完成，请检查网络，刷新核对后再重试。"); }
    finally { operationInFlight.current = false; setBusy(false); }
  }
  async function publish() {
    if (disabled || !existing || !confirmed || operationInFlight.current) return;
    const software = publicationMode === "software";
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
    setBusy(true); setError(""); setMessage("");
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
      else setTokens({ edit: result.editToken!, publish: result.publishToken! });
      setConfirmed(false);
      setMessage(result.warning ?? (software ? "软件版本已发布。商品资料及其草稿保持不变。" : "商品资料已发布。软件版本和下载保持不变。"));
      router.refresh();
    } catch { setConfirmed(false); setError("发布响应未完成，请刷新检查结果，避免重复操作。"); }
    finally { operationInFlight.current = false; setBusy(false); }
  }
  async function upload(file: File | undefined, field: "icon_url" | "hero_image_url" | "gallery_urls" | `video:${string}`) {
    if (!file || disabled || !existing) return;
    if (file.size > 8 * 1024 * 1024) { setError(imageErrors.PRODUCT_IMAGE_TOO_LARGE); return; }
    if (field === "gallery_urls" && (value.gallery_urls?.length ?? 0) >= 8) { setError("最多添加8张截图。"); return; }
    setUploading(true); setError(""); setMessage("图片上传与校验中…");
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
  function artwork(field: "icon_url" | "hero_image_url", title: string) {
    return <section className="min-w-0 rounded-xl border p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 flex h-40 items-center justify-center rounded-lg bg-muted/40">{value[field] ? <img src={value[field]} alt={`${title}预览`} className="max-h-40 max-w-full object-contain" /> : <span className="text-sm text-muted-foreground">尚未上传</span>}</div>
      <label className="mt-4 block text-sm">{value[field] ? `替换${title}` : `上传${title}`}<Input data-upload={field} className="mt-2 h-auto file:mr-3 file:rounded-md file:bg-primary file:px-4 file:py-2 file:text-primary-foreground" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || !existing} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file, field); }} /></label>
      <details className="mt-3"><summary className="cursor-pointer text-xs text-muted-foreground">高级：使用已有图片地址</summary><Input aria-label={`${title}地址`} className="mt-2" value={value[field]} disabled={disabled} onChange={event => update(field, event.target.value)} placeholder="本站路径或HTTPS地址" /></details>
    </section>;
  }
  const displayedReleases = publicationMode === "software"
    ? releases.filter(r => selected.includes(r.id))
    : releases.filter(r => r.status === "published").sort((a, b) => Number(b.is_current) - Number(a.is_current));
  const previewRecord = publicationMode === "product" ? value : publishedProduct;

  return <ReleaseFlowContext.Provider value={{ setActivity, goPreview, goVersions, operationBusy: disabled }}><div className="container max-w-7xl px-4 py-8" data-testid="product-workspace">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0"><Link href="/admin/products" className="text-sm text-primary" onClick={event => { if ((unsaved || disabled) && !window.confirm("有未保存修改或上传正在进行，确定离开吗？")) event.preventDefault(); }}>← 商品管理</Link><h1 className="mt-3 break-words text-3xl font-semibold">{existing ? value.name_zh || value.slug : "新增商品"}</h1><p className="mt-2 text-sm text-muted-foreground">商品：{product.visibility === "published" ? "已上架" : "未上架"} · 软件：{publishedVersionCount ? `${publishedVersionCount} 个已发布版本` : "尚无已发布版本"} · {dirty ? "商品资料未保存" : hasDraft ? "商品资料有待发布修改" : "商品资料已保存"}</p></div>
      <div className="flex flex-wrap gap-2"><Button data-testid="save-product-draft" disabled={disabled} onClick={save}>{busy ? "处理中…" : "保存商品资料"}</Button><Button data-preview-product variant="outline" disabled={disabled} onClick={() => { setPublicationMode("product"); setConfirmed(false); setTab("preview"); }}>预览商品资料</Button></div>
    </div>
    <nav role="tablist" className="mt-7 flex flex-wrap gap-2 border-b pb-3" aria-label="商品编辑分区">{tabs.map(([id, title], index) => <Button key={id} id={`tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`panel-${id}`} tabIndex={tab === id ? 0 : -1} data-tab={id} variant={tab === id ? "default" : "outline"} disabled={disabled} onClick={() => setTab(id)} onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      setTab(tabs[next][0]); document.querySelector<HTMLButtonElement>(`[data-tab="${tabs[next][0]}"]`)?.focus();
    }}>{title}</Button>)}</nav>
    {message && <p role="status" className="mt-4 rounded-lg border bg-muted/20 p-3 text-sm">{message}</p>}
    {error && <p ref={feedbackRef} tabIndex={-1} role="alert" className="mt-4 rounded-lg border border-destructive p-3 text-sm text-destructive">{error}</p>}
    <div id="panel-details" role="tabpanel" aria-labelledby="tab-details" className="mt-6" hidden={tab !== "details"}>
      <fieldset disabled={disabled} className="grid min-w-0 gap-5 rounded-xl border p-5 md:grid-cols-2">
        <label className="text-sm font-medium">商品名称<Input name="name_zh" className="mt-2" required value={value.name_zh} onChange={e => update("name_zh", e.target.value)} placeholder="例如：我的软件" /></label>
        <label className="text-sm font-medium">商品地址标识<Input name="slug" className="mt-2" required readOnly={existing} value={value.slug} onChange={e => update("slug", e.target.value)} placeholder="my-software" /><span className="mt-1 block text-xs text-muted-foreground">小写字母、数字、连字符；创建后固定。</span></label>
        <label className="text-sm font-medium">分类<select name="category_slug" className="mt-2 h-10 w-full rounded-md border bg-background px-3" value={value.category_slug} onChange={e => update("category_slug", e.target.value)}>{categories.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
        <label className="text-sm font-medium">软件状态<select name="status" className="mt-2 h-10 w-full rounded-md border bg-background px-3" value={value.status} onChange={e => update("status", e.target.value as AdminStoreProductRow["status"])}><option value="beta">测试版</option><option value="released">正式版</option><option value="coming-soon">即将推出</option></select></label>
        <label className="text-sm font-medium md:col-span-2">一句话简介<Input name="tagline_zh" className="mt-2" value={value.tagline_zh} onChange={e => update("tagline_zh", e.target.value)} /></label>
        <label className="text-sm font-medium md:col-span-2">详细说明<Textarea name="description_zh" rows={7} className="mt-2" value={value.description_zh} onChange={e => update("description_zh", e.target.value)} placeholder="说明软件用途、功能和使用方式。支持换行，不执行HTML。" /></label>
        <label className="text-sm font-medium">支持平台<Input name="supported_platforms" className="mt-2" value={value.supported_platforms.join(", ")} onChange={e => update("supported_platforms", e.target.value.split(",").map(v => v.trim()))} placeholder="macOS, Windows, Linux" /></label>
        <label className="flex items-center gap-2 text-sm"><input name="featured" type="checkbox" checked={value.featured} onChange={e => update("featured", e.target.checked)} />首页推荐</label>
        <details className="md:col-span-2"><summary className="cursor-pointer font-medium">英文资料（可选，未填写时使用中文）</summary><div className="mt-4 grid gap-4"><label className="text-sm">English name<Input name="name_en" value={value.name_en} onChange={e => update("name_en", e.target.value)} /></label><label className="text-sm">English tagline<Input name="tagline_en" value={value.tagline_en} onChange={e => update("tagline_en", e.target.value)} /></label><label className="text-sm">English description<Textarea name="description_en" rows={5} value={value.description_en} onChange={e => update("description_en", e.target.value)} /></label></div></details>
      </fieldset>
      <div id="product-artwork" className="mt-6">
      {!existing && <p className="mb-5 rounded-lg border p-4">先填写商品名称和地址标识，保存草稿后即可上传图片。</p>}
      <p className="mb-4 text-sm text-muted-foreground">PNG / JPEG / WebP · 每张最多8 MiB · 上传后重新编码并移除原始元数据 · 新图在发布前仅管理员可见</p>
      <div className="grid gap-5 md:grid-cols-2">{artwork("icon_url", "图标")}{artwork("hero_image_url", "封面")}</div>
      <section className="mt-5 rounded-xl border p-5"><h2 className="text-xl font-semibold">产品截图 <span className="text-sm font-normal text-muted-foreground">{value.gallery_urls?.length ?? 0}/8</span></h2><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{(value.gallery_urls ?? []).map((url, index) => <div key={`${url}-${index}`} className="min-w-0 rounded-lg border p-3"><img src={url} alt={`截图 ${index + 1}`} className="h-36 w-full object-contain" /><div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" aria-label={`截图${index + 1}前移`} disabled={disabled || index === 0} onClick={() => reorder(index, -1)}>前移</Button><Button size="sm" variant="outline" aria-label={`截图${index + 1}后移`} disabled={disabled || index === (value.gallery_urls?.length ?? 0) - 1} onClick={() => reorder(index, 1)}>后移</Button><Button size="sm" variant="outline" aria-label={`移除截图${index + 1}`} disabled={disabled} onClick={() => update("gallery_urls", value.gallery_urls!.filter((_, i) => i !== index))}>移除</Button></div></div>)}</div>
        <label className="mt-5 block text-sm">添加产品截图<Input data-upload="gallery_urls" className="mt-2 h-auto max-w-md file:mr-3 file:rounded-md file:bg-primary file:px-4 file:py-2 file:text-primary-foreground" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || !existing || (value.gallery_urls?.length ?? 0) >= 8} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; void upload(file, "gallery_urls"); }} /></label>
      </section>
      </div>
      <ProductVideoEditor videos={value.videos ?? []} disabled={disabled} canUpload={existing} onChange={videos => update("videos", videos)} onUploadPoster={(file, id) => { void upload(file, `video:${id}`); }} />
    </div>
    <div id="panel-versions" role="tabpanel" aria-labelledby="tab-versions" hidden={tab !== "versions"}>
      {!existing ? <p className="rounded-lg border p-5">请先保存商品草稿，再添加属于该商品的软件版本。</p> : <>{dirty && <p data-testid="independent-version-editing" className="mb-4 rounded-lg border p-4 text-sm">商品资料有未保存修改，但不影响软件版本操作。版本发布不会保存或公开这些修改。</p>}<div className="min-w-0">{releasePanel}</div></>}
    </div>
    <div id="panel-preview" role="tabpanel" aria-labelledby="tab-preview" hidden={tab !== "preview"}>
      <PublicationReview mode={publicationMode} onModeChange={mode => { setPublicationMode(mode); setConfirmed(false); }} productIsPublished={Boolean(publishedProduct)} product={value} onFixProduct={target => { if (!disabled) { setTab("details"); if (target === "media") requestAnimationFrame(() => document.getElementById("product-artwork")?.scrollIntoView({ behavior: "smooth", block: "start" })); } }} releases={releases} selected={selected} setSelected={setSelected} dirty={dirty} releaseDirty={releaseDirty} existing={existing} disabled={disabled} confirmed={confirmed} setConfirmed={setConfirmed} onPublish={() => void publish()} onBack={goVersions} />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><h2 data-testid="publication-preview-caption" className="font-semibold">{publicationMode === "product" ? "商品资料预览 · 软件版本保持不变" : "软件版本预览 · 使用线上商品资料，不包含商品草稿"}</h2><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setLocale(locale === "zh" ? "en" : "zh")}>{locale === "zh" ? "切换英文" : "切换中文"}</Button><Button size="sm" variant="outline" onClick={() => setMobile(!mobile)}>{mobile ? "桌面宽度" : "手机宽度"}</Button></div></div>
      <div data-testid="product-preview" className={`mx-auto mt-4 overflow-hidden rounded-xl border ${mobile ? "max-w-[390px]" : "w-full"}`}>{tab === "preview" && (previewRecord ? <DatabaseProductPage product={previewProduct(previewRecord, locale)} releases={previewReleases(displayedReleases, locale)} locale={locale} preview /> : <div className="p-6 text-sm"><h3 className="font-semibold">商品尚未上架，暂不预览商品介绍。</h3><p className="mt-3 text-muted-foreground">上方已列出本次软件版本、说明和文件。软件发布只开放这些下载，不发布商品草稿。</p></div>)}</div>
    </div>
  </div></ReleaseFlowContext.Provider>;
}
