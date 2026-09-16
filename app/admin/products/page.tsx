import { notFound } from "next/navigation";
import Link from "next/link";
import { getStoreAdmin, listAdminProducts } from "@/lib/store/admin";
import { saveProductAction } from "@/app/admin/actions";
import { AdminActionForm } from "@/components/admin/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminStoreProductRow } from "@/lib/store/types";

export const dynamic = "force-dynamic";

function ProductForm({ product }: { product?: AdminStoreProductRow }) {
  return (
    <AdminActionForm action={saveProductAction} className="grid gap-4 rounded-lg border p-5">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium">商品标识 / Slug<Input name="slug" defaultValue={product?.slug} readOnly={Boolean(product)} required /></label>
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

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  if (!(await getStoreAdmin())) notFound();
  const [products, query] = await Promise.all([listAdminProducts(), searchParams]);
  return (
    <div className="container px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-primary">Store administration</p><h1 className="text-3xl font-bold">商品发布与管理</h1></div>
        <Button asChild variant="outline"><Link href="/admin/releases">软件版本发布</Link></Button>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">商品页负责名称、介绍和展示状态；软件包与版本说明请在「软件版本发布」中管理。</p>
      {query.saved === "1" && <p role="status" className="mt-4 rounded-md border p-3 text-sm">商品已保存。</p>}
      <div className="mt-8 space-y-6">
        <details className="rounded-lg border p-5"><summary className="cursor-pointer font-semibold">新建商品</summary><div className="mt-5"><ProductForm /></div></details>
        {products.map((product) => <details key={product.id} id={`product-${product.slug}`} className="rounded-lg border p-5"><summary className="cursor-pointer font-semibold">{product.name_zh} · {product.visibility === "published" ? "公开" : "草稿"}</summary><div className="mt-5"><ProductForm product={product} /></div></details>)}
      </div>
    </div>
  );
}
