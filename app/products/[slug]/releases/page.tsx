import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductReleaseHistory } from "@/components/product-release-history";
import { getRequestLanguage } from "@/i18n/server";
import { getPublicProduct, getPublishedProductReleases } from "@/lib/store/public-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, { locale }] = await Promise.all([params, getRequestLanguage()]);
  const { product } = await getPublicProduct(slug, locale);
  return product ? { title: `${product.name} ${locale === "zh" ? "发布说明" : "Release Notes"} - OakTech`, description: locale === "zh" ? `${product.name} 的公开版本历史。` : `Published release history for ${product.name}.` } : {};
}
export default async function ReleasesPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { locale }] = await Promise.all([params, getRequestLanguage()]);
  const [{ product }, releaseData] = await Promise.all([getPublicProduct(slug, locale), getPublishedProductReleases(slug, locale)]);
  if (!product) notFound();
  return <ProductReleaseHistory product={product} releases={releaseData.releases} locale={locale} source={releaseData.source} />;
}
