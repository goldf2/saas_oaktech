import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Code2,
  Headphones,
  ListChecks,
  Monitor,
  Puzzle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { PRODUCT_CATEGORIES, PRODUCTS } from "@/config/products";

const categoryIcons = { Puzzle, Monitor, Code2, Sparkles, ListChecks };

const principles = [
  {
    icon: ShieldCheck,
    title: "Clear by design",
    description: "Every product explains its permissions, data handling, and current release status.",
  },
  {
    icon: Check,
    title: "Purpose-built tools",
    description: "Small software with a defined job, direct workflows, and no inflated feature lists.",
  },
  {
    icon: Headphones,
    title: "Direct maker support",
    description: "Questions and beta feedback go to the person building and maintaining the product.",
  },
];

export default function Home() {
  const featuredProduct = PRODUCTS.find((product) => product.featured) ?? PRODUCTS[0];

  return (
    <>
      <section className="border-b bg-background">
        <div className="container grid min-h-[620px] gap-10 px-4 py-14 md:grid-cols-[0.9fr_1.1fr] md:items-center md:py-20">
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-5">Independent software store</Badge>
            <h1 className="text-4xl font-bold leading-tight tracking-normal sm:text-5xl lg:text-6xl">
              OakTech software for focused work.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Browse practical browser extensions, desktop apps, and developer
              tools built with clear pricing, transparent permissions, and direct support.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/products">
                  Browse products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/categories/browser-extensions">Browser extensions</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span>Transparent release status</span>
              <span>Local-first where possible</span>
              <span>Support from the maker</span>
            </div>
          </div>

          <Link
            href={`/products/${featuredProduct.slug}`}
            className="group relative overflow-hidden rounded-lg border bg-muted shadow-sm"
          >
            <div className="relative aspect-[11/7]">
              <Image
                src={featuredProduct.heroImage}
                alt={`${featuredProduct.name} product preview`}
                fill
                priority
                sizes="(min-width: 768px) 55vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="flex items-center gap-4 border-t bg-background p-4 sm:p-5">
              <Image
                src={featuredProduct.icon}
                alt=""
                width={48}
                height={48}
                className="rounded-lg border"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium uppercase text-muted-foreground">Featured beta</div>
                <div className="truncate font-semibold">{featuredProduct.name}</div>
              </div>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </section>

      <section className="border-b bg-muted/35 py-14 md:py-18">
        <div className="container px-4">
          <div className="mb-8 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-primary">Shop by category</p>
              <h2 className="mt-2 text-3xl font-bold tracking-normal">Tools organized around the work.</h2>
            </div>
            <Link href="/products" className="text-sm font-medium text-primary hover:underline">
              View all products
            </Link>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2 lg:grid-cols-5">
            {PRODUCT_CATEGORIES.map((category) => {
              const Icon = categoryIcons[category.icon];
              const isAvailable = category.availability === "available";
              const content = (
                <>
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent">
                    <Icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <h3 className="mt-5 font-semibold">{category.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p>
                  <span className="mt-5 text-xs font-medium text-muted-foreground">
                    {isAvailable ? "Explore category" : "Planned"}
                  </span>
                </>
              );

              return isAvailable ? (
                <Link
                  key={category.slug}
                  href={`/categories/${category.slug}`}
                  className="bg-background p-5 transition-colors hover:bg-accent/40"
                >
                  {content}
                </Link>
              ) : (
                <div key={category.slug} className="bg-background p-5">{content}</div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container px-4">
          <div className="mb-8 max-w-2xl">
            <p className="text-sm font-medium text-primary">Featured product</p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal">Available to test now.</h2>
            <p className="mt-3 text-muted-foreground">
              Start with the first OakTech browser extension and follow its progress toward release.
            </p>
          </div>
          <div className="max-w-3xl">
            <ProductCard product={featuredProduct} />
          </div>
        </div>
      </section>

      <section className="border-y bg-foreground py-16 text-background">
        <div className="container px-4">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-sm font-medium text-background/70">The OakTech standard</p>
              <h2 className="mt-2 text-3xl font-bold tracking-normal">Software you can evaluate clearly.</h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-3">
              {principles.map((principle) => (
                <div key={principle.title}>
                  <principle.icon className="h-6 w-6 text-background" />
                  <h3 className="mt-4 font-semibold">{principle.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-background/70">{principle.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container flex flex-col justify-between gap-6 px-4 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <Badge variant="secondary">Product beta</Badge>
            <h2 className="mt-4 text-3xl font-bold tracking-normal">Help shape X Tweet Extractor.</h2>
            <p className="mt-3 text-muted-foreground">
              The extension is in active development. Request beta access or send product feedback directly.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/products/x-tweet-extractor">View beta details</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
