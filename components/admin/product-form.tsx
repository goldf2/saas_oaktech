import { saveProductAction } from "@/app/admin/actions";
import { AdminActionForm } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminStoreProductRow } from "@/lib/store/types";

export function ProductForm({ product }: { product?: AdminStoreProductRow }) {
  return (
    <AdminActionForm action={saveProductAction} className="grid gap-4 rounded-lg border p-5">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium">商品标识 / Slug<Input name="slug" defaultValue={product?.slug} readOnly={Boolean(product?.id)} required /></label>
        <label className="text-sm font-medium">分类标识<Input name="category_slug" defaultValue={product?.category_slug ?? "desktop-apps"} required /></label>
        <label className="text-sm font-medium">商品状态<select name="status" defaultValue={product?.status ?? "beta"} className="mt-2 h-10 w-full rounded-md border bg-background px-3"><option value="beta">测试版 / Beta</option><option value="released">已推出 / Released</option><option value="coming-soon">即将推出 / Coming soon</option></select></label>
        <label className="text-sm font-medium">展示状态<select name="visibility" defaultValue={product?.visibility ?? "draft"} className="mt-2 h-10 w-full rounded-md border bg-background px-3"><option value="draft">草稿 / Draft</option><option value="published">公开 / Published</option></select></label>
        <label className="text-sm font-medium">图标 URL / 路径<Input name="icon_url" defaultValue={product?.icon_url} placeholder="/product/icon.png" required /></label>
        <label className="text-sm font-medium">封面 URL / 路径<Input name="hero_image_url" defaultValue={product?.hero_image_url} placeholder="/product/hero.png" required /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">Name (English)<Input name="name_en" defaultValue={product?.name_en} required /></label>
        <label className="text-sm font-medium">名称（中文）<Input name="name_zh" defaultValue={product?.name_zh} required /></label>
        <label className="text-sm font-medium">Tagline (English)<Input name="tagline_en" defaultValue={product?.tagline_en} required /></label>
        <label className="text-sm font-medium">一句话简介（中文）<Input name="tagline_zh" defaultValue={product?.tagline_zh} required /></label>
        <label className="text-sm font-medium">Description (English)<Textarea name="description_en" defaultValue={product?.description_en} required /></label>
        <label className="text-sm font-medium">详情（中文）<Textarea name="description_zh" defaultValue={product?.description_zh} required /></label>
      </div>
      <label className="text-sm font-medium">支持平台（以逗号分隔）<Input name="supported_platforms" defaultValue={product?.supported_platforms.join(", ")} /></label>
      <label className="flex items-center gap-2 text-sm"><input name="featured" type="checkbox" defaultChecked={product?.featured} /> 首页推荐</label>
      <Button type="submit" className="w-fit">保存商品</Button>
    </AdminActionForm>
  );
}
