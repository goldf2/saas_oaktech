import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { getRequestLanguage } from "@/i18n/server";
import { localePath } from "@/i18n/config";

// This is an explanation page, not an authorization fallback. Protected data/forms are not rendered.
export async function AdminAccessNotice() {
  const [user, { locale }] = await Promise.all([getCurrentUser(), getRequestLanguage()]);
  const zh = locale === "zh";
  return (
    <section className="container max-w-3xl px-4 py-12" data-testid="admin-access-notice" data-page-locale={locale}>
      <p className="text-sm text-primary">OakTech · {zh ? "工作台" : "Workspace"}</p>
      <h1 className="mt-3 text-3xl font-bold">{user ? (zh ? "当前账号没有商品管理权限" : "This account does not have product-management access") : (zh ? "请先登录商品后台" : "Sign in to access product administration")}</h1>
      <p className="mt-4 text-muted-foreground">{zh ? "商品添加、编辑和软件发布仅向已授权管理员开放；普通用户可在同一工作台查看公开软件和账号信息，但不能管理商品。" : "Adding or editing products and publishing software are restricted to authorized administrators. Standard users can browse public software and account information in the same workspace but cannot manage products."}</p>
      {user && <p className="mt-4 rounded-lg border p-4 text-sm">{zh ? "登录成功不等于已获得管理员权限。请由站点管理员核对当前认证方式及管理员授权。Casdoor 使用账号的精确 subject 授权，不使用显示名称或邮箱自动授权。" : "Signing in does not automatically grant administrator access. A site administrator must verify the authentication identity and authorization. Casdoor access uses the exact account subject, not a display name or email fallback."}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild><Link href={user ? "/dashboard" : "/sign-in"}>{user ? (zh ? "返回工作台" : "Back to workspace") : (zh ? "登录 / 注册" : "Sign in / Sign up")}</Link></Button>
        <Button asChild variant="outline"><Link href={localePath(locale)}>{zh ? "返回软件商城" : "Back to software store"}</Link></Button>
      </div>
      {!user && <p className="mt-4 text-sm text-muted-foreground">{zh ? "登录后从「工作台」继续，系统会按账号权限展示可用功能。" : "After signing in, continue from the Workspace. Available functions are shown according to the account's permissions."}</p>}
    </section>
  );
}
