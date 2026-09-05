"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProductCard } from "@/components/product-card";
import {
  PRODUCT_STATUS_LABELS,
  type ProductCategory,
  type SoftwareProduct,
} from "@/config/products";
import type { Locale } from "@/lib/store/types";

type CatalogProps = {
  products: SoftwareProduct[];
  categories: ProductCategory[];
  showCategoryFilter?: boolean;
  locale?: Locale;
};

const STATUS_VALUES = ["beta", "released", "coming-soon"] as const;

function isStatus(value: string | null): value is SoftwareProduct["status"] {
  return STATUS_VALUES.some((status) => status === value);
}

export function ProductCatalog({
  products,
  categories,
  showCategoryFilter = true,
  locale,
}: CatalogProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "all";
  const status = searchParams.get("status");
  const platform = searchParams.get("platform") ?? "all";
  const sort = searchParams.get("sort") === "name" ? "name" : "featured";
  const platforms = useMemo(
    () => Array.from(new Set(products.flatMap((product) => product.platforms))).sort(),
    [products],
  );
  const availableCategories = useMemo(
    () => categories.filter((item) => products.some((product) => product.categorySlug === item.slug)),
    [categories, products],
  );
  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products
      .filter((product) => {
        const matchesQuery = !normalizedQuery || [product.name, product.tagline, product.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
        const matchesCategory = !showCategoryFilter || category === "all" || product.categorySlug === category;
        const matchesStatus = !isStatus(status) || product.status === status;
        const matchesPlatform = platform === "all" || product.platforms.includes(platform);
        return matchesQuery && matchesCategory && matchesStatus && matchesPlatform;
      })
      .sort((left, right) => {
        if (sort === "name") return left.name.localeCompare(right.name);
        return Number(right.featured) - Number(left.featured) || left.name.localeCompare(right.name);
      });
  }, [category, platform, products, query, showCategoryFilter, sort, status]);

  function updateParam(name: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "all" || (name === "sort" && value === "featured")) {
      params.delete(name);
    } else {
      params.set(name, value);
    }
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  function resetFilters() {
    router.replace(pathname, { scroll: false });
  }

  const hasFilters = Boolean(query || (showCategoryFilter && category !== "all") || status || platform !== "all" || sort !== "featured");

  return (
    <div>
      <div className="store-glass rounded-[1.5rem] p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px_180px_150px_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => updateParam("q", event.target.value)}
              placeholder="Search products"
              className="h-11 rounded-full border-[hsl(var(--store-line))] bg-[hsl(var(--store-surface))] pl-9"
            />
          </label>
          {showCategoryFilter && (
            <select
              value={category}
              onChange={(event) => updateParam("category", event.target.value)}
              aria-label="Filter by category"
              className="h-11 w-full rounded-full border border-[hsl(var(--store-line))] bg-[hsl(var(--store-surface))] px-3 text-sm"
            >
              <option value="all">All categories</option>
              {availableCategories.map((item) => <option key={item.slug} value={item.slug}>{item.name}</option>)}
            </select>
          )}
          <select
            value={status ?? "all"}
            onChange={(event) => updateParam("status", event.target.value)}
            aria-label="Filter by release status"
            className="h-11 w-full rounded-full border border-[hsl(var(--store-line))] bg-[hsl(var(--store-surface))] px-3 text-sm"
          >
            <option value="all">All statuses</option>
            {STATUS_VALUES.filter((value) => products.some((product) => product.status === value)).map((value) => (
              <option key={value} value={value}>{PRODUCT_STATUS_LABELS[value]}</option>
            ))}
          </select>
          <select
            value={platform}
            onChange={(event) => updateParam("platform", event.target.value)}
            aria-label="Filter by platform"
            className="h-11 w-full rounded-full border border-[hsl(var(--store-line))] bg-[hsl(var(--store-surface))] px-3 text-sm"
          >
            <option value="all">All platforms</option>
            {platforms.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select
            value={sort}
            onChange={(event) => updateParam("sort", event.target.value)}
            aria-label="Sort products"
            className="h-11 w-full rounded-full border border-[hsl(var(--store-line))] bg-[hsl(var(--store-surface))] px-3 text-sm"
          >
            <option value="featured">Featured first</option>
            <option value="name">Name</option>
          </select>
          {hasFilters ? (
            <Button type="button" variant="ghost" onClick={resetFilters} className="h-11 justify-start rounded-full lg:justify-center">
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          ) : (
            <div className="hidden lg:block" />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between py-6 text-sm">
        <span className="font-medium">{filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"}</span>
        <span className="flex items-center gap-2 text-muted-foreground"><SlidersHorizontal className="h-4 w-4" /> Filters update this link</span>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {filteredProducts.map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}
        </div>
      ) : (
        <div className="store-surface py-16 text-center">
          <h2 className="text-xl font-semibold">No products match these filters.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Try another search term or clear the active filters.</p>
          <Button type="button" variant="outline" className="mt-6 rounded-full" onClick={resetFilters}>Clear filters</Button>
        </div>
      )}
    </div>
  );
}
