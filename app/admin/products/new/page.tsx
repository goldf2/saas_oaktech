import Link from "next/link";
import { getStoreAdmin, listAdminProducts } from "@/lib/store/admin";
import { getStoreProductTemplate } from "@/lib/store/file-catalog";
import { AdminAccessNotice } from "@/components/admin/access-notice";
import { ProductForm } from "@/components/admin/product-form";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ template?: string }> }) {
  if (!(await getStoreAdmin())) return <AdminAccessNotice />;
  const [query, products] = await Promise.all([searchParams, listAdminProducts()]);
  const template = query.template ? getStoreProductTemplate(query.template) : undefined;
  const existing = template && products.find((product) => product.slug === template.slug);
  return (
    <section className="container max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm text-primary">商品后台</p><h1 className="mt-2 text-3xl font-bold">新增商品</h1></div>
        <Button asChild variant="outline"><Link href="/admin/products">返回商品管理</Link></Button>
      </div>
      <p className="mt-4 text-muted-foreground">先添加商品资料，再单独上传和发布软件版本。新商品默认保存为草稿；公开展示与软件包发布是两项独立操作。</p>
      <nav className="my-6 flex flex-wrap gap-3 text-sm" aria-label="商品资料模板">
        <Link className="rounded-lg border px-4 py-3 hover:bg-muted" href="/admin/products/new">空白商品</Link>
        <Link className="rounded-lg border px-4 py-3 hover:bg-muted" href="/admin/products/new?template=open-play">open play · Auth 认证管理工具</Link>
        <Link className="rounded-lg border px-4 py-3 hover:bg-muted" href="/admin/products/new?template=chanxu-tradingview">缠序 · TradingView 缠论工具</Link>
      </nav>
      {existing ? <div className="rounded-lg border p-6"><p>该商品已存在，请编辑已有商品，避免重复创建。</p><Link className="mt-3 inline-block text-primary underline" href={`/admin/products#product-${existing.slug}`}>编辑 {existing.name_zh}</Link></div> : <ProductForm key={template?.slug ?? "blank"} product={template} />}
    </section>
  );
}
