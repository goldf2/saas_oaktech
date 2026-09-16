import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Download, KeyRound, Package, HeadphonesIcon, Sparkles } from "lucide-react";
import { listPublicProducts } from "@/lib/store/public-data";
import { getStoreAdmin } from "@/lib/store/admin";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard - OakTech",
  description: "Manage your OakTech software licenses and downloads.",
};

export default async function DashboardPage() {
  if (!(await getCurrentUser())) redirect("/sign-in");
  const [admin, { products }] = await Promise.all([getStoreAdmin(), listPublicProducts("zh")]);
  const availableProducts = products.filter((product) => product.status !== "coming-soon");
  const categoryNames: Record<string, string> = { "desktop-apps": "桌面应用", "trading-tools": "交易研究工具", "browser-extensions": "浏览器扩展", "developer-tools": "开发工具" };
  const statusNames = { beta: "测试版", released: "已发布", "coming-soon": "即将推出" };

  return (
    <div className="container px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Your Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Manage your software licenses, downloads, and account settings.
      </p>

      <section className="mb-8 rounded-xl border bg-muted/20 p-6" data-testid="store-admin-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-xl font-semibold">商品与软件发布后台</h2><p className="mt-2 text-sm text-muted-foreground">{admin ? "你已拥有管理员权限，可添加商品、编辑资料和发布软件版本。" : "这是个人中心。当前账号没有商品管理权限，可进入管理入口查看授权说明。"}</p></div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline"><Link href="/admin">{admin ? "进入商品后台" : "管理入口 / 权限说明"}</Link></Button>
            {admin && <><Button asChild><Link href="/admin/products/new">新增商品</Link></Button><Button asChild variant="outline"><Link href="/admin/releases">软件版本发布</Link></Button></>}
          </div>
        </div>
      </section>

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
            <CardTitle className="text-sm font-medium">公开商品</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableProducts.length}</div>
            <p className="text-xs text-muted-foreground">与商城的实际公开目录保持一致</p>
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
          <h2 className="text-xl font-semibold">商城公开商品</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">缠序是交易研究工具，open play 是 Auth 认证管理工具，各自使用独立商品资料。这里仅显示当前目录中已公开的商品。</p>
        {availableProducts.length === 0 && <p className="rounded-lg border p-5 text-muted-foreground">当前目录暂无已公开商品。</p>}
        <div className="grid gap-4 lg:grid-cols-2" data-testid="dashboard-products">
          {availableProducts.map((product) => (
            <Card key={product.slug} data-product-slug={product.slug}>
              <CardContent className="flex gap-4 p-5">
                <Image src={product.iconUrl} alt="" width={48} height={48} className="h-12 w-12 rounded-lg border" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2"><Badge variant="secondary">{categoryNames[product.categorySlug] ?? product.categorySlug}</Badge><Badge variant="outline">{statusNames[product.status]}</Badge></div>
                  <h3 className="mt-3 font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{product.tagline}</p>
                  <Button asChild variant="ghost" size="sm" className="mt-3 -ml-3">
                    <Link href={`/zh/products/${product.slug}`}>查看商品详情 <ArrowRight className="ml-2 h-4 w-4" /></Link>
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
