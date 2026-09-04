export type Locale = "en" | "zh";
export type ProductStatus = "beta" | "released" | "coming-soon";
export type PublicationStatus = "draft" | "published";

export type StoreProduct = {
  id?: string;
  slug: string;
  categorySlug: string;
  status: ProductStatus;
  visibility: PublicationStatus;
  name: string;
  tagline: string;
  description: string;
  iconUrl: string;
  heroImageUrl: string;
  supportedPlatforms: string[];
  featured: boolean;
};

export type ReleaseArtifact = {
  id: string;
  releaseId: string;
  platform: string;
  architecture: string;
  packageKind: string;
  fileName: string;
  storagePath: string;
  publicPath: string;
  sizeBytes: number;
  sha512: string;
  contentType: string;
};

export type ProductRelease = {
  id: string;
  productSlug: string;
  version: string;
  channel: string;
  status: PublicationStatus;
  isCurrent: boolean;
  publishedAt?: string;
  title: string;
  notes: string;
  artifacts: ReleaseArtifact[];
};

export type StoreDataSource = "catalog" | "migration-fallback";

export type AdminStoreProductRow = {
  id: string;
  slug: string;
  category_slug: string;
  status: ProductStatus;
  visibility: PublicationStatus;
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

export type AdminProductReleaseRow = {
  id: string;
  product_slug: string;
  version: string;
  channel: string;
  status: PublicationStatus;
  is_current: boolean;
  published_at: string | null;
  source_commit?: string | null;
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
