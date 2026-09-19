import Link from "next/link";
import { Package, Plus, Image as ImageIcon, ArrowUpRight, Download } from "lucide-react";
import { getStoreAdmin } from "@/lib/store/admin";
import { readStoreCatalog } from "@/lib/store/file-catalog";
import { listPublicWorkspaceItems } from "@/lib/store/public-data";
import { filterWorkspaceProducts, managedWorkspaceItems, type WorkspaceProductItem } from "@/lib/store/workspace-product-list";
import { localePath } from "@/i18n/config";
import type { Locale } from "@/lib/store/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type ProductManagementQuery = { q?: string; state?: string };

const copy = {
  zh: {
    adminTitle: "商品管理", publicTitle: "商品目录",
    adminDescription: "浏览与管理合在同一列表；编辑商品、发布软件，或查看公开详情与下载。",
    publicDescription: "浏览已公开商品及可用下载。这里是公开目录，不代表已购买或已获得许可证。",
    add: "新增商品", stats: { "商品": "商品", "待发布资料": "待发布资料", "版本草稿": "版本草稿", "公开商品": "公开商品", "可下载软件": "可下载软件" },
    statsAria: "商品统计", filterAria: "筛选商品", searchPlaceholder: "搜索名称或商品标识", searchAria: "搜索商品", stateAria: "展示状态",
    all: "全部商品", published: "已上架", draft: "有资料草稿", filter: "筛选", clear: "清除筛选",
    noMatch: "没有符合条件的商品，请调整筛选。", noAdmin: "暂无商品，可以新增商品。", noPublic: "当前暂无公开商品。",
    online: "已上架", offline: "未上架", beta: "测试版", coming: "即将推出", released: "正式版", pending: "有待发布资料",
    noTagline: "尚未填写商品简介", liveName: "线上名称", editingCopy: "当前卡片显示编辑中的资料。",
    versions: (total: number, drafts: number, published: number) => `${total} 个版本 · ${drafts} 个版本待发布 · ${published} 个已发布`,
    publicVersions: (count: number) => `${count} 个已发布软件版本`,
    noIntro: "商品介绍尚未上架；软件发布状态独立管理。", noDownload: "暂无可下载的软件包，可先查看商品介绍。",
    edit: "编辑商品", software: "软件版本", viewOnline: "查看线上", viewDetails: "查看商品详情", downloads: "软件下载",
  },
  en: {
    adminTitle: "Product management", publicTitle: "Product catalog",
    adminDescription: "Browse and manage products in one list. Edit product information, publish software, or open the public page and downloads.",
    publicDescription: "Browse published products and available downloads. This public catalog does not imply a purchase or license.",
    add: "Add product", stats: { "商品": "Products", "待发布资料": "Pending product drafts", "版本草稿": "Release drafts", "公开商品": "Published products", "可下载软件": "Downloads available" },
    statsAria: "Product statistics", filterAria: "Filter products", searchPlaceholder: "Search name or product slug", searchAria: "Search products", stateAria: "Visibility",
    all: "All products", published: "Published", draft: "Has product draft", filter: "Filter", clear: "Clear filters",
    noMatch: "No products match these filters.", noAdmin: "No products yet. Add a product to get started.", noPublic: "No public products are available yet.",
    online: "Published", offline: "Not published", beta: "Beta", coming: "Coming soon", released: "Released", pending: "Pending product changes",
    noTagline: "No product tagline yet", liveName: "Live name", editingCopy: "This card is showing the current editing draft.",
    versions: (total: number, drafts: number, published: number) => `${total} versions · ${drafts} draft · ${published} published`,
    publicVersions: (count: number) => `${count} published software versions`,
    noIntro: "The product introduction is not published yet; software publication is managed separately.", noDownload: "No downloadable package is available yet. You can still view the product introduction.",
    edit: "Edit product", software: "Software versions", viewOnline: "View live", viewDetails: "View product", downloads: "Download software",
  },
} as const;

// Shared server-rendered list, not an authorization fallback. Management projection
// is chosen only after checking the real session; public data has no draft fields.
export async function ProductManagement({ searchParams, locale = "zh" }: { searchParams: Promise<ProductManagementQuery>; locale?: Locale }) {
  const administrator = Boolean(await getStoreAdmin());
  const query = await searchParams;
  const text = copy[locale];
  let items: WorkspaceProductItem[];
  if (administrator) {
    const { catalog } = await readStoreCatalog();
    items = managedWorkspaceItems(catalog, locale);
  } else {
    items = await listPublicWorkspaceItems(locale);
  }
  const { q, state, filtered, stats } = filterWorkspaceProducts(items, query, administrator);
  return <section className="min-w-0" data-testid="workspace-product-list" data-list-access={administrator ? "management" : "public"} data-page-locale={locale}>
    <div data-testid={administrator ? "product-management" : "public-product-list"}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-xl font-semibold">{administrator ? text.adminTitle : text.publicTitle}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{administrator ? text.adminDescription : text.publicDescription}</p></div>
        {administrator && <Button asChild><Link href="/admin/products/new"><Plus className="mr-2 h-4 w-4" aria-hidden="true" />{text.add}</Link></Button>}
      </header>
      <div className={`mt-4 grid gap-3 ${administrator ? "grid-cols-3" : "grid-cols-2"}`} aria-label={text.statsAria} data-testid="product-list-stats">
        {stats.map(([label, count]) => <div key={label} className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{text.stats[label as keyof typeof text.stats] ?? label}</p><p className="mt-1 text-2xl font-semibold">{count}</p></div>)}
      </div>
      <form action="/dashboard" className="my-4 flex flex-wrap gap-2" aria-label={text.filterAria}>
        <input type="hidden" name="view" value="products" />
        <Input name="q" defaultValue={q} placeholder={text.searchPlaceholder} aria-label={text.searchAria} className="max-w-md" maxLength={200} />
        {administrator && <select name="state" defaultValue={state} aria-label={text.stateAria} className="h-10 rounded-md border bg-background px-3"><option value="all">{text.all}</option><option value="published">{text.published}</option><option value="draft">{text.draft}</option></select>}
        <Button type="submit" variant="outline">{text.filter}</Button>
        {(q || state !== "all") && <Button asChild variant="ghost"><Link href="/dashboard?view=products">{text.clear}</Link></Button>}
      </form>
      {!filtered.length && <p className="rounded-xl border p-6 text-muted-foreground" role="status">{q || state !== "all" ? text.noMatch : administrator ? text.noAdmin : text.noPublic}</p>}
      <div className="grid gap-4 lg:grid-cols-2" data-testid="dashboard-products">{filtered.map(product => {
        const editHref = `/admin/products/${encodeURIComponent(product.slug)}`;
        const publicHref = localePath(locale, `/products/${encodeURIComponent(product.slug)}`);
        const management = administrator ? product.management : undefined;
        const stage = product.status === "beta" ? text.beta : product.status === "coming-soon" ? text.coming : text.released;
        return <article key={product.slug} id={`product-${product.slug}`} data-product-slug={product.slug} className="min-w-0 rounded-xl border p-4">
          <div className="flex items-start gap-3">
            {product.iconUrl ? <img src={product.iconUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl border object-contain" /> : <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted"><ImageIcon className="h-6 w-6 text-muted-foreground" aria-hidden="true" /></span>}
            <div className="min-w-0 flex-1"><h3 className="break-words text-lg font-semibold"><Link href={administrator ? editHref : publicHref}>{product.name}</Link></h3><p className="mt-1 break-all text-xs text-muted-foreground">{product.slug}</p>
              <p className="mt-2 text-sm">{product.published ? text.online : text.offline}<span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs" data-product-stage>{stage}</span>{management?.pendingProduct && product.published ? ` · ${text.pending}` : ""}</p>
            </div>
          </div>
          <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">{product.tagline || text.noTagline}</p>
          {management?.publishedName && management.publishedName !== product.name && <p className="mt-1 break-words text-xs text-muted-foreground">{text.liveName}{locale === "zh" ? "：" : ": "}{management.publishedName}{locale === "zh" ? "；" : "; "}{text.editingCopy}</p>}
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"><Package className="h-4 w-4" aria-hidden="true" />
            {management ? text.versions(management.totalVersions, management.draftVersions, product.publishedVersions) : text.publicVersions(product.publishedVersions)}
          </p>
          {!product.downloadable && <p className="mt-2 text-xs text-muted-foreground">{!product.published ? text.noIntro : text.noDownload}</p>}
          <div className="mt-4 flex flex-wrap gap-2">
            {administrator && <><Button asChild><Link href={editHref}>{text.edit}</Link></Button><Button asChild variant="outline"><Link href={`${editHref}?tab=versions`}>{text.software}</Link></Button></>}
            {product.published && <Button asChild variant={administrator ? "ghost" : "outline"}><Link href={publicHref} target={administrator ? "_blank" : undefined} rel={administrator ? "noopener noreferrer" : undefined}>{administrator ? text.viewOnline : text.viewDetails}<ArrowUpRight className="ml-1 h-4 w-4" aria-hidden="true" /></Link></Button>}
            {product.downloadable && <Button asChild variant={administrator ? "outline" : "default"}><Link data-product-download href={`${publicHref}#downloads`} target={administrator ? "_blank" : undefined} rel={administrator ? "noopener noreferrer" : undefined}><Download className="mr-1 h-4 w-4" aria-hidden="true" />{text.downloads}</Link></Button>}
          </div>
        </article>;
      })}</div>
    </div>
  </section>;
}
