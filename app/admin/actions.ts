"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { appendStoreAudit, mutateStoreCatalog, newCatalogId } from "@/lib/store/file-catalog";
import { isManagedAssetUrl, isReleaseVersion, isStoreSlug } from "@/lib/store/policy";
import { requireStoreAdmin } from "@/lib/store/admin";
import { prepareUpdaterManifests, removeStoredFile } from "@/lib/store/storage";
import type { AdminActionResult, AdminProductReleaseRow, AdminStoreProductRow, ProductStatus } from "@/lib/store/types";

import { releaseErrorMessages } from "@/lib/store/release-errors";

const actionMessages: Record<string, string> = {
  ...releaseErrorMessages,
  STORE_ADMIN_FORBIDDEN: "没有管理权限，请重新登录管理员账户。",
  INVALID_PRODUCT_SLUG: "商品标识和分类只能使用小写字母、数字与连字符。",
  INVALID_PRODUCT_STATUS: "请选择有效的商品状态。",
  INVALID_PRODUCT_VISIBILITY: "请选择草稿或公开状态。",
  INVALID_PRODUCT_ASSET_URL: "图片地址必须是本站路径或 HTTPS 地址。",
  BILINGUAL_PRODUCT_CONTENT_REQUIRED: "请填写完整的中英文商品内容。",
  STORE_PRODUCT_NOT_FOUND: "商品不存在，请刷新后重试。",
  STORE_PRODUCT_SLUG_EXISTS: "该商品标识已存在，请编辑已有商品或使用新的标识。",
  PRODUCT_SLUG_IMMUTABLE: "已有商品的标识不能修改，避免破坏版本和下载链接。",
  INVALID_RELEASE_IDENTITY: "请选择有效的商品和发布渠道。",
  INVALID_RELEASE_VERSION: "版本号格式不正确，例如 1.2.3、1.2.3-beta.1 或 0.6.6.10。",
  BILINGUAL_RELEASE_CONTENT_REQUIRED: "请填写完整的中英文版本标题与说明。",
  PRODUCT_RELEASE_ALREADY_EXISTS: "该商品、版本和渠道已存在，请编辑已有草稿。",
  RELEASE_IDENTITY_IMMUTABLE: "已保存草稿的商品、版本和渠道不能修改，请创建新草稿。",
  PUBLISHED_RELEASE_IS_IMMUTABLE: "已发布版本不能直接编辑。",
  DRAFT_RELEASE_NOT_FOUND: "草稿不存在或已发布，请刷新页面。",
  DRAFT_RELEASE_CHANGED: "校验期间草稿发生变化，请刷新并重新核对后发布。",
  PUBLISHED_RELEASE_NOT_FOUND: "已发布版本不存在，请刷新页面。",
  RELEASE_ARTIFACT_REQUIRED: "请至少上传一个软件包后再发布。",
  ARTIFACT_SIZE_MISMATCH: "软件包大小与记录不一致，未发布，请检查文件。",
  ARTIFACT_SHA512_MISMATCH: "软件包 SHA-512 校验失败，未发布，请检查文件。",
  DELETE_CONFIRMATION_MISMATCH: "请输入完全一致的版本号以确认删除。",
  RELEASE_STORAGE_ROOT_REQUIRED: "尚未配置发布持久存储，无法保存或发布。",
};

async function runAdminAction(operation: () => Promise<string>): Promise<AdminActionResult> {
  let destination: string;
  try {
    destination = await operation();
  } catch (error) {
    const code = error instanceof Error ? error.message.split(":")[0] : "";
    if (actionMessages[code]) return { code, error: actionMessages[code] };
    throw error;
  }
  redirect(destination);
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function refreshStore(productSlug?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/en");
  revalidatePath("/zh");
  revalidatePath("/products");
  revalidatePath("/categories", "layout");
  revalidatePath("/admin/software");
  revalidatePath("/admin/products");
  revalidatePath("/admin/releases");
  if (productSlug) {
    revalidatePath(`/products/${productSlug}`);
    revalidatePath(`/products/${productSlug}/releases`);
    revalidatePath(`/en/products/${productSlug}`);
    revalidatePath(`/zh/products/${productSlug}`);
    revalidatePath(`/en/products/${productSlug}/releases`);
    revalidatePath(`/zh/products/${productSlug}/releases`);
    revalidatePath(`/products/${productSlug}/install`);
  }
}

export async function saveProductAction(formData: FormData): Promise<AdminActionResult> {
  return runAdminAction(async () => {
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
      const index = existingId ? catalog.products.findIndex((item) => item.id === existingId) : -1;
      if (existingId && index < 0) throw new Error("STORE_PRODUCT_NOT_FOUND");
      if (index >= 0 && catalog.products[index].slug !== slug) throw new Error("PRODUCT_SLUG_IMMUTABLE");
      if (catalog.products.some((item) => item.slug === slug && item.id !== existingId)) throw new Error("STORE_PRODUCT_SLUG_EXISTS");
      if (index >= 0) catalog.products[index] = product;
      else catalog.products.push(product);
    });
    await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email, action: "store.product.saved", targetType: "store_product", targetId: product.id, metadata: { slug, visibility, status } });
    refreshStore(slug);
    return "/admin/products?saved=1";
  });
}

// Shared persistence: both legacy navigation and in-workspace saves use the same
// authorization, identity, immutable-release and metadata validation.
async function persistReleaseDraft(formData: FormData) {
  const admin = await requireStoreAdmin();
  const existingId = text(formData, "id");
  const id = existingId || newCatalogId();
  const productSlug = text(formData, "product_slug");
  const version = text(formData, "version");
  const channel = text(formData, "channel");
  if (!isStoreSlug(productSlug) || !isStoreSlug(channel)) throw new Error("INVALID_RELEASE_IDENTITY");
  if (!isReleaseVersion(version)) throw new Error("INVALID_RELEASE_VERSION");
  if (["title_en", "title_zh", "notes_en", "notes_zh"].some((field) => !text(formData, field))) throw new Error("BILINGUAL_RELEASE_CONTENT_REQUIRED");

  await mutateStoreCatalog((catalog) => {
    if (!catalog.products.some((product) => product.slug === productSlug)) throw new Error("STORE_PRODUCT_NOT_FOUND");
    const index = catalog.releases.findIndex((item) => item.id === id);
    const existing = index >= 0 ? catalog.releases[index] : null;
    if (existingId && !existing) throw new Error("DRAFT_RELEASE_NOT_FOUND");
    if (existing?.status === "published") throw new Error("PUBLISHED_RELEASE_IS_IMMUTABLE");
    if (existing && (existing.product_slug !== productSlug || existing.version !== version || existing.channel !== channel)) {
      throw new Error("RELEASE_IDENTITY_IMMUTABLE");
    }
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
      source_commit: existing?.source_commit ?? null,
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
  revalidatePath(`/admin/products/${productSlug}`);
  return { releaseId: id, productSlug };
}

export async function saveReleaseDraftAction(formData: FormData): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    const result = await persistReleaseDraft(formData);
    return `/admin/releases?saved=1&release=${encodeURIComponent(result.releaseId)}`;
  });
}

// No redirect through the legacy global route: that unmounted the product editor
// and discarded unrelated, unsaved product copy. Return only a verified identity.
export async function saveReleaseDraftInWorkspaceAction(formData: FormData): Promise<AdminActionResult> {
  try { return await persistReleaseDraft(formData); }
  catch (error) {
    const code = error instanceof Error ? error.message.split(":")[0] : "";
    if (actionMessages[code]) return { code, error: actionMessages[code] };
    throw error;
  }
}

export async function publishReleaseAction(formData: FormData): Promise<AdminActionResult> {
  return runAdminAction(async () => {
    const admin = await requireStoreAdmin();
    const releaseId = text(formData, "release_id");
    const { catalog } = await import("@/lib/store/file-catalog").then((module) => module.readStoreCatalog());
    const release = catalog.releases.find((item) => item.id === releaseId);
    if (!release || release.status !== "draft") throw new Error("DRAFT_RELEASE_NOT_FOUND");
    const publishedAt = new Date().toISOString();
    await prepareUpdaterManifests({ ...release, published_at: publishedAt });
    await mutateStoreCatalog((next) => {
      const target = next.releases.find((item) => item.id === releaseId);
      if (!target || target.status !== "draft" || JSON.stringify(target) !== JSON.stringify(release)) throw new Error("DRAFT_RELEASE_CHANGED");
      for (const item of next.releases) {
        if (item.product_slug === target.product_slug && item.channel === target.channel) item.is_current = false;
      }
      target.status = "published";
      target.is_current = true;
      target.published_at = publishedAt;
    });
    await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email, action: "store.release.published", targetType: "product_release", targetId: releaseId, metadata: { productSlug: release.product_slug, version: release.version, channel: release.channel } });
    refreshStore(release.product_slug);
    return `/admin/releases?published=1&release=${encodeURIComponent(releaseId)}`;
  });
}

export async function unpublishReleaseAction(formData: FormData): Promise<AdminActionResult> {
  return runAdminAction(async () => {
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
    return "/admin/releases?unpublished=1";
  });
}

export async function deleteReleaseAction(formData: FormData): Promise<AdminActionResult> {
  return runAdminAction(async () => {
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
    return "/admin/releases?deleted=1";
  });
}
