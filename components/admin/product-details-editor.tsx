"use client";

import { ImagePlus, Plus, Upload, ArrowUp, ArrowDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlatformPicker } from "./platform-picker";
import { PRODUCT_CATEGORY_PRESETS, categoryLabel } from "@/lib/store/presentation";
import { ProductVideoEditor } from "./product-video-editor";
import type { AdminStoreProductRow } from "@/lib/store/types";
import { useLocale } from "@/i18n/locale-provider";

export type ProductMediaField = "icon_url" | "hero_image_url" | "gallery_urls" | `video:${string}`;
type UpdateProduct = <K extends keyof AdminStoreProductRow>(field: K, next: AdminStoreProductRow[K]) => void;

export function ProductDetailsEditor({ value, disabled, existing, update, onUpload, onMoveScreenshot, onSave, onPreparePublication }: {
  value: AdminStoreProductRow;
  disabled: boolean;
  existing: boolean;
  update: UpdateProduct;
  onUpload: (file: File | undefined, field: ProductMediaField) => void;
  onMoveScreenshot: (index: number, delta: number) => void;
  onSave: () => void;
  onPreparePublication: () => void;
}) {
  const { locale } = useLocale();
  const zh = locale === "zh";
  const categories = PRODUCT_CATEGORY_PRESETS.map(p => [p.value, p[locale]] as const);
  function uploadControl(field: "icon_url" | "hero_image_url", label: string) {
    return <label className={`inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${disabled || !existing ? "pointer-events-none opacity-50" : "hover:opacity-90"}`}>
      <Upload className="h-4 w-4" aria-hidden="true" />{label}
      <input data-upload={field} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || !existing}
        onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; onUpload(file, field); }} />
    </label>;
  }
  return <div className="space-y-3" data-testid="product-details-layout">
    <div data-testid="product-details-columns" className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.72fr)_minmax(280px,0.92fr)]">
      <section className="min-w-0 rounded-xl border bg-background p-4" data-testid="product-copy-panel">
        <h2 className="text-base font-semibold">{zh ? "基本资料" : "Basic information"}</h2>
        <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{zh ? "编辑基础信息与支持平台；详细说明在页面底部。" : "Edit core product information and supported platforms; the detailed description is at the bottom."}</p>
        <fieldset disabled={disabled} className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">{zh ? "商品名称" : "Product name (Chinese)"}<Input name="name_zh" className="mt-1 h-9" required value={value.name_zh} onChange={e => update("name_zh", e.target.value)} placeholder={zh ? "例如：我的软件" : "Chinese product name"} /></label>
          <label className="text-sm font-medium">{zh ? "地址标识" : "URL slug"}<Input name="slug" className="mt-1 h-9" required readOnly={existing} value={value.slug} onChange={e => update("slug", e.target.value)} placeholder="my-software" /><span className="mt-0.5 block text-[11px] font-normal leading-4 text-muted-foreground">{zh ? "商品网址标识，创建后固定。" : "Used in the product URL and fixed after creation."}</span></label>
          <label className="text-sm font-medium">{zh ? "商品类别" : "Product category"}<select name="category_slug" className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" value={value.category_slug} onChange={e => update("category_slug", e.target.value)}>{!categories.some(([id]) => id === value.category_slug) && <option value={value.category_slug}>{categoryLabel(value.category_slug, locale)} {zh ? "（已有类别）" : "(existing category)"}</option>}{categories.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label className="text-sm font-medium">{zh ? "展示标签" : "Display label"}<select name="status" className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" value={value.status} onChange={e => update("status", e.target.value as AdminStoreProductRow["status"])}><option value="beta">{zh ? "测试版" : "Beta"}</option><option value="released">{zh ? "正式版" : "Released"}</option><option value="coming-soon">{zh ? "即将推出" : "Coming soon"}</option></select><span className="mt-0.5 block text-[11px] font-normal leading-4 text-muted-foreground">{zh ? "商品标签，不代表本次发布状态。" : "A product label, not the publication state of this edit."}</span></label>
          <label className="text-sm font-medium sm:col-span-2">{zh ? "一句话简介" : "Tagline (Chinese)"}<Input name="tagline_zh" className="mt-1 h-9" value={value.tagline_zh} onChange={e => update("tagline_zh", e.target.value)} /></label>
          <div className="sm:col-span-2"><PlatformPicker value={value.supported_platforms} disabled={disabled} onChange={next => update("supported_platforms", next)} /></div>
          <label className="flex min-h-8 items-center gap-2 self-end text-sm"><input name="featured" className="h-4 w-4 accent-primary" type="checkbox" checked={value.featured} onChange={e => update("featured", e.target.checked)} />{zh ? "首页推荐" : "Featured on home"}</label>
          <details className="border-t pt-2 sm:col-span-2" data-testid="product-english-fields">
            <summary className="cursor-pointer text-sm font-medium">{zh ? "英文资料" : "English content"} <span className="font-normal text-muted-foreground">· {zh ? "可选" : "optional"}</span></summary>
            <div className="mt-2 grid gap-2"><label className="text-sm">English name<Input name="name_en" className="mt-1 h-9" value={value.name_en} onChange={e => update("name_en", e.target.value)} /></label><label className="text-sm">English tagline<Input name="tagline_en" className="mt-1 h-9" value={value.tagline_en} onChange={e => update("tagline_en", e.target.value)} /></label><p className="text-[11px] leading-4 text-muted-foreground">{zh ? "英文详细说明在页面底部。" : "The English detailed description is at the bottom."}</p></div>
          </details>
        </fieldset>
      </section>

      <aside id="product-artwork" data-testid="product-media-panel" className="min-w-0 rounded-xl border bg-background p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-base font-semibold">{zh ? "商品图片" : "Product images"}</h2><p className="text-[11px] text-muted-foreground">PNG / JPEG / WebP · ≤ 8 MiB</p></div>
        {!existing && <p className="mt-2 rounded-md bg-muted/50 px-2.5 py-2 text-xs">{zh ? "先保存商品草稿，再上传图片。" : "Save the product draft before uploading images."}</p>}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/30">{value.icon_url ? <img src={value.icon_url} alt={zh ? "图标预览" : "Icon preview"} className="h-full w-full object-contain" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden="true" />}</div>
          <div className="min-w-0"><h3 className="mb-1.5 text-sm font-medium">{zh ? "应用图标" : "App icon"}</h3>{uploadControl("icon_url", value.icon_url ? (zh ? "替换图标" : "Replace icon") : (zh ? "上传图标" : "Upload icon"))}</div>
        </div>
        <div className="mt-3 border-t pt-3">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium">{zh ? "商品封面" : "Product cover"}</h3>{uploadControl("hero_image_url", value.hero_image_url ? (zh ? "替换封面" : "Replace cover") : (zh ? "上传封面" : "Upload cover"))}</div>
          <div className="flex aspect-[16/6] max-h-28 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">{value.hero_image_url ? <img src={value.hero_image_url} alt={zh ? "封面预览" : "Cover preview"} className="h-full w-full object-contain" /> : <span className="text-xs text-muted-foreground">{zh ? "尚未上传封面" : "No cover uploaded"}</span>}</div>
        </div>
        <section className="mt-3 border-t pt-3" aria-label={zh ? "编辑产品截图" : "Edit product screenshots"}>
          <h3 className="mb-1.5 text-sm font-medium">{zh ? "产品截图" : "Screenshots"} <span className="font-normal text-muted-foreground">{value.gallery_urls?.length ?? 0}/8</span></h3>
          <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-3">
            {(value.gallery_urls ?? []).map((url, index) => <div key={`${url}-${index}`} className="min-w-0 rounded-md border p-1">
              <img src={url} alt={zh ? `截图 ${index + 1}` : `Screenshot ${index + 1}`} className="h-14 w-full rounded object-contain" />
              <div className="mt-0.5 flex justify-center gap-0.5"><Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={zh ? `截图${index + 1}前移` : `Move screenshot ${index + 1} earlier`} disabled={disabled || index === 0} onClick={() => onMoveScreenshot(index, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button><Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={zh ? `截图${index + 1}后移` : `Move screenshot ${index + 1} later`} disabled={disabled || index === (value.gallery_urls?.length ?? 0) - 1} onClick={() => onMoveScreenshot(index, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button><Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={zh ? `移除截图${index + 1}` : `Remove screenshot ${index + 1}`} disabled={disabled} onClick={() => update("gallery_urls", value.gallery_urls!.filter((_, i) => i !== index))}><X className="h-3.5 w-3.5" /></Button></div>
            </div>)}
            {(value.gallery_urls?.length ?? 0) < 8 && <label className={`flex min-h-20 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border border-dashed border-primary/40 bg-primary/5 text-primary focus-within:ring-2 focus-within:ring-ring ${disabled || !existing ? "pointer-events-none opacity-50" : "hover:bg-primary/10"}`}><Plus className="h-4 w-4" aria-hidden="true" /><span className="text-[11px] font-medium">{zh ? "添加截图" : "Add screenshot"}</span><input data-upload="gallery_urls" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || !existing} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; onUpload(file, "gallery_urls"); }} /></label>}
          </div>
        </section>
        <details className="mt-3 border-t pt-2"><summary className="cursor-pointer text-[11px] text-muted-foreground">{zh ? "高级：使用已有图片地址" : "Advanced: use existing image URLs"}</summary><div className="mt-2 space-y-2"><label className="block text-xs">{zh ? "图标地址" : "Icon URL"}<Input aria-label={zh ? "图标地址" : "Icon URL"} className="mt-1 h-8" value={value.icon_url} disabled={disabled} onChange={e => update("icon_url", e.target.value)} /></label><label className="block text-xs">{zh ? "封面地址" : "Cover URL"}<Input aria-label={zh ? "封面地址" : "Cover URL"} className="mt-1 h-8" value={value.hero_image_url} disabled={disabled} onChange={e => update("hero_image_url", e.target.value)} /></label></div></details>
        <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{zh ? "上传后先保存草稿；确认发布前仅管理员可见。" : "Save the draft after uploading; new images remain administrator-only until publication."}</p>
      </aside>
    </div>
    <div data-testid="product-media-description-row" className="grid items-start gap-3 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
      <ProductVideoEditor videos={value.videos ?? []} disabled={disabled} canUpload={existing} onChange={videos => update("videos", videos)} onUploadPoster={(file, id) => onUpload(file, `video:${id}`)} />
      <section data-testid="product-description-panel" className="min-w-0 rounded-xl border bg-background p-4">
        <div className="mb-3"><h2 className="text-base font-semibold">{zh ? "详细说明" : "Detailed description"}</h2><p className="mt-0.5 text-xs text-muted-foreground">{zh ? "对应公开页“关于此软件”，与视频介绍并排编辑。" : "This becomes the public “About this app” section and is edited beside the video introduction."}</p></div>
        <fieldset disabled={disabled} className="space-y-3">
          <label className="block text-sm font-medium">{zh ? "中文详细说明" : "Chinese detailed description"}<Textarea name="description_zh" rows={8} className="mt-1.5 min-h-48 resize-y leading-relaxed" value={value.description_zh} onChange={e => update("description_zh", e.target.value)} placeholder={zh ? "介绍用途、主要功能和使用方法。支持换行，不执行 HTML。" : "Describe the product in Chinese. Line breaks are supported; HTML is not executed."} /></label>
          <details className="border-t pt-3" data-testid="product-english-description">
            <summary className="cursor-pointer text-sm font-medium">English description <span className="font-normal text-muted-foreground">· {zh ? "可选，留空时使用中文" : "optional; Chinese is used as fallback"}</span></summary>
            <label className="mt-3 block text-sm"><span className="sr-only">English description</span><Textarea name="description_en" rows={6} className="min-h-36 resize-y leading-relaxed" value={value.description_en} onChange={e => update("description_en", e.target.value)} placeholder="Describe the product, main features and usage." /></label>
          </details>
        </fieldset>
      </section>
    </div>
    <div data-testid="product-details-footer" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
      <p className="text-sm text-muted-foreground">{zh ? "保存草稿不会改变线上内容；发布商品资料无需安装包。" : "Saving a draft does not change the live page; publishing product information does not require a software package."}</p>
      <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" data-save-product-footer disabled={disabled} onClick={onSave}>{zh ? "保存草稿" : "Save draft"}</Button><Button type="button" data-prepare-product-footer disabled={disabled} onClick={onPreparePublication}>{zh ? "发布商品资料" : "Publish product info"}</Button></div>
    </div>
  </div>;
}
