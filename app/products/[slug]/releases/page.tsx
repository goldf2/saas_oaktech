import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductReleaseHistory } from "@/components/product-release-history";
import { getPublicProduct, getPublishedProductReleases } from "@/lib/store/public-data";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getPublicProduct(slug, "en");
  return product ? { title: `${product.name} Release Notes - OakTech`, description: `Published release history for ${product.name}.` } : {};
}

export default async function ReleasesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [{ product }, releaseData] = await Promise.all([getPublicProduct(slug, "en"), getPublishedProductReleases(slug, "en")]);
  if (!product) notFound();
  return <ProductReleaseHistory product={product} releases={releaseData.releases} locale="en" source={releaseData.source} />;
}
