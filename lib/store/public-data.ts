import "server-only";

import { getProductBySlug, PRODUCTS, type SoftwareProduct } from "@/config/products";
import { getLegacyGitFinderRelease } from "@/config/gitfinder-release";
import { selectPublishedRows } from "./policy";
import { readStoreCatalog } from "./file-catalog";
import type {
  Locale,
  ProductRelease,
  ReleaseArtifact,
  StoreDataSource,
  StoreProduct,
} from "./types";

type ProductRow = {
  id: string;
  slug: string;
  category_slug: string;
  status: StoreProduct["status"];
  visibility: "published";
  name_en: string;
  name_zh: string;
  tagline_en: string;
  tagline_zh: string;
  description_en: string;
  description_zh: string;
  icon_url: string;
  hero_image_url: string;
  supported_platforms: string[];
  featured: boolean;
};

type ReleaseRow = {
  id: string;
  product_slug: string;
  version: string;
  channel: string;
  status: "draft" | "published";
  is_current: boolean;
  published_at: string | null;
  title_en: string;
  title_zh: string;
  notes_en: string;
  notes_zh: string;
  release_artifacts: Array<{
    id: string;
    release_id: string;
    platform: string;
    architecture: string;
    package_kind: string;
    file_name: string;
    storage_path: string;
    public_path: string;
    size_bytes: number;
    sha512: string;
    content_type: string;
  }>;
};

function localText(row: Record<string, unknown>, key: string, locale: Locale) {
  return String(row[`${key}_${locale}`] ?? row[`${key}_en`] ?? "");
}

function mapProduct(row: ProductRow, locale: Locale): StoreProduct {
  return {
    id: row.id,
    slug: row.slug,
    categorySlug: row.category_slug,
    status: row.status,
    visibility: row.visibility,
    name: localText(row, "name", locale),
    tagline: localText(row, "tagline", locale),
    description: localText(row, "description", locale),
    iconUrl: row.icon_url,
    heroImageUrl: row.hero_image_url,
    supportedPlatforms: row.supported_platforms ?? [],
    featured: row.featured,
  };
}

function fallbackProduct(product: SoftwareProduct): StoreProduct {
  return {
    slug: product.slug,
    categorySlug: product.categorySlug,
    status: product.status,
    visibility: "published",
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    iconUrl: product.icon,
    heroImageUrl: product.heroImage,
    supportedPlatforms: product.platforms,
    featured: product.featured,
  };
}

function mapArtifact(row: ReleaseRow["release_artifacts"][number]): ReleaseArtifact {
  return {
    id: row.id,
    releaseId: row.release_id,
    platform: row.platform,
    architecture: row.architecture,
    packageKind: row.package_kind,
    fileName: row.file_name,
    storagePath: row.storage_path,
    publicPath: row.public_path,
    sizeBytes: Number(row.size_bytes),
    sha512: row.sha512,
    contentType: row.content_type,
  };
}

function mapRelease(row: ReleaseRow, locale: Locale): ProductRelease {
  return {
    id: row.id,
    productSlug: row.product_slug,
    version: row.version,
    channel: row.channel,
    status: row.status,
    isCurrent: row.is_current,
    publishedAt: row.published_at ?? undefined,
    title: localText(row, "title", locale),
    notes: localText(row, "notes", locale),
    artifacts: (row.release_artifacts ?? []).map(mapArtifact),
  };
}

export function storeProductToSoftwareProduct(product: StoreProduct): SoftwareProduct {
  return {
    slug: product.slug,
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    status: product.status,
    category: product.categorySlug.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" "),
    categorySlug: product.categorySlug as SoftwareProduct["categorySlug"],
    price: product.status === "released" ? "Available" : product.status === "beta" ? "Beta" : "Coming soon",
    license: "See product details",
    icon: product.iconUrl,
    heroImage: product.heroImageUrl,
    screenshots: [product.heroImageUrl],
    features: [],
    platforms: product.supportedPlatforms,
    browsers: [],
    installSteps: [],
    permissions: [],
    faqs: [],
    releaseNotes: [],
    featured: product.featured,
  };
}

export async function listPublicProducts(locale: Locale): Promise<{ products: StoreProduct[]; source: StoreDataSource }> {
  const { catalog, persisted } = await readStoreCatalog();
  const rows = catalog.products.filter((item) => item.visibility === "published") as ProductRow[];
  if (!persisted) return { products: PRODUCTS.map(fallbackProduct), source: "migration-fallback" };
  return {
    products: rows.map((row) => mapProduct(row, locale)).sort((left, right) => Number(right.featured) - Number(left.featured)),
    source: "catalog",
  };
}

export async function getPublicProduct(slug: string, locale: Locale): Promise<{ product: StoreProduct | null; source: StoreDataSource }> {
  const { catalog, persisted } = await readStoreCatalog();
  if (!persisted) {
    const product = getProductBySlug(slug);
    return { product: product ? fallbackProduct(product) : null, source: "migration-fallback" };
  }
  const row = catalog.products.find((item) => item.slug === slug && item.visibility === "published") as ProductRow | undefined;
  return { product: row ? mapProduct(row, locale) : null, source: "catalog" };
}

export async function getPublishedProductReleases(
  productSlug: string,
  locale: Locale,
): Promise<{ releases: ProductRelease[]; source: StoreDataSource }> {
  const { catalog, persisted } = await readStoreCatalog();
  if (!persisted) {
    return {
      releases: productSlug === "gitfinder-2" ? [getLegacyGitFinderRelease(locale)] : [],
      source: "migration-fallback",
    };
  }
  const rows = selectPublishedRows(catalog.releases.filter((row) => row.product_slug === productSlug) as ReleaseRow[]);
  return { releases: rows.map((row) => mapRelease(row, locale)), source: "catalog" };
}
