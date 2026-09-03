import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getMessages } from "@/i18n/messages";
import { localePath } from "@/i18n/config";
import type { Locale, ProductRelease, StoreDataSource, StoreProduct } from "@/lib/store/types";

export function ProductReleaseHistory({ product, releases, locale, source }: { product: StoreProduct; releases: ProductRelease[]; locale: Locale; source: StoreDataSource }) {
  const copy = getMessages(locale).gitfinder;
  return <div className="container px-4 py-12"><Link href={localePath(locale, `/products/${product.slug}`)} className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ArrowLeft className="h-4 w-4" />{copy.backToProduct}</Link><div className="mt-8 grid gap-8 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="text-sm font-medium text-primary">{copy.releaseHistory}</p><h1 className="mt-3 text-4xl font-bold">{product.name} {copy.releasesTitle}</h1><p className="mt-4 text-muted-foreground">{copy.releasesDescription}</p>{source === "migration-fallback" && <p className="mt-4 rounded-md border border-amber-400/40 p-3 text-sm">{copy.fallbackNotice}</p>}</div><div className="divide-y border-y">{releases.length ? releases.map((release) => <article key={release.id} className="py-6"><div className="flex flex-wrap gap-2"><Badge>{release.version}</Badge><Badge variant="outline">{release.channel}</Badge>{release.isCurrent && <Badge variant="secondary">{copy.currentVersion}</Badge>}</div><h2 className="mt-4 text-xl font-semibold">{release.title}</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">{release.notes}</p><p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4 text-primary" />{copy.releaseVerified}</p></article>) : <p className="py-10 text-muted-foreground">{copy.noPublishedRelease}</p>}</div></div></div>;
}
