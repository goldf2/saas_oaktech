import Link from "next/link";
import { Package, Plus, Image as ImageIcon, ArrowUpRight, Download } from "lucide-react";
import { getStoreAdmin } from "@/lib/store/admin";
import { readStoreCatalog } from "@/lib/store/file-catalog";
import { listPublicWorkspaceItems } from "@/lib/store/public-data";
import { filterWorkspaceProducts, managedWorkspaceItems, type WorkspaceProductItem } from "@/lib/store/workspace-product-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProductManagementQuery = { q?: string; state?: string };

// Shared server-rendered list, not an authorization fallback. Management projection
// is chosen only after checking the real session; public data has no draft fields.
export async function ProductManagement({ searchParams }: { searchParams: Promise<ProductManagementQuery> }) {
  const administrator = Boolean(await getStoreAdmin());
  const query = await searchParams;
  let items: WorkspaceProductItem[];
  if (administrator) {
    const { catalog } = await readStoreCatalog();
    items = managedWorkspaceItems(catalog);
  } else {
    items = await listPublicWorkspaceItems("zh");
  }
  const { q, state, filtered, stats } = filterWorkspaceProducts(items, query, administrator);
  return <section className="min-w-0" data-testid="workspace-product-list" data-list-access={administrator ? "management" : "public"}>
    <div data-testid={administrator ? "product-management" : "public-product-list"}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-semibold">{administrator ? "商品管理" : "商品目录"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{administrator
            ? "浏览与管理合在同一列表；编辑商品、发布软件，或查看公开详情与下载。"
            : "浏览已公开商品及可用下载。这里是公开目录，不代表已购买或已获得许可证。"}</p></div>
        {administrator && <Button asChild><Link href="/admin/products/new"><Plus className="mr-2 h-4 w-4" aria-hidden="true" />新增商品</Link></Button>}
      </header>
      <div className={`mt-4 grid gap-3 ${administrator ? "grid-cols-3" : "grid-cols-2"}`} aria-label="商品统计" data-testid="product-list-stats">
        {stats.map(([label, count]) => <div key={label} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{count}</p></div>)}
      </div>
      <form action="/dashboard" className="my-4 flex flex-wrap gap-2" aria-label="筛选商品">
        <input type="hidden" name="view" value="products" />
        <Input name="q" defaultValue={q} placeholder="搜索名称或商品标识" aria-label="搜索商品" className="max-w-md" maxLength={200} />
        {administrator && <select name="state" defaultValue={state} aria-label="展示状态" className="h-10 rounded-md border bg-background px-3"><option value="all">全部商品</option><option value="published">已上架</option><option value="draft">有资料草稿</option></select>}
        <Button type="submit" variant="outline">筛选</Button>
        {(q || state !== "all") && <Button asChild variant="ghost"><Link href="/dashboard?view=products">清除筛选</Link></Button>}
      </form>
      {!filtered.length && <p className="rounded-xl border p-6 text-muted-foreground" role="status">{q || state !== "all" ? "没有符合条件的商品，请调整筛选。" : administrator ? "暂无商品，可以新增商品。" : "当前暂无公开商品。"}</p>}
      <div className="grid gap-4 lg:grid-cols-2" data-testid="dashboard-products">{filtered.map(product => {
        const editHref = `/admin/products/${encodeURIComponent(product.slug)}`;
        const publicHref = `/zh/products/${encodeURIComponent(product.slug)}`;
        const management = administrator ? product.management : undefined;
        return <article key={product.slug} id={`product-${product.slug}`} data-product-slug={product.slug} className="min-w-0 rounded-xl border p-4">
          <div className="flex items-start gap-3">
            {product.iconUrl ? <img src={product.iconUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl border object-contain" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted"><ImageIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" /></span>}
            <div className="min-w-0 flex-1"><h3 className="break-words text-lg font-semibold"><Link href={administrator ? editHref : publicHref}>{product.name}</Link></h3><p className="mt-1 break-all text-xs text-muted-foreground">{product.slug}</p>
              <p className="mt-2 text-sm">{product.published ? "已上架" : "未上架"}<span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs" data-product-stage>{product.status === "beta" ? "测试版" : product.status === "coming-soon" ? "即将推出" : "正式版"}</span>{management?.pendingProduct && product.published ? " · 有待发布资料" : ""}</p>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">{product.tagline || "尚未填写商品简介"}</p>
          {management?.publishedName && management.publishedName !== product.name && <p className="mt-1 break-words text-xs text-muted-foreground">线上名称：{management.publishedName}；当前卡片显示编辑中的资料。</p>}
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"><Package className="h-4 w-4" aria-hidden="true" />
            {management ? `${management.totalVersions} 个版本 · ${management.draftVersions} 个版本待发布 · ${product.publishedVersions} 个已发布` : `${product.publishedVersions} 个已发布软件版本`}
          </p>
          {!product.downloadable && <p className="mt-2 text-xs text-muted-foreground">{!product.published ? "商品介绍尚未上架；软件发布状态独立管理。" : "暂无可下载的软件包，可先查看商品介绍。"}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {administrator && <><Button asChild><Link href={editHref}>编辑商品</Link></Button><Button asChild variant="outline"><Link href={`${editHref}?tab=versions`}>软件版本</Link></Button></>}
            {product.published && <Button asChild variant={administrator ? "ghost" : "outline"}><Link href={publicHref} target={administrator ? "_blank" : undefined} rel={administrator ? "noopener noreferrer" : undefined}>{administrator ? "查看线上" : "查看商品详情"}<ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" /></Link></Button>}
            {product.downloadable && <Button asChild variant={administrator ? "outline" : "default"}><Link data-product-download href={`${publicHref}#downloads`} target={administrator ? "_blank" : undefined} rel={administrator ? "noopener noreferrer" : undefined}><Download className="mr-1 h-4 w-4" aria-hidden="true" />软件下载</Link></Button>}
          </div>
        </article>;
      })}</div>
    </div>
  </section>;
}
