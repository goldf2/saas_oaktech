import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { StoreDownloadCard } from "@/components/store-download-card";
import { getMessages } from "@/i18n/messages";
import { localePath } from "@/i18n/config";
import type { Locale, ProductRelease, StoreDataSource, StoreProduct } from "@/lib/store/types";

function releaseDate(value: string | undefined, locale: Locale) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { dateStyle: "long" }).format(new Date(value));
}

export function ProductReleaseHistory({ product, releases, locale, source }: {
  product: StoreProduct;
  releases: ProductRelease[];
  locale: Locale;
  source: StoreDataSource;
}) {
  const copy = getMessages(locale).gitfinder;

  return (
    <div className="storefront py-12 sm:py-16 lg:py-20">
      <div className="store-shell">
        <Link href={localePath(locale, `/products/${product.slug}`)} className="store-secondary-action px-4">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {copy.backToProduct}
        </Link>

        <div className="mt-10 grid gap-10 lg:grid-cols-[0.62fr_1.38fr]">
          <header className="lg:sticky lg:top-24 lg:self-start">
            <p className="store-eyebrow">{copy.releaseHistory}</p>
            <h1 className="store-section-title mt-3">{product.name} {copy.releasesTitle}</h1>
            <p className="mt-5 max-w-md leading-7 text-[hsl(var(--store-secondary))]">{copy.releasesDescription}</p>
            {source === "migration-fallback" && (
              <p className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">{copy.fallbackNotice}</p>
            )}
          </header>

          <div className="space-y-5">
            {releases.length ? releases.map((release) => {
              const downloads = release.artifacts.filter((artifact) => artifact.packageKind !== "blockmap");
              return (
                <article key={release.id} className="store-surface overflow-hidden">
                  <div className="p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="store-chip font-semibold text-[hsl(var(--store-ink))]">{release.version}</span>
                      <span className="store-chip">{release.channel}</span>
                      {release.isCurrent && <span className="store-chip border-blue-500/20 bg-blue-500/10 text-[hsl(var(--store-blue))]">{copy.currentVersion}</span>}
                    </div>
                    <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em]">{release.title}</h2>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[hsl(var(--store-secondary))]">{release.notes}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[hsl(var(--store-secondary))]">
                      <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />{copy.releaseVerified}</span>
                      {releaseDate(release.publishedAt, locale) && <time dateTime={release.publishedAt}>{releaseDate(release.publishedAt, locale)}</time>}
                    </div>
                  </div>
                  {downloads.length > 0 && (
                    <div className="grid gap-4 border-t border-[hsl(var(--store-line)/0.8)] bg-[hsl(var(--store-surface-muted)/0.55)] p-4 sm:grid-cols-2 sm:p-6">
                      {downloads.map((artifact) => <StoreDownloadCard key={artifact.id} artifact={artifact} locale={locale} compact />)}
                    </div>
                  )}
                </article>
              );
            }) : (
              <div className="store-surface p-10 text-center text-[hsl(var(--store-secondary))]">{copy.noPublishedRelease}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
