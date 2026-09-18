// Pure presentation projections. Authorization is resolved on the server before
// selecting the administrative projection; query parameters never select a role.
import { selectPublishedRows } from "./policy.ts";
import { isSoftwareDownload } from "./download-visibility.ts";
import { resolveProductIcon } from "./product-assets.ts";
import type { AdminProductReleaseRow, AdminStoreProductRow, ProductDraft, ProductStatus, StoreProduct } from "./types";

export type WorkspaceProductItem = {
  slug: string;
  name: string;
  tagline: string;
  iconUrl: string;
  status: ProductStatus;
  published: boolean;
  publishedVersions: number;
  downloadable: boolean;
  searchText: string;
  management?: { pendingProduct: boolean; totalVersions: number; draftVersions: number; publishedName: string | null };
};
export type ProductListQuery = { q?: unknown; state?: unknown };
type ReleaseMetadata = Pick<AdminProductReleaseRow, "status" | "is_current" | "published_at"> & {
  release_artifacts: { package_kind: string; file_name: string }[];
};

// Use the same current selection as the existing product page. This does not
// invent cross-platform current versions or expose draft artifact metadata.
export function releaseOverview(releases: ReleaseMetadata[]) {
  const published = selectPublishedRows(releases);
  const current = published.find(release => release.is_current) ?? published[0];
  return { publishedVersions: published.length, downloadable: Boolean(current?.release_artifacts.some(artifact =>
    isSoftwareDownload({ packageKind: artifact.package_kind, fileName: artifact.file_name }))) };
}

export function publicWorkspaceItem(product: StoreProduct, releases: ReleaseMetadata[]): WorkspaceProductItem {
  return {
    slug: product.slug, name: product.name, tagline: product.tagline, iconUrl: product.iconUrl,
    status: product.status, published: true, ...releaseOverview(releases),
    searchText: `${product.name} ${product.tagline} ${product.slug}`.toLowerCase(),
  };
}

export function managedWorkspaceItems(catalog: {
  products: AdminStoreProductRow[]; releases: AdminProductReleaseRow[]; productDrafts?: Record<string, ProductDraft>;
}): WorkspaceProductItem[] {
  return catalog.products.map(product => {
    const draft = catalog.productDrafts?.[product.slug];
    const working = draft?.product ?? product;
    const releases = catalog.releases.filter(release => release.product_slug === product.slug);
    const published = product.visibility === "published";
    const summary = releaseOverview(releases);
    return {
      slug: product.slug, name: working.name_zh || working.name_en || product.slug,
      tagline: working.tagline_zh || working.tagline_en, iconUrl: resolveProductIcon(product.slug, working.icon_url),
      status: working.status, published, ...summary, downloadable: published && summary.downloadable,
      searchText: [product.slug, working.name_zh, working.name_en, working.tagline_zh,
        product.name_zh, product.name_en].join(" ").toLowerCase(),
      management: {
        pendingProduct: Boolean(draft) || !published, totalVersions: releases.length,
        draftVersions: releases.filter(release => release.status === "draft").length,
        publishedName: published ? product.name_zh || product.name_en : null,
      },
    };
  });
}

export function filterWorkspaceProducts(items: WorkspaceProductItem[], query: ProductListQuery, administrator: boolean) {
  const q = typeof query.q === "string" ? query.q.trim().slice(0, 200) : "";
  // No public draft counts, empty-result oracle or privileged filter can be
  // requested by forging view/state/admin query parameters.
  const state = administrator && typeof query.state === "string" && ["draft", "published"].includes(query.state)
    ? query.state : "all";
  const visible = administrator ? items : items.filter(item => item.published && !item.management);
  const filtered = visible.filter(item => (!q || item.searchText.includes(q.toLowerCase()))
    && (state === "draft" ? item.management?.pendingProduct : state === "published" ? item.published : true));
  const stats = administrator
    ? [["商品", visible.length], ["待发布资料", visible.filter(item => item.management?.pendingProduct).length],
      ["版本草稿", visible.reduce((sum, item) => sum + (item.management?.draftVersions ?? 0), 0)]] as const
    : [["公开商品", visible.length], ["可下载软件", visible.filter(item => item.downloadable).length]] as const;
  return { q, state, filtered, stats };
}
