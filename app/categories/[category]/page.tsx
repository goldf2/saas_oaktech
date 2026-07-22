import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageOpen } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import {
  PRODUCT_CATEGORIES,
  getCategoryBySlug,
  getProductsByCategory,
} from "@/config/products";

export function generateStaticParams() {
  return PRODUCT_CATEGORIES.filter((category) => category.availability === "available").map(
    (category) => ({ category: category.slug }),
  );
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);

  if (!category || category.availability !== "available") notFound();

  const products = getProductsByCategory(slug);

  return (
    <div className="container px-4 py-12 md:py-18">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        All products
      </Link>
      <div className="mt-8 max-w-2xl">
        <h1 className="text-4xl font-bold tracking-normal md:text-5xl">{category.name}</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">{category.description}</p>
      </div>
      {products.length > 0 ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {products.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      ) : (
        <div className="mt-10 border-y py-16 text-center">
          <PackageOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">Products in this category are still in development.</p>
        </div>
      )}
    </div>
  );
}
