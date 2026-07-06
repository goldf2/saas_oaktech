import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PRODUCTS, getProductBySlug } from "@/config/products";
import {
  Bookmark,
  Camera,
  Code,
  Palette,
  FileText,
  Wrench,
  Star,
  ArrowLeft,
  CheckCircle2,
  Download,
  Shield,
  Monitor,
} from "lucide-react";

const iconMap: Record<string, typeof Bookmark> = {
  BookmarkIcon: Bookmark,
  CameraIcon: Camera,
  CodeIcon: Code,
  PaletteIcon: Palette,
  FileTextIcon: FileText,
  WrenchIcon: Wrench,
};

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const Icon = iconMap[product.icon] || Wrench;

  return (
    <div className="container px-4 py-12 md:py-20">
      {/* Breadcrumb */}
      <Link
        href="/#products"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Products
      </Link>

      <div className="grid gap-12 lg:grid-cols-2">
        {/* Left: Product Info */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary/10">
              <Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-1">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            </div>
          </div>

          <p className="text-lg text-muted-foreground mb-6">{product.description}</p>

          <div className="flex items-center gap-4 mb-8 text-sm">
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{product.rating}</span>
              <span className="text-muted-foreground">rating</span>
            </span>
            <span className="text-muted-foreground">{product.downloads} downloads</span>
            <Badge variant="outline">{product.license} License</Badge>
          </div>

          {/* Features */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">What&apos;s included</h2>
            <ul className="space-y-3">
              {product.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Platforms */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Supported platforms</h2>
            <div className="flex flex-wrap gap-2">
              {product.platforms.map((platform) => (
                <Badge key={platform} variant="secondary" className="flex items-center gap-1">
                  <Monitor className="w-3 h-3" />
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Purchase Card */}
        <div>
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle className="text-2xl">Purchase {product.name}</CardTitle>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold">{product.price}</span>
                <span className="text-muted-foreground ml-2">one-time payment</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Download className="w-4 h-4 text-primary" />
                  <span>Instant download after purchase</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>Lifetime license with free updates</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>30-day money-back guarantee</span>
                </div>
              </div>

              <Button className="w-full" size="lg" asChild>
                <Link href="/sign-up">Buy Now — {product.price}</Link>
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Secure checkout powered by Creem. Need help?{" "}
                <Link href="mailto:support@oaktech.dev" className="text-primary hover:underline">
                  Contact support
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Related Products */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">You might also like</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {PRODUCTS.filter((p) => p.slug !== product.slug)
                .slice(0, 2)
                .map((related) => {
                  const RelatedIcon = iconMap[related.icon] || Wrench;
                  return (
                    <Link key={related.slug} href={`/products/${related.slug}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
                              <RelatedIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{related.name}</p>
                              <p className="text-xs text-muted-foreground">{related.price}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
