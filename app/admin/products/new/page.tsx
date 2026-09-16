import Link from "next/link";
import { getStoreAdmin, listAdminProducts } from "@/lib/store/admin";
import { getStoreProductTemplate } from "@/lib/store/file-catalog";
import { AdminAccessNotice } from "@/components/admin/access-notice";
import { ProductWorkspace } from "@/components/admin/product-workspace";
import type { AdminStoreProductRow } from "@/lib/store/types";

export const dynamic = "force-dynamic";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  if (!(await getStoreAdmin())) return <AdminAccessNotice />;
  const [query, products] = await Promise.all([searchParams, listAdminProducts()]);
  const template = query.template ? getStoreProductTemplate(query.template) : undefined;
  // Pass a stable server-created value. The client editor must not recreate its
  // initial object on every keystroke when this is a new, blank product.
  const initialProduct: AdminStoreProductRow = template ?? {
    id: "", slug: "", category_slug: "desktop-apps", status: "beta", visibility: "draft",
    name_zh: "", name_en: "", tagline_zh: "", tagline_en: "",
    description_zh: "", description_en: "", icon_url: "", hero_image_url: "",
    gallery_urls: [], supported_platforms: [], featured: false,
  };
  const existing = template && products.find(product => product.slug === template.slug);
  if (existing) return <section className="container max-w-5xl px-4 py-12"><h1 className="text-3xl font-semibold">该商品已存在</h1><p className="mt-4 text-muted-foreground">请进入对应商品工作台，不重复新建。</p><Link className="mt-5 inline-block text-primary underline" href={`/admin/products/${existing.slug}`}>编辑 {existing.name_zh}</Link></section>;
  return <>
    <nav className="container max-w-7xl px-4 pt-7" aria-label="商品资料模板"><div className="flex flex-wrap gap-3 text-sm"><Link className="rounded-lg border px-3 py-2" href="/admin/products/new">空白商品</Link><Link className="rounded-lg border px-3 py-2" href="/admin/products/new?template=open-play">Auth 工具模板</Link><Link className="rounded-lg border px-3 py-2" href="/admin/products/new?template=chanxu-tradingview">缠序工具模板</Link></div><p className="mt-3 text-sm text-muted-foreground">先填写名称和商品标识，保存草稿后即可在同一工作台上传图文和管理软件版本。</p></nav>
    <ProductWorkspace key={template?.slug ?? "new"} product={initialProduct} />
  </>;
}
