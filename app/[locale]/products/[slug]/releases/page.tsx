import { notFound } from "next/navigation";
import { ProductReleaseHistory } from "@/components/product-release-history";
import { isLocale } from "@/i18n/config";
import { getPublicProduct, getPublishedProductReleases } from "@/lib/store/public-data";

export default async function LocalizedReleasesPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [{ product }, releaseData] = await Promise.all([getPublicProduct(slug, locale), getPublishedProductReleases(slug, locale)]);
  if (!product) notFound();
  return <ProductReleaseHistory product={product} releases={releaseData.releases} locale={locale} source={releaseData.source} />;
}
