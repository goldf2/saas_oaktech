import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Download, Monitor } from "lucide-react";
import { StoreDownloadCard } from "@/components/store-download-card";
import { localePath } from "@/i18n/config";
import type { Locale, ProductRelease, StoreProduct } from "@/lib/store/types";

const labels = {
  en: {
    beta: "Beta",
    released: "Released",
    comingSoon: "Coming soon",
    downloads: "Downloads",
    downloadTitle: "Get the current release.",
    downloadDescription: "Choose the package that matches your platform. Only verified artifacts from the published release appear here.",
    releaseHistory: "Release history",
    currentVersion: "Current version",
    platforms: "Supported platforms",
    unavailable: "No verified download is available yet.",
  },
  zh: {
    beta: "测试版",
    released: "已发布",
    comingSoon: "即将推出",
    downloads: "软件下载",
    downloadTitle: "获取当前公开版本。",
    downloadDescription: "请选择与你的平台匹配的安装包。这里仅显示正式版本中已完成校验的文件。",
    releaseHistory: "发布历史",
    currentVersion: "当前版本",
    platforms: "支持平台",
    unavailable: "目前还没有可用的已验证下载。",
  },
} as const;

export function DatabaseProductPage({ product, releases, locale }: {
  product: StoreProduct;
  releases: ProductRelease[];
  locale: Locale;
}) {
  const copy = labels[locale];
  const current = releases.find((release) => release.isCurrent) ?? releases[0];
  const downloads = current?.artifacts.filter((artifact) => artifact.packageKind !== "blockmap") ?? [];
  const status = product.status === "released" ? copy.released : product.status === "beta" ? copy.beta : copy.comingSoon;
  const releaseHref = localePath(locale, `/products/${product.slug}/releases`);

  return (
    <div className="storefront">
      <section className="py-12 sm:py-16 lg:py-24">
        <div className="store-shell grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <Image src={product.iconUrl} alt="" width={72} height={72} priority className="h-[72px] w-[72px] rounded-[1.35rem] bg-white object-cover shadow-md" />
              <span className="store-chip">{product.categorySlug.replaceAll("-", " ")}</span>
              <span className="store-chip">{status}</span>
            </div>
            <h1 className="store-title mt-7">{product.name}</h1>
            <p className="store-lede mt-6 max-w-xl">{product.tagline}</p>
            <p className="mt-4 max-w-xl leading-7 text-[hsl(var(--store-secondary))]">{product.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {downloads.length > 0 && (
                <a href="#downloads" className="store-primary-action">
                  {copy.downloads}
                  <Download className="h-4 w-4" aria-hidden="true" />
                </a>
              )}
              <Link href={releaseHref} className="store-secondary-action">
                {copy.releaseHistory}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <dl className="mt-8 grid max-w-xl grid-cols-2 gap-3">
              <div className="store-glass rounded-2xl p-4">
                <dt className="text-xs text-[hsl(var(--store-secondary))]">{copy.currentVersion}</dt>
                <dd className="mt-1 font-semibold">{current?.version ?? "—"}</dd>
              </div>
              <div className="store-glass rounded-2xl p-4">
                <dt className="text-xs text-[hsl(var(--store-secondary))]">{copy.platforms}</dt>
                <dd className="mt-1 truncate font-semibold">{product.supportedPlatforms.join(" · ") || "—"}</dd>
              </div>
            </dl>
          </div>
          <div className="store-surface overflow-hidden p-2 sm:p-3">
            <Image src={product.heroImageUrl} alt={`${product.name} interface preview`} width={1440} height={900} priority className="h-auto w-full rounded-[1.25rem]" />
          </div>
        </div>
      </section>

      <section id="downloads" className="scroll-mt-24 border-t border-[hsl(var(--store-line)/0.7)] bg-[hsl(var(--store-surface)/0.55)] py-16 sm:py-20">
        <div className="store-shell">
          <p className="store-eyebrow">{copy.downloads}</p>
          <h2 className="store-section-title mt-3">{copy.downloadTitle}</h2>
          <p className="mt-4 max-w-2xl leading-7 text-[hsl(var(--store-secondary))]">{copy.downloadDescription}</p>
          {downloads.length > 0 ? (
            <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {downloads.map((artifact) => <StoreDownloadCard key={artifact.id} artifact={artifact} locale={locale} />)}
            </div>
          ) : (
            <div className="store-surface mt-9 p-10 text-center">
              <Monitor className="mx-auto h-7 w-7 text-[hsl(var(--store-secondary))]" aria-hidden="true" />
              <p className="mt-4 text-[hsl(var(--store-secondary))]">{copy.unavailable}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
