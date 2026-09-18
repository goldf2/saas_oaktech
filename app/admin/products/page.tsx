import { redirect } from "next/navigation";
import { getStoreAdmin } from "@/lib/store/admin";
import { AdminAccessNotice } from "@/components/admin/access-notice";
import { workspaceProductsHref } from "@/lib/store/workspace-navigation";

export const dynamic = "force-dynamic";
// Legacy bookmarks keep their filters. Draft visibility still requires server authorization.
export default async function AdminProductsPage({ searchParams }: {
  searchParams: Promise<{ q?: string; state?: string }>;
}) {
  if (!(await getStoreAdmin())) return <AdminAccessNotice />;
  redirect(workspaceProductsHref(await searchParams));
}
