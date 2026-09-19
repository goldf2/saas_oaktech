import Link from "next/link";
import { redirect } from "next/navigation";
import { HeadphonesIcon, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStoreAdmin } from "@/lib/store/admin";
import { getCurrentUser } from "@/lib/auth";
import { ProductManagement, type ProductManagementQuery } from "@/components/admin/product-management";
import { workspaceView, workspaceSections, workspaceProductsHref } from "@/lib/store/workspace-navigation";
import { getRequestLanguage } from "@/i18n/server";
import { pageCopy } from "@/i18n/page-copy";
import { localePath } from "@/i18n/config";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { locale } = await getRequestLanguage();
  const text = pageCopy(locale).dashboard;
  return { title: `${text.title} - OakTech`, description: locale === "zh" ? "商品浏览与管理、软件下载与版本发布、账号与支持。" : "Browse and manage products, software releases, account information, and support." };
}

export default async function DashboardPage({ searchParams }: { searchParams: Promise<ProductManagementQuery & { view?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const [admin, query, language] = await Promise.all([getStoreAdmin(), searchParams, getRequestLanguage()]);
  if (query.view === "library") redirect(workspaceProductsHref(query));
  const view = workspaceView(query.view, Boolean(admin));
  const text = pageCopy(language.locale).dashboard;
  return <div className="container max-w-7xl px-3 py-5 sm:px-4" data-testid="workspace-dashboard" data-workspace-role={admin ? "admin" : "user"} data-page-locale={language.locale}>
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-sm font-medium text-primary">OakTech</p><h1 className="mt-1 text-2xl font-semibold">{text.title}</h1><p className="mt-2 text-sm text-muted-foreground">{admin ? text.adminDescription : text.userDescription}</p></div>
      <Button asChild variant="outline" size="sm"><Link href={localePath(language.locale)}>{text.back}</Link></Button>
    </header>
    <nav data-testid="workspace-navigation" aria-label={text.nav} className="my-5 flex flex-wrap gap-2 border-b pb-3">{workspaceSections(Boolean(admin), language.locale).map(item => <Button key={item.view} asChild size="sm" variant={view === item.view ? "default" : "outline"}><Link href={item.href} aria-current={view === item.view ? "page" : undefined}>{item.label}</Link></Button>)}</nav>
    {view === "products" ? <ProductManagement searchParams={Promise.resolve(query)} locale={language.locale} /> : <section data-testid="workspace-account" className="grid gap-4 md:grid-cols-2">
      <article className="min-w-0 rounded-xl border p-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><UserRound className="h-5 w-5" />{text.account}</h2><dl className="mt-4 space-y-3 text-sm"><div><dt className="text-muted-foreground">{text.current}</dt><dd className="mt-1 break-words">{user.email || user.name || text.signedIn}</dd></div><div><dt className="text-muted-foreground">{text.permission}</dt><dd className="mt-1">{admin ? text.administrator : text.user}</dd></div><div><dt className="text-muted-foreground">{text.loginMethod}</dt><dd className="mt-1">{user.provider === "casdoor" ? text.casdoor : text.email}</dd></div></dl>
        {user.provider === "casdoor" ? <p className="mt-4 text-sm text-muted-foreground">{text.passwordNote}</p> : <Button asChild variant="outline" className="mt-4"><Link href="/dashboard/reset-password">{text.changePassword}</Link></Button>}
        <p className="mt-4 text-xs text-muted-foreground">{text.statsNote}</p>
      </article>
      <article className="rounded-xl border p-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><HeadphonesIcon className="h-5 w-5" />{text.help}</h2><p className="mt-4 text-sm text-muted-foreground">{text.helpText}</p><div className="mt-4 flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/support">{text.supportCenter}</Link></Button><Button asChild variant="outline"><a href="mailto:support@oaktech.dev">{text.contact}</a></Button></div></article>
    </section>}
  </div>;
}
