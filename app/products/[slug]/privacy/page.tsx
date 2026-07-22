import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { getProductBySlug } from "@/config/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = getProductBySlug((await params).slug);
  return product
    ? { title: `${product.name} Privacy - OakTech`, description: `Data and permission details for ${product.name}.` }
    : {};
}

export default async function ProductPrivacyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = getProductBySlug((await params).slug);
  if (!product) notFound();

  return (
    <div className="container px-4 py-12 md:py-18">
      <Link href={`/products/${product.slug}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {product.name}
      </Link>
      <div className="mt-8 max-w-3xl">
        <div className="flex items-center gap-2 text-sm font-medium text-primary"><LockKeyhole className="h-4 w-4" /> Product privacy</div>
        <h1 className="mt-3 text-4xl font-bold tracking-normal md:text-5xl">{product.name} privacy details.</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">This page explains the product-specific data handling and browser permissions for the current build.</p>
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <h2 className="text-2xl font-semibold">Local processing</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{product.name} runs its extraction on the supported website in your browser. Export files are created only when you request them and are saved to your computer.</p>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">OakTech does not receive the extracted profile content through the extension.</p>
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
      <section className="mt-14 border-t pt-10">
        <h2 className="text-2xl font-semibold">Questions or deletion requests</h2>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">For website account and payment data, read the <Link href="/privacy" className="text-primary hover:underline">OakTech Privacy Policy</Link>. For questions about this product&apos;s local data handling, contact <Link href={`mailto:support@oaktech.dev?subject=${encodeURIComponent(`${product.name} privacy question`)}`} className="text-primary hover:underline">support@oaktech.dev</Link>.</p>
      </section>
    </div>
  );
}
