import Image from "next/image";
import Link from "next/link";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { localePath } from "@/i18n/config";
import type { Locale, ProductRelease, StoreProduct } from "@/lib/store/types";

export function DatabaseProductPage({ product, releases, locale }: { product: StoreProduct; releases: ProductRelease[]; locale: Locale }) {
  const current = releases.find((release) => release.isCurrent) ?? releases[0];
  const downloads = current?.artifacts.filter((artifact) => artifact.packageKind !== "blockmap") ?? [];
  return <div className="container px-4 py-12"><div className="grid gap-10 lg:grid-cols-2 lg:items-center"><div><div className="flex gap-2"><Badge>{product.categorySlug}</Badge><Badge variant="outline">{product.status}</Badge></div><h1 className="mt-5 text-5xl font-bold">{product.name}</h1><p className="mt-4 text-xl text-muted-foreground">{product.tagline}</p><p className="mt-4 leading-7 text-muted-foreground">{product.description}</p><Button asChild className="mt-7"><Link href={localePath(locale, `/products/${product.slug}/releases`)}>Release history</Link></Button></div><Image src={product.heroImageUrl} alt={product.name} width={1440} height={900} className="rounded-xl border" /></div>{downloads.length ? <section className="mt-14 border-t pt-10"><h2 className="text-2xl font-bold">{current?.version}</h2><div className="mt-5 flex flex-wrap gap-3">{downloads.map((artifact) => <Button key={artifact.id} asChild><a href={artifact.publicPath}><Download className="mr-2 h-4 w-4" />{artifact.platform} · {artifact.architecture}</a></Button>)}</div></section> : null}</div>;
}
