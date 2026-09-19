import Link from 'next/link';
import { ArrowRight, PackageOpen } from 'lucide-react';
import { localePath } from '@/i18n/config';
import { categoryLabel, platformLabel } from '@/lib/store/presentation';
import type { Locale } from '@/lib/store/types';
import type { SoftwareProduct } from '@/config/products';

export function ProductCard({ product, locale = 'en' }: { product: SoftwareProduct; locale?: Locale }) {
  const zh = locale === 'zh';
  const status = { beta: zh ? '测试版' : 'Beta', released: zh ? '正式版' : 'Released', 'coming-soon': zh ? '即将推出' : 'Coming soon' }[product.status];
  return <article className="app-catalog-card" data-catalog-product={product.slug}>
    <Link href={localePath(locale, `/products/${product.slug}`)} className="app-card-inner" aria-label={`${product.name}: ${product.tagline}`}>
      <div className="flex items-start gap-3.5">{product.icon ? <img src={product.icon} alt="" className="app-card-icon" loading="lazy" /> : <span className="app-card-icon flex items-center justify-center"><PackageOpen className="h-6 w-6 text-muted-foreground" /></span>}<div className="min-w-0 flex-1"><h3 className="line-clamp-2 break-words text-base font-semibold leading-6">{product.name}</h3><p className="mt-1 text-xs text-muted-foreground">{categoryLabel(product.categorySlug, locale)}</p></div><ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" /></div>
      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">{product.tagline}</p>
      <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-4 text-xs"><span className="app-stage-badge">{status}</span>{product.platforms.slice(0, 3).map((p, i) => <span key={`${p}-${i}`} className="text-muted-foreground">{platformLabel(p, locale)}</span>)}{product.platforms.length > 3 && <span className="text-muted-foreground">+{product.platforms.length - 3}</span>}</div>
    </Link>
  </article>;
}
