import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { getProductBySlug } from "@/config/products";
import { getRequestLanguage } from "@/i18n/server";
import { pageCopy } from "@/i18n/page-copy";
import { localizedConfiguredProduct } from "@/i18n/product-config-copy";
import { localePath } from "@/i18n/config";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, { locale }] = await Promise.all([params, getRequestLanguage()]);
  const original = getProductBySlug(slug);
  if (!original) return {};
  const product=localizedConfiguredProduct(original,locale);
  return { title: `${product.name} ${locale==="zh"?"隐私":"Privacy"} - OakTech`, description: pageCopy(locale).productUtility.privacyDescription };
}
export default async function ProductPrivacyPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, { locale }] = await Promise.all([params, getRequestLanguage()]);
  const original=getProductBySlug(slug); if(!original) notFound();
  const product=localizedConfiguredProduct(original,locale); const copy=pageCopy(locale).productUtility;
  return <div className="container px-4 py-12 md:py-18" data-page-locale={locale} data-testid="product-privacy-page">
    <Link href={localePath(locale,`/products/${product.slug}`)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{product.name}</Link>
    <div className="mt-8 max-w-3xl"><div className="flex items-center gap-2 text-sm font-medium text-primary"><LockKeyhole className="h-4 w-4" />{copy.privacy}</div><h1 className="mt-3 text-4xl font-bold tracking-normal md:text-5xl">{copy.privacyTitle(product.name)}</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">{copy.privacyDescription}</p></div>
    <div className="mt-12 grid gap-10 lg:grid-cols-[0.75fr_1.25fr]"><div><h2 className="text-2xl font-semibold">{copy.local}</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">{copy.localText(product.name)}</p><p className="mt-4 text-sm leading-6 text-muted-foreground">{copy.noUpload}</p></div>
      <div className="divide-y border-y">{product.permissions.length ? product.permissions.map(permission=><div key={permission.name} className="grid gap-2 py-5 sm:grid-cols-[180px_1fr]"><code className="text-sm font-semibold">{permission.name}</code><p className="text-sm leading-6 text-muted-foreground">{permission.description}</p></div>) : <p className="py-5 text-sm text-muted-foreground">{locale==="zh"?"当前产品没有额外列出的浏览器权限。":"No additional browser permissions are listed for this product."}</p>}</div>
    </div>
    <section className="mt-14 border-t pt-10"><h2 className="text-2xl font-semibold">{copy.questions}</h2><p className="mt-4 text-sm leading-6 text-muted-foreground">{copy.questionsText} <Link href="/privacy" className="text-primary hover:underline">{locale==="zh"?"OakTech 隐私政策":"OakTech Privacy Policy"}</Link> · <Link href={`mailto:support@oaktech.dev?subject=${encodeURIComponent(`${product.name} privacy`)}`} className="text-primary hover:underline">support@oaktech.dev</Link></p></section>
  </div>;
}
