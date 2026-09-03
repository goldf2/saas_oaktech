import { notFound } from "next/navigation";
import Link from "next/link";
import { getStoreAdmin, listAdminProducts } from "@/lib/store/admin";
import { saveProductAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminStoreProductRow } from "@/lib/store/types";

export const dynamic = "force-dynamic";

function ProductForm({ product }: { product?: AdminStoreProductRow }) {
  return (
    <form action={saveProductAction} className="grid gap-4 rounded-lg border p-5">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-3">
        <label><Label>Slug</Label><Input name="slug" defaultValue={product?.slug} readOnly={Boolean(product)} required /></label>
        <label><Label>Category slug</Label><Input name="category_slug" defaultValue={product?.category_slug ?? "desktop-apps"} required /></label>
        <label><Label>Status</Label><select name="status" defaultValue={product?.status ?? "beta"} className="mt-2 h-10 w-full rounded-md border bg-background px-3"><option value="beta">Beta</option><option value="released">Released</option><option value="coming-soon">Coming soon</option></select></label>
        <label><Label>Visibility</Label><select name="visibility" defaultValue={product?.visibility ?? "draft"} className="mt-2 h-10 w-full rounded-md border bg-background px-3"><option value="draft">Draft</option><option value="published">Published</option></select></label>
        <label><Label>Icon URL/path</Label><Input name="icon_url" defaultValue={product?.icon_url} placeholder="/product/icon.png" required /></label>
        <label><Label>Hero URL/path</Label><Input name="hero_image_url" defaultValue={product?.hero_image_url} placeholder="/product/hero.png" required /></label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label><Label>Name (English)</Label><Input name="name_en" defaultValue={product?.name_en} required /></label>
        <label><Label>名称（中文）</Label><Input name="name_zh" defaultValue={product?.name_zh} required /></label>
        <label><Label>Tagline (English)</Label><Input name="tagline_en" defaultValue={product?.tagline_en} required /></label>
        <label><Label>一句话简介（中文）</Label><Input name="tagline_zh" defaultValue={product?.tagline_zh} required /></label>
        <label><Label>Description (English)</Label><Textarea name="description_en" defaultValue={product?.description_en} required /></label>
        <label><Label>详情（中文）</Label><Textarea name="description_zh" defaultValue={product?.description_zh} required /></label>
      </div>
      <label><Label>Platforms (comma separated)</Label><Input name="supported_platforms" defaultValue={product?.supported_platforms.join(", ")} /></label>
      <label className="flex items-center gap-2 text-sm"><input name="featured" type="checkbox" defaultChecked={product?.featured} /> Featured</label>
      <Button type="submit" className="w-fit">Save product</Button>
    </form>
  );
}

export default async function AdminProductsPage() {
  if (!(await getStoreAdmin())) notFound();
  const products = await listAdminProducts();
  return (
    <div className="container px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-primary">Store administration</p><h1 className="text-3xl font-bold">Software products</h1></div><Button asChild variant="outline"><Link href="/admin/releases">Manage releases</Link></Button></div>
      <div className="mt-8 space-y-6">
        <details className="rounded-lg border p-5"><summary className="cursor-pointer font-semibold">Create product</summary><div className="mt-5"><ProductForm /></div></details>
        {products.map((product) => <details key={product.id} className="rounded-lg border p-5"><summary className="cursor-pointer font-semibold">{product.name_en} · {product.visibility}</summary><div className="mt-5"><ProductForm product={product} /></div></details>)}
      </div>
    </div>
  );
}
