import "server-only";

import { getCurrentUser } from "@/lib/auth";
import { isStoreAdmin } from "./policy";
import { readStoreCatalog } from "./file-catalog";

export type StoreAdmin = { id: string; email: string };

export async function getStoreAdmin(): Promise<StoreAdmin | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const allowed = isStoreAdmin(user, {
    userIds: process.env.OAKTECH_ADMIN_USER_IDS,
    subjects: process.env.OAKTECH_ADMIN_SUBJECTS,
    emails: process.env.OAKTECH_ADMIN_EMAILS,
  });
  const auditIdentity = user.email ?? user.name ?? user.subject ?? user.id;
  return allowed ? { id: user.id, email: auditIdentity } : null;
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
