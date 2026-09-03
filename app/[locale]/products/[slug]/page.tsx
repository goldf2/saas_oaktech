import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GitFinderProductPage } from "@/components/gitfinder-product-page";
import { DatabaseProductPage } from "@/components/database-product-page";
import { isLocale, localePath } from "@/i18n/config";
import { getPublicProduct, getPublishedProductReleases } from "@/lib/store/public-data";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const { product } = await getPublicProduct(slug, locale);
  if (!product) return {};
  return { title: `${product.name} - OakTech`, description: product.description, alternates: { canonical: localePath(locale, `/products/${slug}`), languages: { en: `/en/products/${slug}`, "zh-CN": `/zh/products/${slug}` } } };
}

export default async function LocalizedProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const [{ product, source }, releaseData] = await Promise.all([getPublicProduct(slug, locale), getPublishedProductReleases(slug, locale)]);
  if (!product) notFound();
  if (slug === "gitfinder-2") return <GitFinderProductPage product={product} locale={locale} releases={releaseData.releases} source={releaseData.source === "migration-fallback" ? releaseData.source : source} />;
  return <DatabaseProductPage product={product} releases={releaseData.releases} locale={locale} />;
}
