import { ProductReleaseHistory } from "@/components/product-release-history";
import { getPublicProduct, getPublishedProductReleases } from "@/lib/store/public-data";

export const metadata = { title: "GitFinder 2 Release Notes - OakTech" };

export default async function GitFinderReleasesPage() {
  const [{ product }, releaseData] = await Promise.all([
    getPublicProduct("gitfinder-2", "en"),
    getPublishedProductReleases("gitfinder-2", "en"),
  ]);
  if (!product) return null;
  return <ProductReleaseHistory product={product} releases={releaseData.releases} locale="en" source={releaseData.source} />;
}
