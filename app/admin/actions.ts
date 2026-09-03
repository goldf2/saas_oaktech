"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { appendStoreAudit, mutateStoreCatalog, newCatalogId } from "@/lib/store/file-catalog";
import { isManagedAssetUrl, isStoreSlug } from "@/lib/store/policy";
import { requireStoreAdmin } from "@/lib/store/admin";
import { prepareUpdaterManifests, removeStoredFile } from "@/lib/store/storage";
import type { AdminProductReleaseRow, AdminStoreProductRow, ProductStatus } from "@/lib/store/types";

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function refreshStore(productSlug?: string) {
  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/admin/releases");
  if (productSlug) {
    revalidatePath(`/products/${productSlug}`);
    revalidatePath(`/products/${productSlug}/releases`);
    revalidatePath(`/en/products/${productSlug}`);
    revalidatePath(`/zh/products/${productSlug}`);
  }
}

export async function saveProductAction(formData: FormData) {
  const admin = await requireStoreAdmin();
  const slug = text(formData, "slug");
  const status = text(formData, "status") as ProductStatus;
  const visibility = text(formData, "visibility") as "draft" | "published";
  const iconUrl = text(formData, "icon_url");
  const heroImageUrl = text(formData, "hero_image_url");
  if (!isStoreSlug(slug) || !isStoreSlug(text(formData, "category_slug"))) throw new Error("INVALID_PRODUCT_SLUG");
  if (!(["beta", "released", "coming-soon"] as string[]).includes(status)) throw new Error("INVALID_PRODUCT_STATUS");
  if (!(["draft", "published"] as string[]).includes(visibility)) throw new Error("INVALID_PRODUCT_VISIBILITY");
  if (!isManagedAssetUrl(iconUrl) || !isManagedAssetUrl(heroImageUrl)) throw new Error("INVALID_PRODUCT_ASSET_URL");

  const required = ["name_en", "name_zh", "tagline_en", "tagline_zh", "description_en", "description_zh"];
  if (required.some((field) => !text(formData, field))) throw new Error("BILINGUAL_PRODUCT_CONTENT_REQUIRED");
  const existingId = text(formData, "id");
  const product: AdminStoreProductRow = {
    id: existingId || newCatalogId(),
    slug,
    category_slug: text(formData, "category_slug"),
    status,
    visibility,
    name_en: text(formData, "name_en"),
    name_zh: text(formData, "name_zh"),
    tagline_en: text(formData, "tagline_en"),
    tagline_zh: text(formData, "tagline_zh"),
    description_en: text(formData, "description_en"),
    description_zh: text(formData, "description_zh"),
    icon_url: iconUrl,
    hero_image_url: heroImageUrl,
    supported_platforms: text(formData, "supported_platforms").split(",").map((item) => item.trim()).filter(Boolean),
    featured: formData.get("featured") === "on",
  };
  await mutateStoreCatalog((catalog) => {
    const index = catalog.products.findIndex((item) => item.slug === slug);
    if (index >= 0) catalog.products[index] = product;
    else catalog.products.push(product);
  });
  await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email, action: "store.product.saved", targetType: "store_product", targetId: product.id, metadata: { slug, visibility, status } });
  refreshStore(slug);
  redirect("/admin/products?saved=1");
}

export async function saveReleaseDraftAction(formData: FormData) {
  const admin = await requireStoreAdmin();
  const id = text(formData, "id") || newCatalogId();
  const productSlug = text(formData, "product_slug");
  const version = text(formData, "version");
  const channel = text(formData, "channel");
  if (!isStoreSlug(productSlug) || !isStoreSlug(channel) || !version || /[\\/]/.test(version)) throw new Error("INVALID_RELEASE_IDENTITY");
  if (["title_en", "title_zh", "notes_en", "notes_zh"].some((field) => !text(formData, field))) throw new Error("BILINGUAL_RELEASE_CONTENT_REQUIRED");

  await mutateStoreCatalog((catalog) => {
    if (!catalog.products.some((product) => product.slug === productSlug)) throw new Error("STORE_PRODUCT_NOT_FOUND");
    const index = catalog.releases.findIndex((item) => item.id === id);
    const existing = index >= 0 ? catalog.releases[index] : null;
    if (existing?.status === "published") throw new Error("PUBLISHED_RELEASE_IS_IMMUTABLE");
    if (catalog.releases.some((item) => item.id !== id && item.product_slug === productSlug && item.version === version && item.channel === channel)) {
      throw new Error("PRODUCT_RELEASE_ALREADY_EXISTS");
    }
    const release: AdminProductReleaseRow = {
      id,
      product_slug: productSlug,
      version,
      channel,
      status: "draft",
      is_current: false,
      published_at: null,
      title_en: text(formData, "title_en"),
      title_zh: text(formData, "title_zh"),
      notes_en: text(formData, "notes_en"),
      notes_zh: text(formData, "notes_zh"),
      release_artifacts: existing?.release_artifacts ?? [],
    };
    if (index >= 0) catalog.releases[index] = release;
    else catalog.releases.push(release);
  });
  await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email, action: "store.release.draft_saved", targetType: "product_release", targetId: id, metadata: { productSlug, version, channel } });
  refreshStore(productSlug);
  redirect("/admin/releases?saved=1");
}

export async function publishReleaseAction(formData: FormData) {
  const admin = await requireStoreAdmin();
  const releaseId = text(formData, "release_id");
  const { catalog } = await import("@/lib/store/file-catalog").then((module) => module.readStoreCatalog());
  const release = catalog.releases.find((item) => item.id === releaseId);
  if (!release || release.status !== "draft") throw new Error("DRAFT_RELEASE_NOT_FOUND");
  const publishedAt = new Date().toISOString();
  await prepareUpdaterManifests({ ...release, published_at: publishedAt });
  await mutateStoreCatalog((next) => {
    const target = next.releases.find((item) => item.id === releaseId);
    if (!target || target.status !== "draft") throw new Error("DRAFT_RELEASE_CHANGED");
    for (const item of next.releases) {
      if (item.product_slug === target.product_slug && item.channel === target.channel) item.is_current = false;
    }
    target.status = "published";
    target.is_current = true;
    target.published_at = publishedAt;
  });
  await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email, action: "store.release.published", targetType: "product_release", targetId: releaseId, metadata: { productSlug: release.product_slug, version: release.version, channel: release.channel } });
  refreshStore(release.product_slug);
  redirect("/admin/releases?published=1");
}

export async function unpublishReleaseAction(formData: FormData) {
  const admin = await requireStoreAdmin();
  const releaseId = text(formData, "release_id");
  let productSlug = "";
  await mutateStoreCatalog((catalog) => {
    const release = catalog.releases.find((item) => item.id === releaseId);
    if (!release || release.status !== "published") throw new Error("PUBLISHED_RELEASE_NOT_FOUND");
    productSlug = release.product_slug;
    release.status = "draft";
    release.is_current = false;
    release.published_at = null;
  });
  await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email, action: "store.release.unpublished", targetType: "product_release", targetId: releaseId });
  refreshStore(productSlug);
  redirect("/admin/releases?unpublished=1");
}

export async function deleteReleaseAction(formData: FormData) {
  const admin = await requireStoreAdmin();
  const releaseId = text(formData, "release_id");
  const confirmVersion = text(formData, "confirm_version");
  let removed: AdminProductReleaseRow | undefined;
  await mutateStoreCatalog((catalog) => {
    const index = catalog.releases.findIndex((item) => item.id === releaseId);
    if (index < 0 || catalog.releases[index].status !== "draft") throw new Error("DRAFT_RELEASE_NOT_FOUND");
    if (catalog.releases[index].version !== confirmVersion) throw new Error("DELETE_CONFIRMATION_MISMATCH");
    [removed] = catalog.releases.splice(index, 1);
  });
  if (removed) await Promise.all(removed.release_artifacts.map((artifact) => removeStoredFile(artifact.storage_path)));
  await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email, action: "store.release.deleted", targetType: "product_release", targetId: releaseId });
  refreshStore(removed?.product_slug);
  redirect("/admin/releases?deleted=1");
}
