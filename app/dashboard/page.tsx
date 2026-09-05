import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Download, KeyRound, Package, HeadphonesIcon, Sparkles } from "lucide-react";
import { PRODUCTS, PRODUCT_STATUS_LABELS } from "@/config/products";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard - OakTech",
  description: "Manage your OakTech software licenses and downloads.",
};

export default async function DashboardPage() {
  if (!(await getCurrentUser())) redirect("/sign-in");

  return (
    <div className="container px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Your Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Manage your software licenses, downloads, and account settings.
      </p>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Owned Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Browse and purchase tools</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Products you can access now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Betas</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{PRODUCTS.filter((product) => product.status === "beta").length}</div>
            <p className="text-xs text-muted-foreground">Request access from the product page</p>
          </CardContent>
        </Card>
      </div>

      {/* Owned Products */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Software Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              You haven&apos;t purchased any products yet.
            </p>
            <Button asChild>
              <Link href="/products">Browse Products</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Available to try</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {PRODUCTS.filter((product) => product.status === "beta").map((product) => (
            <Card key={product.slug}>
              <CardContent className="flex gap-4 p-5">
                <Image src={product.icon} alt="" width={48} height={48} className="h-12 w-12 rounded-lg border" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2"><Badge variant="secondary">{product.category}</Badge><Badge variant="outline">{PRODUCT_STATUS_LABELS[product.status]}</Badge></div>
                  <h3 className="mt-3 font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{product.tagline}</p>
                  <Button asChild variant="ghost" size="sm" className="mt-3 -ml-3">
                    <Link href={`/products/${product.slug}`}>View beta details <ArrowRight className="ml-2 h-4 w-4" /></Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HeadphonesIcon className="w-5 h-5 text-primary" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Our support team is here to help with any questions about your
            licenses, downloads, or account.
          </p>
          <Button asChild variant="outline">
            <Link href="mailto:support@oaktech.dev">Contact Support</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
