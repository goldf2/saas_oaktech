"use server";

import { revalidatePath } from "next/cache";
import { requireStoreAdmin } from "@/lib/store/admin";
import { appendStoreAudit, readStoreCatalog } from "@/lib/store/file-catalog";
import { productToken, publicationToken, releasePublicationToken, publishProductDraft, publishSoftwareReleases, saveProductDraft } from "@/lib/store/product-workspace";
import type { AdminStoreProductRow, ProductEditorResult } from "@/lib/store/types";

import { videoMessages, normalizeProductVideos } from "@/lib/store/product-videos";

const messages: Record<string, string> = {
  ...videoMessages,
  STORE_ADMIN_FORBIDDEN: "当前账号没有商品管理权限，请重新登录管理员账号。",
  STORE_PRODUCT_NOT_FOUND: "商品不存在，请返回商品列表。",
  STORE_PRODUCT_SLUG_EXISTS: "商品标识已存在，请编辑已有商品。",
  INVALID_PRODUCT_SLUG: "商品标识和分类只能使用小写字母、数字和连字符。",
  INVALID_PRODUCT_STATUS: "请选择有效的软件状态。",
  PRODUCT_FIELD_INVALID: "商品资料格式不正确或内容超长。",
  PRODUCT_GALLERY_LIMIT: "最多添加8张产品截图。",
  INVALID_PRODUCT_ASSET_URL: "图片只能使用本站路径或HTTPS地址。",
  PRODUCT_IDENTITY_IMMUTABLE: "商品标识不能更改，请刷新后重试。",
  PRODUCT_EDIT_CONFLICT: "商品已在其他页面修改，请刷新并核对后再保存。",
  PRODUCT_PUBLICATION_CONFLICT: "商品资料已变化，请刷新商品预览再发布；软件版本没有改变。",
  RELEASE_PUBLICATION_CONFLICT: "软件版本或文件已变化，请刷新软件预览再发布；商品资料没有改变。",
  PUBLICATION_SCOPE_SEPARATE: "商品资料和软件版本已改为独立发布，请刷新页面后分别确认。",
  RELEASE_CONFIRMATION_REQUIRED: "请先确认本次只发布选中的软件版本。",
  PRODUCT_PUBLICATION_INCOMPLETE: "发布前请补齐中文名称、简介、详情、图标和封面。",
  PRODUCT_RELEASE_SCOPE: "选中的版本不属于此商品，或已经发布。",
  PRODUCT_CHANNEL_CONFLICT: "同一渠道一次只能选择一个当前版本。",
  PRODUCT_IMAGE_SCOPE: "请使用属于当前商品的上传图片。",
  PRODUCT_IMAGE_MISSING: "图片文件缺失或已变化，请重新上传。",
  RELEASE_ARTIFACT_REQUIRED: "选中的版本尚无软件包，请先上传或取消选择。",
  ARTIFACT_SIZE_MISMATCH: "软件包大小校验失败，本次软件版本未发布；商品资料未改动。",
  ARTIFACT_SHA512_MISMATCH: "软件包SHA-512校验失败，本次软件版本未发布；商品资料未改动。",
  PRODUCT_CONFIRMATION_REQUIRED: "请先勾选发布确认。",
};
const text = (form: FormData, key: string) => String(form.get(key) ?? "").trim();
function failure(error: unknown): ProductEditorResult {
  const code = error instanceof Error ? error.message.split(":")[0] : "PRODUCT_SAVE_FAILED";
  return { error: messages[code] ?? "操作未完成，请核对资料、文件和服务状态后重试。", code: messages[code] ? code : "PRODUCT_SAVE_FAILED" };
}
function refresh(slug: string) {
  for (const path of ["/admin", "/admin/products", `/admin/products/${slug}`, "/dashboard", "/en", "/zh", `/en/products/${slug}`, `/zh/products/${slug}`, `/en/products/${slug}/releases`, `/zh/products/${slug}/releases`]) revalidatePath(path);
  revalidatePath("/categories", "layout");
}

export async function saveWorkspaceAction(form: FormData): Promise<ProductEditorResult> {
  try {
    const admin = await requireStoreAdmin();
    let gallery: unknown;
    try { gallery = JSON.parse(text(form, "gallery_urls") || "[]"); } catch { throw new Error("PRODUCT_FIELD_INVALID"); }
    let videos;
    if (form.has("videos")) {
      let raw: unknown;
      try { raw = JSON.parse(text(form, "videos")); } catch { throw new Error("PRODUCT_VIDEO_INVALID"); }
      videos = normalizeProductVideos(raw);
    }
    const input: AdminStoreProductRow = {
      id: text(form, "id"), slug: text(form, "slug"), category_slug: text(form, "category_slug"),
      status: text(form, "status") as AdminStoreProductRow["status"], visibility: "draft",
      name_zh: text(form, "name_zh"), name_en: text(form, "name_en"),
      tagline_zh: text(form, "tagline_zh"), tagline_en: text(form, "tagline_en"),
      description_zh: text(form, "description_zh"), description_en: text(form, "description_en"),
      icon_url: text(form, "icon_url"), hero_image_url: text(form, "hero_image_url"),
      gallery_urls: gallery as string[],
      ...(videos !== undefined ? { videos } : {}),
      supported_platforms: text(form, "supported_platforms").split(",").map(value => value.trim()).filter(Boolean),
      featured: form.get("featured") === "on",
    };
    if (!input.name_zh) throw new Error("PRODUCT_FIELD_INVALID");
    const saved = await saveProductDraft(input, text(form, "edit_token"));
    let warning: string | undefined;
    try { await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email, action: "store.product.draft_saved", targetType: "store_product", targetId: saved.id, metadata: { slug: saved.slug, revision: saved.revision } }); }
    catch { warning = "草稿已保存，但审计写入异常，请检查存储，不要重复创建。"; }
    const { catalog } = await readStoreCatalog();
    refresh(saved.slug);
    return { ok: true, slug: saved.slug, editToken: productToken(catalog, saved.slug), publishToken: publicationToken(catalog, saved.slug), warning };
  } catch (error) { return failure(error); }
}

export async function publishWorkspaceAction(form: FormData): Promise<ProductEditorResult> {
  try {
    const admin = await requireStoreAdmin();
    if (form.get("confirm") !== "on") throw new Error("PRODUCT_CONFIRMATION_REQUIRED");
    const slug = text(form, "slug");
    const ids = form.getAll("release_id").map(String);
    await publishProductDraft(slug, text(form, "publish_token"), ids);
    let warning: string | undefined;
    try { await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email, action: "store.product.published", targetType: "store_product", targetId: slug, metadata: { scope: "product-only" } }); }
    catch { warning = "商品已发布，但审计写入异常，请检查存储。"; }
    const { catalog } = await readStoreCatalog();
    refresh(slug);
    return { ok: true, slug, editToken: productToken(catalog, slug), publishToken: publicationToken(catalog, slug), warning };
  } catch (error) { return failure(error); }
}

// Separate server action and confirmation: cannot consume product drafts.
export async function publishSoftwareAction(form: FormData): Promise<ProductEditorResult> {
  try {
    const admin = await requireStoreAdmin();
    if (form.get("confirm") !== "on") throw new Error("RELEASE_CONFIRMATION_REQUIRED");
    if (form.has("publish_token") || form.has("publish_product")) throw new Error("PUBLICATION_SCOPE_SEPARATE");
    const slug = text(form, "slug");
    const ids = form.getAll("release_id").map(String);
    await publishSoftwareReleases(slug, text(form, "release_token"), ids);
    let warning: string | undefined;
    try { await appendStoreAudit({ actorUserId: admin.id, actorEmail: admin.email,
      action: "store.software.published", targetType: "product_release", targetId: slug,
      metadata: { scope: "software-only", releaseIds: ids } }); }
    catch { warning = "软件版本已发布，商品资料保持不变，但审计写入异常，请检查存储。"; }
    const { catalog } = await readStoreCatalog();
    refresh(slug);
    return { ok: true, slug, releaseToken: releasePublicationToken(catalog, slug), warning };
  } catch (error) { return failure(error); }
}
