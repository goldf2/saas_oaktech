import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { ProductCatalog } from "@/components/product-catalog";
import { PRODUCT_CATEGORIES } from "@/config/products";
import { listPublicProducts, storeProductToSoftwareProduct } from "@/lib/store/public-data";
import { getRequestLanguage } from "@/i18n/server";
import { pageCopy } from "@/i18n/page-copy";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getRequestLanguage();
  const copy = pageCopy(locale).products;
  return { title: `${copy.title} - OakTech`, description: copy.description };
}

export default async function ProductsPage() {
  const { locale } = await getRequestLanguage();
  const copy = pageCopy(locale).products;
  const { products } = await listPublicProducts(locale);
  return <div className="storefront py-12 sm:py-16 lg:py-20" data-page-locale={locale} data-testid="products-page"><div className="store-shell">
    <div className="mb-10 max-w-2xl"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--store-surface-muted))] text-[hsl(var(--store-blue))]"><PackageSearch className="h-5 w-5" /></div>
      <h1 className="store-title">{copy.title}</h1><p className="store-lede mt-5">{copy.description}</p>
    </div>
    <ProductCatalog products={products.map(storeProductToSoftwareProduct)} categories={PRODUCT_CATEGORIES} locale={locale} />
  </div></div>;
}
