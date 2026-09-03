import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CircleHelp,
  Clock3,
  ExternalLink,
  Globe2,
  LockKeyhole,
  Monitor,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { GitFinderProductPage } from "@/components/gitfinder-product-page";
import { DatabaseProductPage } from "@/components/database-product-page";
import { getPublicProduct, getPublishedProductReleases } from "@/lib/store/public-data";
import {
  PRODUCTS,
  PRODUCT_STATUS_LABELS,
  getProductBySlug,
} from "@/config/products";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getPublicProduct(slug, "en");
  if (!product) return {};

  return {
    title: `${product.name} - OakTech`,
    description: product.description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [{ product: storeProduct, source }, releaseData] = await Promise.all([
    getPublicProduct(slug, "en"),
    getPublishedProductReleases(slug, "en"),
  ]);
  if (!storeProduct) notFound();

  if (storeProduct.slug === "gitfinder-2") {
    return <GitFinderProductPage product={storeProduct} locale="en" releases={releaseData.releases} source={releaseData.source === "migration-fallback" ? releaseData.source : source} />;
  }

  const configuredProduct = getProductBySlug(slug);
  if (!configuredProduct) return <DatabaseProductPage product={storeProduct} releases={releaseData.releases} locale="en" />;
  const product = { ...configuredProduct, name: storeProduct.name, tagline: storeProduct.tagline, description: storeProduct.description, icon: storeProduct.iconUrl, heroImage: storeProduct.heroImageUrl, platforms: storeProduct.supportedPlatforms, status: storeProduct.status };

  const relatedProducts = PRODUCTS.filter(
    (item) => item.slug !== product.slug && item.categorySlug === product.categorySlug,
  );

  return (
    <>
      <section className="border-b">
        <div className="container px-4 py-8 md:py-12">
          <Link href={`/categories/${product.categorySlug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {product.category}
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="flex items-center gap-4">
                <Image src={product.icon} alt="" width={64} height={64} className="rounded-xl border" />
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{product.category}</Badge>
                  <Badge variant="outline">{PRODUCT_STATUS_LABELS[product.status]}</Badge>
                </div>
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-normal md:text-5xl">{product.name}</h1>
              <p className="mt-4 text-xl leading-8 text-muted-foreground">{product.tagline}</p>
              <p className="mt-5 leading-7 text-muted-foreground">{product.description}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="mailto:support@oaktech.dev?subject=X%20Tweet%20Extractor%20beta%20access">
                    Request beta access
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href={`/products/${product.slug}/install`}>Installation steps</Link>
                </Button>
              </div>
              <div className="mt-7 flex flex-wrap gap-2">
                {product.browsers.map((browser) => <Badge key={browser} variant="secondary">{browser}</Badge>)}
                <Badge variant="secondary">{product.price}</Badge>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border bg-muted shadow-sm">
              <Image
                src={product.screenshots[0]}
                alt={`${product.name} extension interface`}
                width={1440}
                height={900}
                priority
                className="h-auto w-full"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18">
        <div className="container grid gap-10 px-4 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <p className="text-sm font-medium text-primary">What it does</p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal">Export visible profile content with control.</h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {product.features.map((feature) => (
                <li key={feature} className="flex gap-3 border-t pt-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm leading-6">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <aside className="border-l-0 border-border lg:border-l lg:pl-8">
            <div className="flex items-center gap-2 text-sm font-medium"><Monitor className="h-4 w-4" /> Compatible platforms</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {product.platforms.map((platform) => <Badge key={platform} variant="outline">{platform}</Badge>)}
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm font-medium"><Globe2 className="h-4 w-4" /> Current availability</div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This product is in beta. Access is currently distributed directly while the Chrome Web Store release is prepared.
            </p>
          </aside>
        </div>
      </section>

      <section id="installation" className="border-y bg-muted/35 py-14 md:py-18">
        <div className="container grid gap-10 px-4 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-medium text-primary">Beta installation</p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal">From profile to export in four steps.</h2>
            <p className="mt-4 text-muted-foreground">The beta is currently tested through Chrome Developer mode before public store distribution.</p>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2">
            {product.installSteps.map((step, index) => (
              <li key={step} className="border bg-background p-5">
                <span className="text-sm font-semibold text-primary">0{index + 1}</span>
                <p className="mt-4 text-sm leading-6">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-14 md:py-18">
        <div className="container grid gap-10 px-4 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary"><Clock3 className="h-4 w-4" /> Product progress</div>
            <h2 className="mt-2 text-3xl font-bold tracking-normal">Current build and what comes next.</h2>
            <p className="mt-4 text-muted-foreground">Release notes make the product state visible before you request access or install a build.</p>
          </div>
          <div className="divide-y border-y">
            {product.releaseNotes.map((note) => (
              <div key={note.title} className="grid gap-3 py-6 sm:grid-cols-[130px_1fr]">
                <span className="text-sm font-semibold text-primary">{note.label}</span>
                <div>
                  <h3 className="font-semibold">{note.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{note.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-18">
        <div className="container grid gap-10 px-4 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary"><LockKeyhole className="h-4 w-4" /> Privacy and permissions</div>
            <h2 className="mt-2 text-3xl font-bold tracking-normal">What the extension can access.</h2>
            <p className="mt-4 text-muted-foreground">Extraction runs on the X page in your browser. Export files are saved locally and the extension does not send tweet text to an OakTech service.</p>
          </div>
          <div className="divide-y border-y">
            {product.permissions.map((permission) => (
              <div key={permission.name} className="grid gap-2 py-5 sm:grid-cols-[180px_1fr]">
                <code className="text-sm font-semibold">{permission.name}</code>
                <p className="text-sm leading-6 text-muted-foreground">{permission.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t py-14 md:py-18">
        <div className="container flex flex-col justify-between gap-6 px-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="h-4 w-4 text-primary" /> Built for personal backup and research</div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">You are responsible for complying with X terms and applicable laws when you use exported data.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline"><Link href={`/products/${product.slug}/privacy`}>Product privacy</Link></Button>
            <Button asChild variant="outline"><Link href={`/products/${product.slug}/support`}>Product support</Link></Button>
          </div>
        </div>
      </section>

      <section className="border-t py-14 md:py-18">
        <div className="container grid gap-10 px-4 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary"><CircleHelp className="h-4 w-4" /> Product FAQ</div>
            <h2 className="mt-2 text-3xl font-bold tracking-normal">Before you install.</h2>
            <p className="mt-4 text-muted-foreground">Common questions about the current beta, data handling, and exports.</p>
          </div>
          <div className="divide-y border-y">
            {product.faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {faq.question}
                  <span aria-hidden className="text-lg text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-2xl pt-3 text-sm leading-6 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="border-t py-14">
          <div className="container px-4"><h2 className="text-2xl font-bold">More in {product.category}</h2><div className="mt-6 grid gap-6 lg:grid-cols-2">{relatedProducts.map((item) => <ProductCard key={item.slug} product={item} />)}</div></div>
        </section>
      )}
    </>
  );
}
