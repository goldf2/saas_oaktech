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
    <div className="storefront py-12 sm:py-16 lg:py-20">
      <div className="store-shell">
      <div className="mb-10 max-w-2xl">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[hsl(var(--store-surface-muted))] text-[hsl(var(--store-blue))]">
          <PackageSearch className="h-5 w-5" />
        </div>
        <h1 className="store-title">All products</h1>
        <p className="store-lede mt-5">
          Independent tools for browser workflows, development, and focused productivity.
          Product pages show their real release status before you download or buy.
        </p>
      </div>
      <ProductCatalog products={products.map(storeProductToSoftwareProduct)} categories={PRODUCT_CATEGORIES} locale="en" />
      </div>
    </div>
  );
}
