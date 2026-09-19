import { notFound } from "next/navigation";
import { getStoreAdmin } from "@/lib/store/admin";
import { readStoreCatalog } from "@/lib/store/file-catalog";
import { editableProduct, productToken, publicationToken, releasePublicationToken } from "@/lib/store/product-workspace";
import { ProductWorkspace } from "@/components/admin/product-workspace";
import { ProductReleases } from "@/components/admin/product-releases";
import { AdminAccessNotice } from "@/components/admin/access-notice";
import { getRequestLanguage } from "@/i18n/server";

export const dynamic = "force-dynamic";

type Query = { tab?: string; release?: string; saved?: string; unpublished?: string; deleted?: string };
export default async function ProductWorkspacePage({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<Query>;
}) {
  if (!(await getStoreAdmin())) return <AdminAccessNotice />;
  const [{ slug }, query, { catalog }, { locale }] = await Promise.all([params, searchParams, readStoreCatalog(), getRequestLanguage()]);
  const zh = locale === "zh";
  const product = editableProduct(catalog, slug);
  if (!product) notFound();
  const releases = catalog.releases.filter(row => row.product_slug === slug);
  return <ProductWorkspace key={product.id} product={product}
    editToken={productToken(catalog, slug)} publishToken={publicationToken(catalog, slug)}
    releasePublishToken={releasePublicationToken(catalog, slug)}
    publishedProduct={catalog.products.find(p => p.slug === slug && p.visibility === "published") ?? null}
    releases={releases} initialTab={query.tab} hasDraft={Boolean(catalog.productDrafts?.[slug])}
    releasePanel={<ProductReleases product={product} releases={releases} selectedRelease={query.release}
      notice={query.saved === "1" ? (zh ? "版本草稿已保存；上传文件后可单独确认软件发布，不会公开商品资料草稿。" : "Release draft saved. After uploading files, software can be published independently without publishing the product-information draft.") : query.unpublished === "1" ? (zh ? "版本已撤回为草稿。" : "The version was unpublished to draft.") : query.deleted === "1" ? (zh ? "版本草稿已删除。" : "The release draft was deleted.") : undefined} />} />;
}
