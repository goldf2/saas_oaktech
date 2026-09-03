import { PackageSearch } from "lucide-react";
import { ProductCatalog } from "@/components/product-catalog";
import { PRODUCT_CATEGORIES } from "@/config/products";
import { listPublicProducts, storeProductToSoftwareProduct } from "@/lib/store/public-data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "All Products - OakTech",
  description: "Browse browser extensions, desktop apps, and practical software from OakTech.",
};

export default async function ProductsPage() {
  const { products } = await listPublicProducts("en");
  return (
    <div className="container px-4 py-12 md:py-18">
      <div className="mb-10 max-w-2xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-accent">
          <PackageSearch className="h-5 w-5" />
        </div>
        <h1 className="text-4xl font-bold tracking-normal md:text-5xl">All products</h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          Independent tools for browser workflows, development, and focused productivity.
          Product pages show their real release status before you download or buy.
        </p>
      </div>
      <ProductCatalog products={products.map(storeProductToSoftwareProduct)} categories={PRODUCT_CATEGORIES} />
    </div>
  );
}
