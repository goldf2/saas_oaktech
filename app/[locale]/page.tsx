import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StorefrontHome } from "@/components/storefront-home";
import { getMessages } from "@/i18n/messages";
import { isLocale, localePath } from "@/i18n/config";
import { getPublishedProductReleases, listPublicProducts } from "@/lib/store/public-data";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = getMessages(locale).storefront;
  return {
    title: locale === "zh" ? "OakTech 软件商店" : "OakTech Software Store",
    description: copy.description,
    alternates: {
      canonical: localePath(locale),
      languages: { en: "/en", "zh-CN": "/zh" },
    },
  };
}

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const catalog = await listPublicProducts(locale);
  const featured = catalog.products.find((product) => product.slug === "gitfinder-2")
    ?? catalog.products.find((product) => product.featured);
  const releaseData = featured
    ? await getPublishedProductReleases(featured.slug, locale)
    : { releases: [] };

  return (
    <StorefrontHome
      products={catalog.products}
      featuredRelease={releaseData.releases.find((release) => release.isCurrent) ?? releaseData.releases[0]}
      source={catalog.source}
      locale={locale}
      localized
    />
  );
}
