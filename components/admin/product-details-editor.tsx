"use client";

import { ImagePlus, Plus, Upload, ArrowUp, ArrowDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlatformPicker } from "./platform-picker";
import { PRODUCT_CATEGORY_PRESETS, categoryLabel } from "@/lib/store/presentation";
import { ProductVideoEditor } from "./product-video-editor";
import type { AdminStoreProductRow } from "@/lib/store/types";

export type ProductMediaField = "icon_url" | "hero_image_url" | "gallery_urls" | `video:${string}`;
const categories = PRODUCT_CATEGORY_PRESETS.map(p => [p.value, p.zh]);
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
        <h2 className="text-base font-semibold">基本资料</h2>
        <p className="mb-3 mt-0.5 text-xs text-muted-foreground">编辑基础信息与支持平台；详细说明在页面底部。</p>
        <fieldset disabled={disabled} className="grid min-w-0 gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">商品名称<Input name="name_zh" className="mt-1 h-9" required value={value.name_zh} onChange={e => update("name_zh", e.target.value)} placeholder="例如：我的软件" /></label>
          <label className="text-sm font-medium">地址标识<Input name="slug" className="mt-1 h-9" required readOnly={existing} value={value.slug} onChange={e => update("slug", e.target.value)} placeholder="my-software" /><span className="mt-0.5 block text-[11px] font-normal leading-4 text-muted-foreground">商品网址标识，创建后固定。</span></label>
          <label className="text-sm font-medium">商品类别<select name="category_slug" className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" value={value.category_slug} onChange={e => update("category_slug", e.target.value)}>{!categories.some(([id]) => id === value.category_slug) && <option value={value.category_slug}>{categoryLabel(value.category_slug)}（已有类别）</option>}{categories.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
          <label className="text-sm font-medium">展示标签<select name="status" className="mt-1 h-9 w-full rounded-md border bg-background px-3 text-sm" value={value.status} onChange={e => update("status", e.target.value as AdminStoreProductRow["status"])}><option value="beta">测试版</option><option value="released">正式版</option><option value="coming-soon">即将推出</option></select><span className="mt-0.5 block text-[11px] font-normal leading-4 text-muted-foreground">商品标签，不代表本次发布状态。</span></label>
          <label className="text-sm font-medium sm:col-span-2">一句话简介<Input name="tagline_zh" className="mt-1 h-9" value={value.tagline_zh} onChange={e => update("tagline_zh", e.target.value)} /></label>
          <div className="sm:col-span-2"><PlatformPicker value={value.supported_platforms} disabled={disabled} onChange={next => update("supported_platforms", next)} /></div>
          <label className="flex min-h-8 items-center gap-2 self-end text-sm"><input name="featured" className="h-4 w-4 accent-primary" type="checkbox" checked={value.featured} onChange={e => update("featured", e.target.checked)} />首页推荐</label>
          <details className="border-t pt-2 sm:col-span-2" data-testid="product-english-fields">
            <summary className="cursor-pointer text-sm font-medium">英文资料 <span className="font-normal text-muted-foreground">· 可选</span></summary>
            <div className="mt-2 grid gap-2"><label className="text-sm">English name<Input name="name_en" className="mt-1 h-9" value={value.name_en} onChange={e => update("name_en", e.target.value)} /></label><label className="text-sm">English tagline<Input name="tagline_en" className="mt-1 h-9" value={value.tagline_en} onChange={e => update("tagline_en", e.target.value)} /></label><p className="text-[11px] leading-4 text-muted-foreground">英文详细说明在页面底部。</p></div>
          </details>
        </fieldset>
      </section>

      <aside id="product-artwork" data-testid="product-media-panel" className="min-w-0 rounded-xl border bg-background p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h2 className="text-base font-semibold">商品图片</h2><p className="text-[11px] text-muted-foreground">PNG / JPEG / WebP · ≤ 8 MiB</p></div>
        {!existing && <p className="mt-2 rounded-md bg-muted/50 px-2.5 py-2 text-xs">先保存商品草稿，再上传图片。</p>}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/30">{value.icon_url ? <img src={value.icon_url} alt="图标预览" className="h-full w-full object-contain" /> : <ImagePlus className="h-6 w-6 text-muted-foreground" aria-hidden="true" />}</div>
          <div className="min-w-0"><h3 className="mb-1.5 text-sm font-medium">应用图标</h3>{uploadControl("icon_url", value.icon_url ? "替换图标" : "上传图标")}</div>
        </div>
        <div className="mt-3 border-t pt-3">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-medium">商品封面</h3>{uploadControl("hero_image_url", value.hero_image_url ? "替换封面" : "上传封面")}</div>
          <div className="flex aspect-[16/6] max-h-28 items-center justify-center overflow-hidden rounded-lg border bg-muted/30">{value.hero_image_url ? <img src={value.hero_image_url} alt="封面预览" className="h-full w-full object-contain" /> : <span className="text-xs text-muted-foreground">尚未上传封面</span>}</div>
        </div>
        <section className="mt-3 border-t pt-3" aria-label="编辑产品截图">
          <h3 className="mb-1.5 text-sm font-medium">产品截图 <span className="font-normal text-muted-foreground">{value.gallery_urls?.length ?? 0}/8</span></h3>
          <div className="grid grid-cols-2 gap-1.5 xl:grid-cols-3">
            {(value.gallery_urls ?? []).map((url, index) => <div key={`${url}-${index}`} className="min-w-0 rounded-md border p-1">
              <img src={url} alt={`截图 ${index + 1}`} className="h-14 w-full rounded object-contain" />
              <div className="mt-0.5 flex justify-center gap-0.5"><Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`截图${index + 1}前移`} disabled={disabled || index === 0} onClick={() => onMoveScreenshot(index, -1)}><ArrowUp className="h-3.5 w-3.5" /></Button><Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`截图${index + 1}后移`} disabled={disabled || index === (value.gallery_urls?.length ?? 0) - 1} onClick={() => onMoveScreenshot(index, 1)}><ArrowDown className="h-3.5 w-3.5" /></Button><Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`移除截图${index + 1}`} disabled={disabled} onClick={() => update("gallery_urls", value.gallery_urls!.filter((_, i) => i !== index))}><X className="h-3.5 w-3.5" /></Button></div>
            </div>)}
            {(value.gallery_urls?.length ?? 0) < 8 && <label className={`flex min-h-20 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border border-dashed border-primary/40 bg-primary/5 text-primary focus-within:ring-2 focus-within:ring-ring ${disabled || !existing ? "pointer-events-none opacity-50" : "hover:bg-primary/10"}`}><Plus className="h-4 w-4" aria-hidden="true" /><span className="text-[11px] font-medium">添加截图</span><input data-upload="gallery_urls" className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled || !existing} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; onUpload(file, "gallery_urls"); }} /></label>}
          </div>
        </section>
        <details className="mt-3 border-t pt-2"><summary className="cursor-pointer text-[11px] text-muted-foreground">高级：使用已有图片地址</summary><div className="mt-2 space-y-2"><label className="block text-xs">图标地址<Input aria-label="图标地址" className="mt-1 h-8" value={value.icon_url} disabled={disabled} onChange={e => update("icon_url", e.target.value)} /></label><label className="block text-xs">封面地址<Input aria-label="封面地址" className="mt-1 h-8" value={value.hero_image_url} disabled={disabled} onChange={e => update("hero_image_url", e.target.value)} /></label></div></details>
        <p className="mt-2 text-[11px] leading-4 text-muted-foreground">上传后先保存草稿；确认发布前仅管理员可见。</p>
      </aside>
    </div>
    <ProductVideoEditor videos={value.videos ?? []} disabled={disabled} canUpload={existing} onChange={videos => update("videos", videos)} onUploadPoster={(file, id) => onUpload(file, `video:${id}`)} />
    <section data-testid="product-description-panel" className="rounded-xl border bg-background p-4">
      <div className="mb-3"><h2 className="text-base font-semibold">详细说明</h2><p className="mt-0.5 text-xs text-muted-foreground">对应公开页“关于此软件”，在媒体内容之后编辑。</p></div>
      <fieldset disabled={disabled} className="space-y-3">
        <label className="block text-sm font-medium">中文详细说明<Textarea name="description_zh" rows={8} className="mt-1.5 min-h-48 resize-y leading-relaxed" value={value.description_zh} onChange={e => update("description_zh", e.target.value)} placeholder="介绍用途、主要功能和使用方法。支持换行，不执行 HTML。" /></label>
        <details className="border-t pt-3" data-testid="product-english-description">
          <summary className="cursor-pointer text-sm font-medium">English description <span className="font-normal text-muted-foreground">· 可选，留空时使用中文</span></summary>
          <label className="mt-3 block text-sm"><span className="sr-only">English description</span><Textarea name="description_en" rows={6} className="min-h-36 resize-y leading-relaxed" value={value.description_en} onChange={e => update("description_en", e.target.value)} placeholder="Describe the product, main features and usage." /></label>
        </details>
      </fieldset>
    </section>
    <div data-testid="product-details-footer" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
      <p className="text-sm text-muted-foreground">保存草稿不会改变线上内容；发布商品资料无需安装包。</p>
      <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" data-save-product-footer disabled={disabled} onClick={onSave}>保存草稿</Button><Button type="button" data-prepare-product-footer disabled={disabled} onClick={onPreparePublication}>发布商品资料</Button></div>
    </div>
  </div>;
}
