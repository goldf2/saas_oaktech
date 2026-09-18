import Link from "next/link";
import { redirect } from "next/navigation";
import { HeadphonesIcon, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoreAdmin } from "@/lib/store/admin";
import { getCurrentUser } from "@/lib/auth";
import { ProductManagement, type ProductManagementQuery } from "@/components/admin/product-management";
import { workspaceView, workspaceSections, workspaceProductsHref } from "@/lib/store/workspace-navigation";

export const dynamic = "force-dynamic";
export const metadata = { title: "工作台 - OakTech", description: "商品浏览与管理、软件下载与版本发布、账号与支持。" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<ProductManagementQuery & { view?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const [admin, query] = await Promise.all([getStoreAdmin(), searchParams]);
  if (query.view === "library") redirect(workspaceProductsHref(query));
  const view = workspaceView(query.view, Boolean(admin));
  return <div className="container max-w-7xl px-3 py-5 sm:px-4" data-testid="workspace-dashboard" data-workspace-role={admin ? "admin" : "user"}>
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-sm font-medium text-primary">OakTech</p><h1 className="mt-1 text-2xl font-semibold">工作台</h1><p className="mt-2 text-sm text-muted-foreground">{admin ? "在同一列表查看商品、管理资料与软件版本；两者分别发布。" : "浏览已公开商品及软件下载，访问账号与获取支持。"}</p></div>
      <Button asChild variant="outline" size="sm"><Link href="/products">返回商城</Link></Button>
    </header>
    <nav data-testid="workspace-navigation" aria-label="工作台功能" className="my-5 flex flex-wrap gap-2 border-b pb-3">{workspaceSections(Boolean(admin)).map(item => <Button key={item.view} asChild size="sm" variant={view === item.view ? "default" : "outline"}><Link href={item.href} aria-current={view === item.view ? "page" : undefined}>{item.label}</Link></Button>)}</nav>
    {view === "products" ? <ProductManagement searchParams={Promise.resolve(query)} /> : <section data-testid="workspace-account" className="grid gap-4 md:grid-cols-2">
      <article className="min-w-0 rounded-xl border p-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><UserRound className="h-5 w-5" />账号</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-muted-foreground">当前账号</dt><dd className="mt-1 break-words">{user.email || user.name || "已登录账号"}</dd></div><div><dt className="text-muted-foreground">工作台权限</dt><dd className="mt-1">{admin ? "商城管理员" : "普通用户"}</dd></div><div><dt className="text-muted-foreground">登录方式</dt><dd className="mt-1">{user.provider === "casdoor" ? "Casdoor 统一登录" : "邮箱账号"}</dd></div></dl>
        {user.provider === "casdoor" ? <p className="mt-4 text-sm text-muted-foreground">当前密码由统一身份服务管理；工作台不会另建或显示你的密码。</p> : <Button asChild variant="outline" className="mt-4"><Link href="/dashboard/reset-password">修改密码</Link></Button>}
        <p className="mt-4 text-xs text-muted-foreground">购买与许可证统计尚未接入，暂不显示固定为零的数量或未核实的购买结论。</p>
      </article>
      <article className="rounded-xl border p-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><HeadphonesIcon className="h-5 w-5" />帮助与支持</h2><p className="mt-4 text-sm text-muted-foreground">软件使用、下载或账号问题可联系支持。</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/support">支持中心</Link></Button><Button asChild variant="outline"><a href="mailto:support@oaktech.dev">联系支持</a></Button></div></article>
    </section>}
  </div>;
}
