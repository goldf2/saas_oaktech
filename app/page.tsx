import { StorefrontHome } from "@/components/storefront-home";
import { getPublishedProductReleases, listPublicProducts } from "@/lib/store/public-data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const catalog = await listPublicProducts("en");
  const featured = catalog.products.find((product) => product.slug === "gitfinder-2")
    ?? catalog.products.find((product) => product.featured);
  const releaseData = featured
    ? await getPublishedProductReleases(featured.slug, "en")
    : { releases: [] };

  return (
    <StorefrontHome
      products={catalog.products}
      featuredRelease={releaseData.releases.find((release) => release.isCurrent) ?? releaseData.releases[0]}
      source={catalog.source}
      locale="en"
    />
  );
}
