import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ProductCatalog } from '@/components/product-catalog';
import { listPublicProducts, storeProductToSoftwareProduct } from '@/lib/store/public-data';
import { categoryLabel, PRODUCT_CATEGORY_PRESETS } from '@/lib/store/presentation';
import { getRequestLanguage } from '@/i18n/server';
import { localePath } from '@/i18n/config';
export const dynamic = 'force-dynamic';
export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(category)) notFound();
  const { locale } = await getRequestLanguage();
  const { products } = await listPublicProducts(locale);
  const items = products.filter(p => p.categorySlug === category);
  if (!items.length && !PRODUCT_CATEGORY_PRESETS.some(p => p.value === category) && !['desktop-apps','browser-extensions'].includes(category)) notFound();
  return <div className="storefront app-storefront"><div className="store-shell py-8"><Link href={localePath(locale)} className="app-breadcrumb"><ArrowLeft className="h-4 w-4" />{locale === 'zh' ? '全部软件' : 'All apps'}</Link><h1 className="mb-6 text-3xl font-semibold">{categoryLabel(category, locale)}</h1><section id="collection"><ProductCatalog products={items.map(storeProductToSoftwareProduct)} showCategoryFilter={false} locale={locale} /></section></div></div>;
}
