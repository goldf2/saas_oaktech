"use client";
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { categoryLabel, platformKey, platformLabel, matchesPlatform, PLATFORM_PRESETS } from '@/lib/store/presentation';
import type { ProductCategory, SoftwareProduct } from '@/config/products';
import type { Locale } from '@/lib/store/types';

type CatalogProps = { products: SoftwareProduct[]; categories?: ProductCategory[]; showCategoryFilter?: boolean; locale?: Locale };
export function ProductCatalog({ products, showCategoryFilter = true, locale = 'en' }: CatalogProps) {
  const pathname = usePathname(), router = useRouter(), params = useSearchParams(), zh = locale === 'zh';
  const urlQuery = params.get('q') ?? '', category = params.get('category') ?? 'all', platform = params.get('platform') ?? 'all', status = params.get('status') ?? 'all', sort = params.get('sort') ?? 'featured';
  const [query, setQuery] = useState(urlQuery);
  useEffect(() => setQuery(urlQuery), [urlQuery]);
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.categorySlug))), [products]);
  const platforms = useMemo(() => Array.from(new Set([...PLATFORM_PRESETS.filter(p => products.some(item => matchesPlatform(item.platforms, p.value))).map(p => p.value), ...products.flatMap(p => p.platforms.map(platformKey))])), [products]);
  const filtered = useMemo(() => products.filter(p => (!query.trim() || `${p.name} ${p.tagline} ${p.description}`.toLowerCase().includes(query.trim().toLowerCase())) && (!showCategoryFilter || category === 'all' || p.categorySlug === category) && matchesPlatform(p.platforms, platform) && (status === 'all' || !['beta','released','coming-soon'].includes(status) || p.status === status)).sort((a, b) => (sort === 'name' ? 0 : Number(b.featured) - Number(a.featured)) || a.name.localeCompare(b.name, locale === 'zh' ? 'zh-CN' : 'en') || a.slug.localeCompare(b.slug, 'en')), [products, query, category, showCategoryFilter, platform, status, sort, locale]);
  function update(key: string, value: string) { const next = new URLSearchParams(params.toString()); if (query.trim()) next.set('q', query.trim()); else next.delete('q'); if (!value || value === 'all' || key === 'sort' && value === 'featured') next.delete(key); else next.set(key, value); router.replace(`${pathname}${next.size ? '?' + next.toString() : ''}#collection`, { scroll: false }); }
  function reset() { setQuery(''); router.replace(pathname + '#collection', { scroll: false }); }
  const hasFilters = query || category !== 'all' || platform !== 'all' || status !== 'all' || sort !== 'featured';
  return <div data-testid="app-catalog">
    <div className="app-catalog-toolbar">
      <form className="app-catalog-search" onSubmit={e => { e.preventDefault(); update('q', query.trim()); }}><Search className="h-4 w-4 shrink-0 text-muted-foreground" /><input type="search" aria-label={zh ? '搜索软件' : 'Search apps'} placeholder={zh ? '搜索软件名称或功能' : 'Search apps or features'} value={query} maxLength={200} onChange={e => setQuery(e.target.value)} /><button type="submit">{zh ? '搜索' : 'Search'}</button></form>
      <div className="flex min-w-0 flex-wrap gap-2"><select className="app-filter-select" value={platform} onChange={e => update('platform', e.target.value)} aria-label={zh ? '筛选平台' : 'Filter by platform'}><option value="all">{zh ? '全部平台' : 'All platforms'}</option>{!platforms.includes(platform) && platform !== 'all' && <option value={platform}>{platformLabel(platform, locale)}</option>}{platforms.map(p => <option key={p} value={p}>{platformLabel(p, locale)}</option>)}</select>
      <select className="app-filter-select" value={status} onChange={e => update('status', e.target.value)} aria-label={zh ? '筛选产品阶段' : 'Filter by release status'}><option value="all">{zh ? '全部阶段' : 'All stages'}</option><option value="released">{zh ? '正式版' : 'Released'}</option><option value="beta">{zh ? '测试版' : 'Beta'}</option><option value="coming-soon">{zh ? '即将推出' : 'Coming soon'}</option></select></div>
    </div>
    {showCategoryFilter && <div className="app-category-tabs" role="group" aria-label={zh ? '软件类别' : 'App categories'}>{['all', ...categories].map(c => <button type="button" key={c} aria-pressed={category === c} data-category-filter={c} onClick={() => update('category', c)}>{c === 'all' ? zh ? '全部软件' : 'All apps' : categoryLabel(c, locale)}</button>)}</div>}
    <div className="mb-4 mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><p aria-live="polite">{filtered.length} {zh ? '款软件' : filtered.length === 1 ? 'app' : 'apps'}</p><div className="flex items-center gap-3">{hasFilters && <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-primary"><X className="h-3.5 w-3.5" />{zh ? '清除筛选' : 'Clear filters'}</button>}<select aria-label={zh ? '软件排序' : 'Sort products'} value={sort} onChange={e => update('sort', e.target.value)} className="bg-transparent py-1"><option value="featured">{zh ? '推荐优先' : 'Featured first'}</option><option value="name">{zh ? '按名称' : 'By name'}</option></select></div></div>
    {filtered.length ? <div className="app-catalog-grid">{filtered.map(p => <ProductCard key={p.slug} product={p} locale={locale} />)}</div> : <div className="app-catalog-empty"><Search className="mx-auto h-7 w-7 text-muted-foreground" /><h3 className="mt-4 font-semibold">{zh ? '没有找到匹配的软件' : 'No apps match your search'}</h3><p className="mt-2 text-sm text-muted-foreground">{zh ? '试试其他关键词，或清除筛选条件。' : 'Try another keyword or clear the filters.'}</p><button type="button" onClick={reset} className="mt-5 font-medium text-primary">{zh ? '查看全部软件' : 'View all apps'}</button></div>}
  </div>;
}
