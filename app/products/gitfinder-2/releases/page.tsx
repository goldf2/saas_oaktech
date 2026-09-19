import { ProductReleaseHistory } from "@/components/product-release-history";
import { getRequestLanguage } from "@/i18n/server";
import { getPublicProduct, getPublishedProductReleases } from "@/lib/store/public-data";

export async function generateMetadata() {
  const { locale } = await getRequestLanguage();
  return { title: `GitFinder 2 ${locale === "zh" ? "发布说明" : "Release Notes"} - OakTech` };
}
export default async function GitFinderReleasesPage() {
  const { locale } = await getRequestLanguage();
  const [{ product }, releaseData] = await Promise.all([getPublicProduct("gitfinder-2", locale), getPublishedProductReleases("gitfinder-2", locale)]);
  if (!product) return null;
  return <ProductReleaseHistory product={product} releases={releaseData.releases} locale={locale} source={releaseData.source} />;
}
