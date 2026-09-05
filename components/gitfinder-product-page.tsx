import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Download, Monitor, ShieldCheck } from "lucide-react";
import { StoreDownloadCard } from "@/components/store-download-card";
import { getMessages } from "@/i18n/messages";
import { localePath } from "@/i18n/config";
import type { Locale, ProductRelease, StoreDataSource, StoreProduct } from "@/lib/store/types";

function formatPublishedAt(value: string | undefined, locale: Locale) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function GitFinderProductPage({ product, locale, releases, source }: {
  product: StoreProduct;
  locale: Locale;
  releases: ProductRelease[];
  source: StoreDataSource;
}) {
  const copy = getMessages(locale).gitfinder;
  const current = releases.find((release) => release.isCurrent) ?? releases[0];
  const downloads = current?.artifacts.filter((artifact) => artifact.packageKind !== "blockmap") ?? [];
  const releaseHref = localePath(locale, "/products/gitfinder-2/releases");

  return (
    <div className="storefront">
      <section className="relative py-12 sm:py-16 lg:py-24">
        <div aria-hidden="true" className="pointer-events-none absolute right-[-8rem] top-[-10rem] h-96 w-96 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/10" />
        <div className="store-shell relative grid gap-12 lg:grid-cols-[0.83fr_1.17fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Image src={product.iconUrl} alt="" width={72} height={72} priority className="h-[72px] w-[72px] rounded-[1.35rem] bg-white object-cover shadow-md" />
              <span className="store-chip">{copy.category}</span>
              <span className="store-chip"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" />{copy.statusBeta}</span>
            </div>
            <h1 className="store-title mt-7">{product.name}</h1>
            <p className="store-lede mt-6 max-w-xl">{product.tagline || copy.tagline}</p>
            <p className="mt-4 max-w-xl text-base leading-7 text-[hsl(var(--store-secondary))]">{product.description || copy.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#downloads" className="store-primary-action">
                {copy.viewDownloads}
                <Download className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link href={releaseHref} className="store-secondary-action">
                {copy.releaseNotes}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <dl className="store-glass mt-8 grid grid-cols-3 overflow-hidden rounded-2xl">
              <div className="p-4 sm:p-5">
                <dt className="text-[0.7rem] font-medium text-[hsl(var(--store-secondary))]">{source === "catalog" ? copy.currentVersion : copy.legacyVersion}</dt>
                <dd className="mt-1 truncate text-sm font-semibold sm:text-base">{current?.version ?? "—"}</dd>
              </div>
              <div className="border-x border-[hsl(var(--store-line)/0.8)] p-4 sm:p-5">
                <dt className="text-[0.7rem] font-medium text-[hsl(var(--store-secondary))]">{copy.releaseChannel}</dt>
                <dd className="mt-1 text-sm font-semibold sm:text-base">{current?.channel ?? "—"}</dd>
              </div>
              <div className="p-4 sm:p-5">
                <dt className="text-[0.7rem] font-medium text-[hsl(var(--store-secondary))]">{copy.published}</dt>
                <dd className="mt-1 text-sm font-semibold sm:text-base">{formatPublishedAt(current?.publishedAt, locale)}</dd>
              </div>
            </dl>

            {source === "migration-fallback" && (
              <p className="mt-5 rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">{copy.fallbackNotice}</p>
            )}
          </div>

          <div className="store-surface overflow-hidden bg-slate-950 p-2 sm:p-3">
            <Image src={product.heroImageUrl} alt={`${product.name} workspace preview`} width={1440} height={900} priority className="h-auto w-full rounded-[1.25rem]" />
          </div>
        </div>
      </section>

      <section className="border-y border-[hsl(var(--store-line)/0.7)] bg-[hsl(var(--store-surface)/0.55)] py-16 sm:py-20">
        <div className="store-shell">
          <p className="store-eyebrow">{copy.featuresEyebrow}</p>
          <h2 className="store-section-title mt-3 max-w-3xl">{copy.featuresTitle}</h2>
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {copy.features.map((feature) => (
              <article key={feature} className="store-surface p-6">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--store-blue))]" aria-hidden="true" />
                <p className="mt-5 text-sm leading-6">{feature}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="downloads" className="scroll-mt-24 py-16 sm:py-24">
        <div className="store-shell">
          <div className="grid gap-5 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <p className="store-eyebrow">{copy.downloadsEyebrow}</p>
              <h2 className="store-section-title mt-3">{copy.downloadsTitle}</h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-[hsl(var(--store-secondary))] lg:justify-self-end">{copy.downloadsDescription}</p>
          </div>

          {downloads.length ? (
            <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {downloads.map((artifact) => <StoreDownloadCard key={artifact.id} artifact={artifact} locale={locale} />)}
            </div>
          ) : (
            <div className="store-surface mt-9 p-10 text-center">
              <Monitor className="mx-auto h-7 w-7 text-[hsl(var(--store-secondary))]" aria-hidden="true" />
              <h3 className="mt-4 font-semibold">{copy.unavailable}</h3>
              <p className="mt-2 text-sm text-[hsl(var(--store-secondary))]">{copy.unavailableHelp}</p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-[hsl(var(--store-surface-muted))] px-5 py-4">
            <p className="flex items-center gap-2 text-sm text-[hsl(var(--store-secondary))]">
              <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              {copy.releaseVerified}
            </p>
            <Link href={releaseHref} className="text-sm font-semibold text-[hsl(var(--store-blue))] hover:underline">{copy.releaseNotes}</Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[hsl(var(--store-line)/0.7)] bg-[hsl(var(--store-surface)/0.55)] py-16 sm:py-20">
        <div className="store-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="store-eyebrow">{copy.installation}</p>
            <h2 className="store-section-title mt-3">{copy.installationTitle}</h2>
            <p className="mt-4 max-w-md leading-7 text-[hsl(var(--store-secondary))]">{copy.installationDescription}</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {copy.installSteps.map((step, index) => (
              <li key={step} className="store-surface p-5">
                <span className="text-sm font-semibold text-[hsl(var(--store-blue))]">0{index + 1}</span>
                <p className="mt-4 text-sm leading-6">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="store-shell grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
          <div>
            <p className="store-eyebrow">{copy.questions}</p>
            <h2 className="store-section-title mt-3">{copy.questionsTitle}</h2>
          </div>
          <div className="store-surface divide-y divide-[hsl(var(--store-line)/0.8)] px-6 sm:px-8">
            {copy.faqs.map(([question, answer]) => (
              <details key={question} className="group py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  {question}
                  <span aria-hidden="true" className="text-xl font-light text-[hsl(var(--store-secondary))] transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-2xl pt-3 text-sm leading-6 text-[hsl(var(--store-secondary))]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
