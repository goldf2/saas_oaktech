import Link from 'next/link';
import { ArrowUpRight, PackageOpen } from 'lucide-react';
import { ProductCatalog } from '@/components/product-catalog';
import { localePath } from '@/i18n/config';
import { categoryLabel, platformLabel } from '@/lib/store/presentation';
import { storeProductToSoftwareProduct } from '@/lib/store/public-data';
import type { Locale, ProductRelease, StoreDataSource, StoreProduct } from '@/lib/store/types';

export function StorefrontHome({ products, source, locale }: { products: StoreProduct[]; featuredRelease?: ProductRelease; source: StoreDataSource; locale: Locale; localized?: boolean }) {
  const zh = locale === 'zh';
  const featured = [...products].sort((a, b) => Number(b.featured) - Number(a.featured)).filter(p => p.heroImageUrl && p.heroImageUrl !== p.iconUrl).slice(0, 2);
  return <div className="storefront app-storefront" data-testid="app-store-home"><div className="store-shell app-home-shell">
    <header className="app-home-heading"><p className="app-category-label">OakTech {zh ? '软件商店' : 'App Store'}</p><h1>{zh ? '发现好软件，专注做好事。' : 'Good software. Better work.'}</h1><p>{zh ? '探索创作、开发与日常工作中的实用工具。' : 'Explore tools for creating, developing, and getting things done.'}</p></header>
    {featured.length > 0 && <section aria-label={zh ? '精选软件' : 'Featured apps'} className="app-featured-grid">{featured.map(p => <Link key={p.slug} href={localePath(locale, `/products/${p.slug}`)} className="app-featured-card"><div className="app-featured-image"><img src={p.heroImageUrl} alt={`${p.name} ${zh ? '预览' : 'preview'}`} loading="eager" /></div><div className="app-featured-caption"><div className="flex min-w-0 items-center gap-3">{p.iconUrl ? <img src={p.iconUrl} alt="" className="h-12 w-12 shrink-0 rounded-xl border bg-background object-contain" /> : <PackageOpen className="h-9 w-9" />}<div className="min-w-0"><p className="app-category-label">{categoryLabel(p.categorySlug, locale)}</p><h2 className="mt-1 truncate text-lg font-semibold">{p.name}</h2></div></div><ArrowUpRight className="h-5 w-5 shrink-0" /><p className="col-span-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{p.tagline}</p><p className="col-span-2 text-xs text-muted-foreground">{p.supportedPlatforms.map(v => platformLabel(v, locale)).join(' · ')}</p></div></Link>)}</section>}
    <section id="collection" className="app-collection scroll-mt-20"><div className="app-section-heading"><h2>{zh ? '软件目录' : 'Explore apps'}</h2><span className="text-xs text-muted-foreground">{zh ? '按用途和平台查找' : 'Find by category and platform'}</span></div>
      {source === 'migration-fallback' && <p className="mb-4 rounded-lg border border-amber-300 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">{zh ? '当前显示迁移目录，下载以各商品的已发布软件包为准。' : 'Showing the migration catalog. Downloads depend on each app’s published packages.'}</p>}
      <ProductCatalog products={products.map(storeProductToSoftwareProduct)} locale={locale} />
    </section>
    <div className="app-home-note"><PackageOpen className="h-4 w-4 shrink-0" /><p>{zh ? '商品介绍与软件版本独立发布。可用的安装包、系统要求与更新说明，请查看商品详情。' : 'App information and releases are published separately. Open an app to see available packages and release notes.'}</p></div>
  </div></div>;
}
