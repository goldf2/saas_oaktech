import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Download, HardDrive, ShieldCheck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { getMessages } from "@/i18n/messages";
import { localePath } from "@/i18n/config";
import { storeProductToSoftwareProduct } from "@/lib/store/public-data";
import type { Locale, ProductRelease, StoreDataSource, StoreProduct } from "@/lib/store/types";

const principleIcons = [CheckCircle2, HardDrive, ShieldCheck];

function productHref(locale: Locale, slug: string, localized: boolean) {
  const path = `/products/${slug}`;
  return localized ? localePath(locale, path) : path;
}

export function StorefrontHome({
  products,
  featuredRelease,
  source,
  locale,
  localized = false,
}: {
  products: StoreProduct[];
  featuredRelease?: ProductRelease;
  source: StoreDataSource;
  locale: Locale;
  localized?: boolean;
}) {
  const copy = getMessages(locale).storefront;
  const featured = products.find((product) => product.slug === "gitfinder-2")
    ?? products.find((product) => product.featured)
    ?? products[0];
  const featuredHref = featured ? productHref(locale, featured.slug, localized) : "#collection";

  return (
    <div className="storefront">
      <section className="relative py-16 sm:py-20 lg:py-28">
        <div aria-hidden="true" className="pointer-events-none absolute left-[-8rem] top-[-10rem] h-80 w-80 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/10" />
        <div className="store-shell relative grid gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
          <div className="max-w-2xl">
            <p className="store-eyebrow"><span className="h-1.5 w-1.5 rounded-full bg-current" />{copy.eyebrow}</p>
            <h1 className="store-display mt-6">{copy.title}</h1>
            <p className="store-lede mt-7 max-w-xl">{copy.description}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#collection" className="store-primary-action">
                {copy.browse}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              {featured && (
                <Link href={featuredHref} className="store-secondary-action">
                  {copy.openProduct}
                </Link>
              )}
            </div>
          </div>

          {featured && (
            <Link href={featuredHref} className="store-surface store-pressable group overflow-hidden" aria-label={`${copy.openProduct}: ${featured.name}`}>
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                <Image
                  src={featured.heroImageUrl}
                  alt={`${featured.name} interface preview`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 56vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                />
                <span className="store-glass absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs font-semibold sm:left-5 sm:top-5">
                  {copy.featured}
                </span>
              </div>
              <div className="grid gap-5 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
                <Image src={featured.iconUrl} alt="" width={58} height={58} className="h-[58px] w-[58px] rounded-2xl bg-white object-cover shadow-sm" />
                <div className="min-w-0">
                  <h2 className="truncate text-xl font-semibold tracking-[-0.025em]">{featured.name}</h2>
                  <p className="mt-1 line-clamp-1 text-sm text-[hsl(var(--store-secondary))]">{featured.tagline}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-xs text-[hsl(var(--store-secondary))]">{copy.latestRelease}</p>
                  <p className="mt-1 font-semibold">{featuredRelease?.version ?? copy.noRelease}</p>
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section id="collection" className="border-y border-[hsl(var(--store-line)/0.7)] bg-[hsl(var(--store-surface)/0.56)] py-16 sm:py-20">
        <div className="store-shell">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="store-eyebrow">{copy.catalogEyebrow}</p>
              <h2 className="store-section-title mt-3 max-w-2xl">{copy.catalogTitle}</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[hsl(var(--store-secondary))] lg:justify-self-end">{copy.catalogDescription}</p>
          </div>

          {source === "migration-fallback" && (
            <p className="mt-7 rounded-2xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
              {copy.fallbackNotice}
            </p>
          )}

          <div className="mt-9 grid gap-6 lg:grid-cols-2">
            {products.map((product) => (
              <ProductCard
                key={product.slug}
                product={storeProductToSoftwareProduct(product)}
                locale={locale}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="store-shell store-surface overflow-hidden">
          <div className="grid gap-10 p-7 sm:p-10 lg:grid-cols-[0.78fr_1.22fr] lg:p-14">
            <div>
              <p className="store-eyebrow">{copy.standardEyebrow}</p>
              <h2 className="store-section-title mt-3">{copy.standardTitle}</h2>
            </div>
            <div className="grid gap-7 sm:grid-cols-3">
              {copy.principles.map(([title, description], index) => {
                const Icon = principleIcons[index];
                return (
                  <article key={title}>
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--store-surface-muted))] text-[hsl(var(--store-blue))]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 font-semibold tracking-[-0.015em]">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[hsl(var(--store-secondary))]">{description}</p>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[hsl(var(--store-line)/0.8)] bg-[hsl(var(--store-surface-muted)/0.6)] px-7 py-5 sm:px-10 lg:px-14">
            <p className="flex items-center gap-2 text-sm text-[hsl(var(--store-secondary))]">
              <Download className="h-4 w-4" aria-hidden="true" />
              {copy.availableFor}: macOS · Windows · Chrome
            </p>
            {!localized && <Link href="/products" className="text-sm font-semibold text-[hsl(var(--store-blue))] hover:underline">{copy.viewAll}</Link>}
          </div>
        </div>
      </section>
    </div>
  );
}
