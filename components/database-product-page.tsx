import Link from 'next/link';
import { ArrowLeft, ArrowUpRight, Download, PackageOpen, Monitor } from 'lucide-react';
import { ProductVideos } from '@/components/product-videos';
import { ProductGallery } from '@/components/product-gallery';
import { StoreDownloadCard } from '@/components/store-download-card';
import { isSoftwareDownload } from '@/lib/store/download-visibility';
import { categoryLabel, platformLabel } from '@/lib/store/presentation';
import { localePath } from '@/i18n/config';
import type { Locale, ProductRelease, StoreProduct } from '@/lib/store/types';

export function DatabaseProductPage({ product, releases, locale, preview = false }: { product: StoreProduct; releases: ProductRelease[]; locale: Locale; preview?: boolean }) {
  const zh = locale === 'zh';
  const published = releases.filter(r => r.status === 'published');
  const current = preview ? releases[0] : published.find(r => r.isCurrent) ?? published[0];
  const downloads = preview ? [] : current?.artifacts.filter(isSoftwareDownload) ?? [];
  const stage = { beta: zh ? '测试版' : 'Beta', released: zh ? '正式版' : 'Released', 'coming-soon': zh ? '即将推出' : 'Coming soon' }[product.status];
  const status = preview ? zh ? '草稿预览' : 'Draft preview' : stage;
  const releaseHref = localePath(locale, `/products/${product.slug}/releases`);
  const images = Array.from(new Set((product.galleryUrls?.length ? product.galleryUrls : product.heroImageUrl && product.heroImageUrl !== product.iconUrl ? [product.heroImageUrl] : []).filter(Boolean)));
  const date = current?.publishedAt && Number.isFinite(Date.parse(current.publishedAt)) ? new Date(current.publishedAt).toLocaleDateString(zh ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' }) : null;
  return <div className={`storefront app-storefront ${preview ? 'product-preview-surface' : ''}`} data-testid="app-store-product">
    <div className="store-shell app-product-shell">
      {!preview && <Link className="app-breadcrumb" href={localePath(locale)}><ArrowLeft className="h-4 w-4" />{zh ? '全部软件' : 'All apps'}</Link>}
      <section className="app-product-head" aria-label={zh ? '商品概览' : 'App overview'}>
        <div className="app-product-identity">
          {product.iconUrl ? <img src={product.iconUrl} alt="" className="app-product-icon" /> : <span className="app-product-icon flex items-center justify-center"><PackageOpen className="h-12 w-12 text-muted-foreground" /></span>}
          <div className="min-w-0"><p className="app-category-label">{categoryLabel(product.categorySlug, locale)}</p><h1 className="app-product-title">{product.name}</h1><p className="app-product-subtitle">{product.tagline}</p><span className="app-stage-badge">{status}</span></div>
        </div>
        <div className="app-get-area">
          {downloads.length ? <a href="#downloads" className="app-get-button"><Download className="h-4 w-4" />{zh ? '获取软件' : 'Get the app'}</a> : <span className="app-get-unavailable"><PackageOpen className="h-4 w-4" />{preview ? zh ? '预览中不可下载' : 'Downloads disabled in preview' : zh ? '暂无下载' : 'Not available yet'}</span>}
          <p>{downloads.length ? zh ? `${downloads.length} 个可下载安装包` : `${downloads.length} downloadable packages` : zh ? '可以先了解商品介绍' : 'Explore the app below'}</p>
        </div>
      </section>
      <dl className="app-facts-strip">
        <div><dt>{zh ? '商品类别' : 'Category'}</dt><dd>{categoryLabel(product.categorySlug, locale)}</dd></div>
        <div><dt>{zh ? '支持平台' : 'Platforms'}</dt><dd className="flex flex-wrap gap-x-3 gap-y-1">{product.supportedPlatforms.length ? product.supportedPlatforms.map((p, i) => <span key={`${p}-${i}`}>{platformLabel(p, locale)}</span>) : '—'}</dd></div>
        <div><dt>{zh ? '最新版本' : 'Latest version'}</dt><dd>{current?.version ?? (zh ? '尚未发布' : 'Not released')}</dd></div>
      </dl>
      <div className="product-detail-grid app-product-body">
        <div className="app-product-main">
          <ProductGallery images={images} name={product.name} locale={locale} />
          <div className="app-product-videos"><ProductVideos videos={product.videos} locale={locale} /></div>
          <section className="app-section" id="about-app"><div className="app-section-heading"><h2>{zh ? '关于此软件' : 'About this app'}</h2></div>
            <div className="app-about-copy">{product.description ? <><p>{product.description.slice(0, 800)}</p>{product.description.length > 800 && <details className="mt-3"><summary className="cursor-pointer font-medium text-primary">{zh ? '展开全部介绍' : 'Read more'}</summary><p className="mt-3">{product.description.slice(800)}</p></details>}</> : <p className="text-muted-foreground">{zh ? '商品介绍即将补充。' : 'More details will be added soon.'}</p>}</div>
          </section>
          {current && <section className="app-section" data-testid="app-whats-new"><div className="app-section-heading"><h2>{zh ? '版本更新' : 'What’s new'}</h2>{!preview && <Link href={releaseHref} className="app-text-link">{zh ? '版本历史' : 'Version history'}<ArrowUpRight className="h-4 w-4" /></Link>}</div><p className="mb-3 text-sm text-muted-foreground">{current.version}{date ? ` · ${date}` : ''}</p><p className="whitespace-pre-wrap break-words text-sm leading-7">{current.notes || current.title}</p></section>}
          <section id="downloads" className="app-section scroll-mt-24" data-testid="app-downloads"><div className="app-section-heading"><h2>{zh ? '下载与安装' : 'Downloads'}</h2></div>
            {downloads.length ? <><p className="mb-4 text-sm text-muted-foreground">{zh ? '选择与你的系统和处理器匹配的安装包。' : 'Choose the package for your system and processor.'}</p><div className="app-download-grid">{downloads.map(a => <StoreDownloadCard key={a.id} artifact={a} locale={locale} compact />)}</div></> : <div className="app-download-empty"><Monitor className="h-6 w-6 shrink-0 text-muted-foreground" /><p>{preview ? zh ? '草稿安装包不会在预览中提供下载。' : 'Draft packages are not downloadable in preview.' : zh ? '软件包尚未发布。商品介绍与软件版本分别发布，请稍后再来查看。' : 'No software package has been released yet. App information and packages are published separately.'}</p></div>}
          </section>
        </div>
        <aside className="app-info-sidebar"><section className="app-info-box"><h2>{zh ? '软件信息' : 'App information'}</h2><dl>
          <div><dt>{zh ? '类别' : 'Category'}</dt><dd>{categoryLabel(product.categorySlug, locale)}</dd></div>
          <div><dt>{zh ? '产品阶段' : 'Stage'}</dt><dd>{stage}</dd></div>
          <div><dt>{zh ? '兼容平台' : 'Compatibility'}</dt><dd className="flex flex-wrap gap-1.5">{product.supportedPlatforms.map((p, i) => <span className="app-platform-tag" key={`${p}-${i}`}>{platformLabel(p, locale)}</span>)}</dd></div>
          {current && <div><dt>{zh ? '版本' : 'Version'}</dt><dd>{current.version}</dd></div>}
          {date && <div><dt>{zh ? '更新日期' : 'Updated'}</dt><dd>{date}</dd></div>}
        </dl></section>{!preview && <div className="app-support-links"><Link href="/support">{zh ? '帮助与支持' : 'Help & support'}<ArrowUpRight className="h-4 w-4" /></Link><Link href={releaseHref}>{zh ? '查看发布历史' : 'Release history'}<ArrowUpRight className="h-4 w-4" /></Link></div>}</aside>
      </div>
    </div>
  </div>;
}
