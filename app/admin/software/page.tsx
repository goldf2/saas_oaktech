import Link from "next/link";
import { getStoreAdmin, listAdminProducts } from "@/lib/store/admin";
import { AdminAccessNotice } from "@/components/admin/access-notice";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SoftwareAdminPage() {
  if (!(await getStoreAdmin())) return <AdminAccessNotice />;
  const products = await listAdminProducts();
  return (
    <section className="container max-w-6xl px-4 py-12">
      <p className="text-sm font-medium text-primary">OakTech administration</p>
      <h1 className="mt-2 text-4xl font-bold">商品与软件发布后台</h1>
      <p className="mt-4 text-muted-foreground">这里是管理员工作区，不是个人软件库。商品介绍、安装包版本和公开下载分别管理。</p>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <div className="rounded-xl border p-6"><h2 className="text-xl font-semibold">新增商品</h2><p className="my-4 text-sm text-muted-foreground">添加独立的名称、分类、图标和中英文介绍。</p><Button asChild><Link href="/admin/products/new">添加商品</Link></Button></div>
        <div className="rounded-xl border p-6"><h2 className="text-xl font-semibold">商品管理</h2><p className="my-4 text-sm text-muted-foreground">当前目录共 {products.length} 件商品，编辑资料和展示状态。</p><Button asChild variant="outline"><Link href="/admin/products">管理已有商品</Link></Button></div>
        <div className="rounded-xl border p-6"><h2 className="text-xl font-semibold">软件版本发布</h2><p className="my-4 text-sm text-muted-foreground">上传软件包、填写更新说明、校验并发布下载。</p><Button asChild variant="outline"><Link href="/admin/releases">管理软件版本</Link></Button></div>
      </div>
      <div className="mt-8 rounded-xl border p-6 text-sm">
        <h2 className="font-semibold">缠序与 open play 是两个独立商品</h2>
        <p className="mt-3 text-muted-foreground">缠序：TradingView 缠论研究工具，分类为交易研究工具。open play：本地 Codex / auth.json 认证配置管理工具，分类为桌面应用。</p>
        <p className="mt-3 text-muted-foreground">商品未录入当前持久目录时，可从新增页面选用对应资料模板。模板只预填草稿，不会自动公开商品或发布软件包。</p>
      </div>
    </section>
  );
}
