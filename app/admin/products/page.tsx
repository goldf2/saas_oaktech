import Link from "next/link";
import { ProductForm } from "@/components/admin/product-form";
import { AdminAccessNotice } from "@/components/admin/access-notice";
import { getStoreAdmin, listAdminProducts } from "@/lib/store/admin";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  if (!(await getStoreAdmin())) return <AdminAccessNotice />;
  const [products, query] = await Promise.all([listAdminProducts(), searchParams]);
  return (
    <div className="container px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-primary">Store administration</p><h1 className="text-3xl font-bold">商品发布与管理</h1></div>
        <div className="flex flex-wrap gap-3"><Button asChild><Link href="/admin/products/new">新增商品</Link></Button><Button asChild variant="outline"><Link href="/admin/releases">软件版本发布</Link></Button></div>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">商品页负责名称、介绍和展示状态；软件包与版本说明请在「软件版本发布」中管理。</p>
      {query.saved === "1" && <p role="status" className="mt-4 rounded-md border p-3 text-sm">商品已保存。</p>}
      <div className="mt-8 space-y-6">
        {products.length === 0 && <p className="rounded-lg border p-5 text-muted-foreground">还没有商品，点击「新增商品」创建第一件商品。</p>}
        {products.map((product) => <details key={product.id} id={`product-${product.slug}`} className="rounded-lg border p-5"><summary className="cursor-pointer font-semibold">{product.name_zh} · {product.visibility === "published" ? "公开" : "草稿"}</summary><div className="mt-5"><ProductForm product={product} /></div></details>)}
      </div>
    </div>
  );
}
