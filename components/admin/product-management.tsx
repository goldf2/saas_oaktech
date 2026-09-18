import Link from "next/link";
import { Package, Plus, Image as ImageIcon, ArrowUpRight } from "lucide-react";
import { AdminAccessNotice } from "@/components/admin/access-notice";
import { getStoreAdmin } from "@/lib/store/admin";
import { readStoreCatalog } from "@/lib/store/file-catalog";
import { editableProduct } from "@/lib/store/product-workspace";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProductManagementQuery = { q?: string; state?: string };
// This server component checks authorization itself before reading draft data.
export async function ProductManagement({ searchParams }: { searchParams: Promise<ProductManagementQuery> }) {
  if (!(await getStoreAdmin())) return <AdminAccessNotice />;
  const [{ catalog }, query] = await Promise.all([readStoreCatalog(), searchParams]);
  const q = typeof query.q === "string" ? query.q.trim().toLowerCase().slice(0, 200) : "";
  const filtered = catalog.products.filter(product => {
    const working = editableProduct(catalog, product.slug)!;
    const text = `${product.slug} ${working.name_zh} ${working.name_en}`.toLowerCase();
    return (!q || text.includes(q)) && (query.state === "draft" ? Boolean(catalog.productDrafts?.[product.slug]) || product.visibility === "draft" : query.state === "published" ? product.visibility === "published" : true);
  });
  const drafts = catalog.products.filter(p => catalog.productDrafts?.[p.slug] || p.visibility === "draft").length;
  const pendingVersions = catalog.releases.filter(r => r.status === "draft").length;
  return <section className="min-w-0" data-testid="product-management">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-semibold">商品管理</h2><p className="mt-2 text-sm text-muted-foreground">编辑商品图文与视频，管理软件版本；商品资料与软件分别发布。</p></div>
      <Button asChild><Link href="/admin/products/new"><Plus className="mr-2 h-4 w-4" />新增商品</Link></Button>
    </header>
    <div className="mt-4 grid grid-cols-3 gap-3" aria-label="商品统计">
      {[["商品", catalog.products.length], ["待发布资料", drafts], ["版本草稿", pendingVersions]].map(([label, count]) => <div key={label} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{count}</p></div>)}
    </div>
    <form action="/dashboard" className="my-4 flex flex-wrap gap-2" aria-label="筛选商品">
      <input type="hidden" name="view" value="products" />
      <Input name="q" defaultValue={typeof query.q === "string" ? query.q : ""} placeholder="搜索名称或商品标识" aria-label="搜索商品" className="max-w-md" maxLength={200} />
      <select name="state" defaultValue={query.state ?? "all"} aria-label="展示状态" className="h-10 rounded-md border bg-background px-3"><option value="all">全部商品</option><option value="published">已上架</option><option value="draft">有草稿</option></select>
      <Button type="submit" variant="outline">筛选</Button>
    </form>
    {!filtered.length && <p className="rounded-xl border p-6 text-muted-foreground">没有符合条件的商品。可以调整筛选，或新增商品。</p>}
    <div className="grid gap-4 lg:grid-cols-2">{filtered.map(product => {
      const working = editableProduct(catalog, product.slug)!;
      const pending = Boolean(catalog.productDrafts?.[product.slug]);
      const versions = catalog.releases.filter(r => r.product_slug === product.slug);
      const href = `/admin/products/${encodeURIComponent(product.slug)}`;
      return <article key={product.id} id={`product-${product.slug}`} data-product-slug={product.slug} className="min-w-0 rounded-xl border p-4">
        <div className="flex items-start gap-3">
          {working.icon_url ? <img src={working.icon_url} alt="" className="h-12 w-12 shrink-0 rounded-xl border object-contain" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted"><ImageIcon className="h-6 w-6 text-muted-foreground" /></span>}
          <div className="min-w-0 flex-1"><h3 className="break-words text-lg font-semibold"><Link href={href}>{working.name_zh || working.name_en || product.slug}</Link></h3><p className="mt-1 break-all text-xs text-muted-foreground">{product.slug}</p><p className="mt-2 text-sm">{product.visibility === "published" ? "已上架" : "未上架"}{pending ? " · 有待发布修改" : ""}</p></div>
        </div>
        <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">{working.tagline_zh || "尚未填写商品简介"}</p>
        <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground"><Package className="h-4 w-4" />{versions.length} 个版本 · {versions.filter(r => r.status === "draft").length} 个版本待发布</p>
        <div className="mt-4 flex flex-wrap gap-2"><Button asChild><Link href={href}>编辑商品</Link></Button><Button asChild variant="outline"><Link href={`${href}?tab=versions`}>软件版本</Link></Button>{product.visibility === "published" && <Button asChild variant="ghost"><Link href={`/zh/products/${product.slug}`} target="_blank" rel="noopener">查看线上<ArrowUpRight className="ml-1 h-4 w-4" /></Link></Button>}</div>
      </article>;
    })}</div>
  </section>;
}
