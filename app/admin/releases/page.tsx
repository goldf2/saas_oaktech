import { redirect } from "next/navigation";
import { AdminAccessNotice } from "@/components/admin/access-notice";
import { getStoreAdmin } from "@/lib/store/admin";
import { readStoreCatalog } from "@/lib/store/file-catalog";

export const dynamic = "force-dynamic";
// Compatibility entry only; software versions belong to their product, not a parallel editor.
export default async function AdminReleasesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (!(await getStoreAdmin())) return <AdminAccessNotice />;
  const [query, { catalog }] = await Promise.all([searchParams, readStoreCatalog()]);
  const release = query.release ? catalog.releases.find(row => row.id === query.release) : undefined;
  const product = catalog.products.find(row => row.slug === (release?.product_slug ?? query.product));
  if (!product) redirect("/admin/products");
  const params = new URLSearchParams({ tab: "versions" });
  if (release) params.set("release", release.id);
  for (const flag of ["saved", "published", "unpublished", "deleted"]) if (query[flag] === "1") params.set(flag, "1");
  redirect(`/admin/products/${encodeURIComponent(product.slug)}?${params}`);
}
