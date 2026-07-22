import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PRODUCT_STATUS_LABELS,
  type SoftwareProduct,
} from "@/config/products";

export function ProductCard({ product }: { product: SoftwareProduct }) {
  return (
    <Card className="group h-full overflow-hidden transition-colors hover:border-primary/50">
      <div className="relative aspect-[11/7] overflow-hidden border-b bg-muted">
        <Image
          src={product.heroImage}
          alt={`${product.name} interface preview`}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          loading="eager"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <CardContent className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <Image
            src={product.icon}
            alt=""
            width={52}
            height={52}
            className="h-[52px] w-[52px] rounded-lg border bg-background"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{product.category}</Badge>
              <Badge variant="outline">{PRODUCT_STATUS_LABELS[product.status]}</Badge>
            </div>
            <h3 className="text-xl font-semibold">{product.name}</h3>
          </div>
        </div>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {product.tagline}
        </p>
        <div className="mt-5 flex items-center justify-between gap-4 border-t pt-4">
          <span className="text-sm font-medium">{product.price}</span>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/products/${product.slug}`}>
              View product
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
