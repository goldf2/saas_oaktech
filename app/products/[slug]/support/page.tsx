import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProductBySlug } from "@/config/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = getProductBySlug((await params).slug);
  return product
    ? { title: `${product.name} Support - OakTech`, description: `Get help with ${product.name}.` }
    : {};
}

export default async function ProductSupportPage({
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
        <div className="flex items-center gap-2 text-sm font-medium text-primary"><MessageSquareText className="h-4 w-4" /> Product support</div>
        <h1 className="mt-3 text-4xl font-bold tracking-normal md:text-5xl">Get help with {product.name}.</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">For beta access, installation questions, or feedback on an extraction workflow, contact OakTech directly.</p>
      </div>
      <div className="mt-12 grid gap-8 border-y py-10 md:grid-cols-2">
        <div><h2 className="font-semibold">Include these details</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Your browser version, the X profile URL pattern you were using, and a short description of the result you expected. Do not send exported data unless it is necessary to explain the issue.</p></div>
        <div><h2 className="font-semibold">Beta feedback</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Tell us which export format or workflow would make the product more useful. Feedback is reviewed while the public release is prepared.</p></div>
      </div>
      <Button asChild size="lg" className="mt-10"><Link href={`mailto:support@oaktech.dev?subject=${encodeURIComponent(`${product.name} support`)}`}><Mail className="mr-2 h-4 w-4" /> Email product support</Link></Button>
    </div>
  );
}
