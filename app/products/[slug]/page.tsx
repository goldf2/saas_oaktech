import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GitFinderProductPage } from "@/components/gitfinder-product-page";
import { DatabaseProductPage } from "@/components/database-product-page";
import { getRequestLanguage } from "@/i18n/server";
import { localePath } from "@/i18n/config";
import { getPublicProduct, getPublishedProductReleases } from "@/lib/store/public-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, { locale }] = await Promise.all([params, getRequestLanguage()]);
  const { product } = await getPublicProduct(slug, locale);
  return product ? { title: `${product.name} - OakTech`, description: product.description, alternates: { canonical: localePath(locale, `/products/${slug}`), languages: { en: `/en/products/${slug}`, "zh-CN": `/zh/products/${slug}` } } } : {};
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { locale }] = await Promise.all([params, getRequestLanguage()]);
  const [{ product, source }, releaseData] = await Promise.all([getPublicProduct(slug, locale), getPublishedProductReleases(slug, locale)]);
  if (!product) notFound();
  if (slug === "gitfinder-2" && source === "migration-fallback") return <GitFinderProductPage product={product} locale={locale} releases={releaseData.releases} source={releaseData.source === "migration-fallback" ? releaseData.source : source} />;
  return <DatabaseProductPage product={product} releases={releaseData.releases} locale={locale} />;
}
