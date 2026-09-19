import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProductBySlug } from "@/config/products";
import { getRequestLanguage } from "@/i18n/server";
import { pageCopy } from "@/i18n/page-copy";
import { localizedConfiguredProduct } from "@/i18n/product-config-copy";
import { localePath } from "@/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, { locale }] = await Promise.all([params, getRequestLanguage()]);
  const original = getProductBySlug(slug);
  if (!original) return {};
  const product = localizedConfiguredProduct(original, locale);
  return { title: `${locale === "zh" ? "安装" : "Install"} ${product.name} - OakTech`, description: pageCopy(locale).productUtility.installDescription };
}
export default async function ProductInstallPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { locale }] = await Promise.all([params, getRequestLanguage()]);
  const original = getProductBySlug(slug);
  if (!original) notFound();
  const product = localizedConfiguredProduct(original, locale);
  const copy = pageCopy(locale).productUtility;
  return <div className="container px-4 py-12 md:py-18" data-page-locale={locale} data-testid="product-install-page">
    <Link href={localePath(locale, `/products/${product.slug}`)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{product.name}</Link>
    <div className="mt-8 grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
      <div><div className="flex items-center gap-3"><Image src={product.icon} alt="" width={48} height={48} className="rounded-lg border" /><span className="text-sm font-medium text-primary">{copy.install}</span></div>
        <h1 className="mt-5 text-4xl font-bold tracking-normal md:text-5xl">{copy.installTitle(product.name)}</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">{copy.installDescription}</p>
        <Button asChild size="lg" className="mt-8"><Link href={`mailto:support@oaktech.dev?subject=${encodeURIComponent(`${product.name} support`)}`}>{copy.request}<ExternalLink className="ml-2 h-4 w-4" /></Link></Button>
      </div>
      <ol className="grid gap-4 sm:grid-cols-2">{product.installSteps.map((step,index)=><li key={step} className="border p-5"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-sm font-semibold text-accent-foreground">{index+1}</span><p className="mt-5 text-sm leading-6">{step}</p></li>)}</ol>
    </div>
    <section className="mt-16 border-t pt-10"><div className="flex items-center gap-2 text-sm font-medium"><Wrench className="h-4 w-4 text-primary" />{copy.before}</div><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.beforeText}</p></section>
  </div>;
}
