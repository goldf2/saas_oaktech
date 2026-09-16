import { notFound } from "next/navigation";
import { getStoreAdmin } from "@/lib/store/admin";
import { readStoreCatalog } from "@/lib/store/file-catalog";
import { editableProduct, productToken, publicationToken } from "@/lib/store/product-workspace";
import { ProductWorkspace } from "@/components/admin/product-workspace";
import { ProductReleases } from "@/components/admin/product-releases";
import { AdminAccessNotice } from "@/components/admin/access-notice";

export const dynamic = "force-dynamic";

type Query = { tab?: string; release?: string; saved?: string; unpublished?: string; deleted?: string };
export default async function ProductWorkspacePage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<Query>;
}) {
  if (!(await getStoreAdmin())) return <AdminAccessNotice />;
  const [{ slug }, query, { catalog }] = await Promise.all([params, searchParams, readStoreCatalog()]);
  const product = editableProduct(catalog, slug);
  if (!product) notFound();
  const releases = catalog.releases.filter(row => row.product_slug === slug);
  return <ProductWorkspace key={product.id} product={product}
    editToken={productToken(catalog, slug)} publishToken={publicationToken(catalog, slug)}
    releases={releases} initialTab={query.tab} hasDraft={Boolean(catalog.productDrafts?.[slug])}
    releasePanel={<ProductReleases product={product} releases={releases} selectedRelease={query.release}
      notice={query.saved === "1" ? "版本草稿已保存；上传文件后到「预览与发布」统一确认。" : query.unpublished === "1" ? "版本已撤回为草稿。" : query.deleted === "1" ? "版本草稿已删除。" : undefined} />} />;
}
