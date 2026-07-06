import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, KeyRound, Package, HeadphonesIcon } from "lucide-react";

export const metadata = {
  title: "Dashboard - OakTech",
  description: "Manage your OakTech software licenses and downloads.",
};

export default function DashboardPage() {
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
            <p className="text-xs text-muted-foreground">Lifetime licenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Available for download</p>
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
              <Link href="/#products">Browse Products</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

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
