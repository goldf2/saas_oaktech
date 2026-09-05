import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { localePath } from "@/i18n/config";
import type { Locale } from "@/lib/store/types";
import type { SoftwareProduct } from "@/config/products";

function statusLabel(status: SoftwareProduct["status"], locale?: Locale) {
  if (locale === "zh") {
    return { beta: "测试版", released: "已发布", "coming-soon": "即将推出" }[status];
  }
  return { beta: "Beta", released: "Released", "coming-soon": "Coming soon" }[status];
}

export function ProductCard({ product, locale }: { product: SoftwareProduct; locale?: Locale }) {
  const plainHref = `/products/${product.slug}`;
  const href = locale ? localePath(locale, plainHref) : plainHref;

  return (
    <article className="store-surface store-pressable group h-full overflow-hidden">
      <Link href={href} className="flex h-full flex-col" aria-label={`${product.name}: ${product.tagline}`}>
        <div className="relative aspect-[16/10] overflow-hidden bg-[hsl(var(--store-surface-muted))]">
          <Image
            src={product.heroImage}
            alt={`${product.name} interface preview`}
            fill
            sizes="(min-width: 1024px) 38rem, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.018]"
          />
        </div>
        <div className="flex flex-1 flex-col p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <Image
              src={product.icon}
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-2xl bg-white object-cover shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                <span className="store-chip">{product.category}</span>
                <span className="store-chip">{statusLabel(product.status, locale)}</span>
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">{product.name}</h3>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--store-surface-muted))] text-[hsl(var(--store-blue))] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
          <p className="mt-5 text-base leading-7 text-[hsl(var(--store-secondary))]">{product.tagline}</p>
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            {product.platforms.map((platform) => <span key={platform} className="text-xs font-medium text-[hsl(var(--store-secondary))]">{platform}</span>)}
          </div>
        </div>
      </Link>
    </article>
  );
}
