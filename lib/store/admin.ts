import "server-only";

import { createClient } from "@/utils/supabase/server";
import { isStoreAdmin } from "./policy";
import { readStoreCatalog } from "./file-catalog";

export type StoreAdmin = { id: string; email: string };

export async function getStoreAdmin(): Promise<StoreAdmin | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return null;

  const allowed = isStoreAdmin(user, {
    userIds: process.env.OAKTECH_ADMIN_USER_IDS,
    emails: process.env.OAKTECH_ADMIN_EMAILS,
  });
  return allowed ? { id: user.id, email: user.email } : null;
}

export async function requireStoreAdmin() {
  const admin = await getStoreAdmin();
  if (!admin) throw new Error("STORE_ADMIN_FORBIDDEN");
  return admin;
}

export async function listAdminProducts() {
  await requireStoreAdmin();
  return (await readStoreCatalog()).catalog.products;
}

export async function listAdminReleases() {
  await requireStoreAdmin();
  return (await readStoreCatalog()).catalog.releases;
}

export async function getAdminRelease(releaseId: string) {
  await requireStoreAdmin();
  const release = (await readStoreCatalog()).catalog.releases.find((item) => item.id === releaseId);
  if (!release) throw new Error("PRODUCT_RELEASE_NOT_FOUND");
  return release;
}
