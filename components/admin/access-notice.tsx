import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";

// This is an explanation page, not an authorization fallback. Protected data/forms are not rendered.
export async function AdminAccessNotice() {
  const user = await getCurrentUser();
  return (
    <section className="container max-w-3xl px-4 py-12" data-testid="admin-access-notice">
      <p className="text-sm text-primary">OakTech · 工作台</p>
      <h1 className="mt-3 text-3xl font-bold">{user ? "当前账号没有商品管理权限" : "请先登录商品后台"}</h1>
      <p className="mt-4 text-muted-foreground">商品添加、编辑和软件发布仅向已授权管理员开放；普通用户可在同一工作台查看公开软件和账号信息，但不能管理商品。</p>
      {user && <p className="mt-4 rounded-lg border p-4 text-sm">登录成功不等于已获得管理员权限。请由站点管理员核对当前认证方式及管理员白名单。Casdoor 使用账号的精确 subject 授权，不使用显示名称或邮箱自动授权。</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild><Link href={user ? "/dashboard" : "/sign-in"}>{user ? "返回工作台" : "登录 / 注册"}</Link></Button>
        <Button asChild variant="outline"><Link href="/zh">返回软件商城</Link></Button>
      </div>
      {!user && <p className="mt-4 text-sm text-muted-foreground">登录后从「工作台」继续，系统按账号权限展示可用功能。</p>}
    </section>
  );
}
