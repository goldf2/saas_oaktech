import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProductBySlug } from "@/config/products";
import { getRequestLanguage } from "@/i18n/server";
import { pageCopy } from "@/i18n/page-copy";
import { localizedConfiguredProduct } from "@/i18n/product-config-copy";
import { localePath } from "@/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{slug},{locale}]=await Promise.all([params,getRequestLanguage()]);
  const original=getProductBySlug(slug); if(!original) return {};
  const product=localizedConfiguredProduct(original,locale);
  return {title:`${product.name} ${locale==="zh"?"支持":"Support"} - OakTech`,description:pageCopy(locale).productUtility.supportDescription};
}
export default async function ProductSupportPage({params}:{params:Promise<{slug:string}>}) {
  const [{slug},{locale}]=await Promise.all([params,getRequestLanguage()]);
  const original=getProductBySlug(slug); if(!original) notFound();
  const product=localizedConfiguredProduct(original,locale); const copy=pageCopy(locale).productUtility;
  return <div className="container px-4 py-12 md:py-18" data-page-locale={locale} data-testid="product-support-page">
    <Link href={localePath(locale,`/products/${product.slug}`)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{product.name}</Link>
    <div className="mt-8 max-w-3xl"><div className="flex items-center gap-2 text-sm font-medium text-primary"><MessageSquareText className="h-4 w-4" />{copy.support}</div><h1 className="mt-3 text-4xl font-bold tracking-normal md:text-5xl">{copy.supportTitle(product.name)}</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{copy.supportDescription}</p></div>
    <div className="mt-12 grid gap-8 border-y py-10 md:grid-cols-2"><div><h2 className="font-semibold">{copy.details}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.detailsText}</p></div><div><h2 className="font-semibold">{copy.feedback}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{copy.feedbackText}</p></div></div>
    <Button asChild size="lg" className="mt-10"><Link href={`mailto:support@oaktech.dev?subject=${encodeURIComponent(`${product.name} support`)}`}><Mail className="mr-2 h-4 w-4" />{copy.emailSupport}</Link></Button>
  </div>;
}
