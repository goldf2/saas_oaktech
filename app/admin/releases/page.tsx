import { notFound } from "next/navigation";
import Link from "next/link";
import { getStoreAdmin, listAdminProducts, listAdminReleases } from "@/lib/store/admin";
import { deleteReleaseAction, publishReleaseAction, saveReleaseDraftAction, unpublishReleaseAction } from "@/app/admin/actions";
import { AdminActionForm } from "@/components/admin/action-form";
import { ArtifactUpload } from "@/components/admin/artifact-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { selectUpdaterArtifacts } from "@/lib/store/release-contract";
import type { AdminProductReleaseRow, AdminStoreProductRow } from "@/lib/store/types";

export const dynamic = "force-dynamic";

function ReleaseForm({ release, products }: { release?: AdminProductReleaseRow; products: AdminStoreProductRow[] }) {
  const immutable = release?.status === "published";
  const identityLocked = Boolean(release);
  const updater = selectUpdaterArtifacts(release?.release_artifacts ?? []);
  return (
    <div>
      <AdminActionForm action={saveReleaseDraftAction} className="grid gap-4">
        <input type="hidden" name="id" value={release?.id ?? ""} />
        <div className="grid gap-4 md:grid-cols-3">
          <label className="text-sm font-medium">所属商品<select name="product_slug" defaultValue={release?.product_slug} disabled={identityLocked} className="mt-2 h-10 w-full rounded-md border bg-background px-3" required>{products.map((product) => <option key={product.id} value={product.slug}>{product.name_zh}</option>)}</select>{identityLocked && <input type="hidden" name="product_slug" value={release?.product_slug} />}</label>
          <label className="text-sm font-medium">版本号<Input name="version" defaultValue={release?.version} readOnly={identityLocked} placeholder="1.2.3 / 0.6.6.10" required /></label>
          <label className="text-sm font-medium">渠道<Input name="channel" defaultValue={release?.channel ?? "alpha"} readOnly={identityLocked} required /></label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Title (English)<Input name="title_en" defaultValue={release?.title_en} readOnly={immutable} required /></label>
          <label className="text-sm font-medium">标题（中文）<Input name="title_zh" defaultValue={release?.title_zh} readOnly={immutable} required /></label>
          <label className="text-sm font-medium">Release notes (English)<Textarea name="notes_en" defaultValue={release?.notes_en} readOnly={immutable} required /></label>
          <label className="text-sm font-medium">发布说明（中文）<Textarea name="notes_zh" defaultValue={release?.notes_zh} readOnly={immutable} required /></label>
        </div>
        {!immutable && <Button type="submit" className="w-fit">保存版本草稿</Button>}
      </AdminActionForm>
      {release && <div className="mt-5">
        <h3 className="text-sm font-semibold">软件包与下载</h3>
        {release.source_commit && <p className="mt-2 break-all text-xs text-muted-foreground">来源提交：<code>{release.source_commit}</code></p>}
        {release.release_artifacts.length === 0 && <p className="mt-2 text-sm text-muted-foreground">尚未上传软件包；仅有版本说明不代表可供下载。</p>}
        <div className="mt-2 space-y-2">{release.release_artifacts.map((artifact) => <div key={artifact.id} className="break-words rounded border p-3 text-xs"><strong>{artifact.platform} · {artifact.architecture} · {artifact.package_kind}</strong><div>{artifact.file_name} · {artifact.size_bytes} bytes</div><code className="break-all text-muted-foreground">SHA-512 {artifact.sha512}</code>{immutable && <a href={artifact.public_path} download={artifact.file_name} className="mt-2 block break-all text-primary underline">下载已发布文件 · {artifact.public_path}</a>}</div>)}</div>
        {immutable && release.is_current && <div className="mt-3 flex flex-wrap gap-4 text-xs text-primary">
          {updater.mac.length > 0 && <a className="underline" href={`/releases/${release.product_slug}/${release.channel}/latest-mac.yml`}>当前 macOS 更新清单</a>}
          {updater.windows.length > 0 && <a className="underline" href={`/releases/${release.product_slug}/${release.channel}/latest.yml`}>当前 Windows 更新清单</a>}
        </div>}
        {!immutable && <ArtifactUpload releaseId={release.id} />}
        <div className="mt-4 flex flex-wrap gap-3">
          {!immutable && release.release_artifacts.length > 0 && <AdminActionForm action={publishReleaseAction} pendingText="正在校验全部软件包并发布，请勿重复提交…"><input type="hidden" name="release_id" value={release.id} /><Button type="submit">校验并发布</Button></AdminActionForm>}
          {immutable && <AdminActionForm action={unpublishReleaseAction}><input type="hidden" name="release_id" value={release.id} /><Button type="submit" variant="outline">撤回为草稿</Button></AdminActionForm>}
          {!immutable && <AdminActionForm action={deleteReleaseAction} className="flex flex-wrap gap-2"><input type="hidden" name="release_id" value={release.id} /><Input name="confirm_version" aria-label="输入版本号确认删除" placeholder={`输入 ${release.version}`} className="w-52" required /><Button type="submit" variant="destructive">删除草稿</Button></AdminActionForm>}
        </div>
        {immutable && release.is_current && <p className="mt-3 text-xs text-muted-foreground">撤回当前版本后，此渠道将暂时没有当前更新源；已缓存的文件无法通过撤回操作远程清除。</p>}
      </div>}
    </div>
  );
}

type ReleaseQuery = { saved?: string; published?: string; unpublished?: string; deleted?: string; release?: string };

export default async function AdminReleasesPage({ searchParams }: { searchParams: Promise<ReleaseQuery> }) {
  if (!(await getStoreAdmin())) notFound();
  const [products, releases, query] = await Promise.all([listAdminProducts(), listAdminReleases(), searchParams]);
  const notice = query.saved === "1" ? "版本草稿已保存，请继续上传软件包。" : query.published === "1" ? "版本已通过校验并公开发布。" : query.unpublished === "1" ? "版本已撤回为草稿，新下载请求不再提供此版本。" : query.deleted === "1" ? "草稿已删除。" : "";
  return (
    <div className="container px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm text-primary">Store administration</p><h1 className="text-3xl font-bold">软件版本发布</h1><p className="mt-2 text-sm text-muted-foreground">创建草稿 → 上传软件包 → SHA-512 校验 → 公开下载。</p></div>
        <Button asChild variant="outline"><Link href="/admin/products">商品管理</Link></Button>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">兼容包生成 Electron 更新清单（macOS ZIP / Windows NSIS）；浏览器扩展、Linux 软件包等通过版本化链接下载。草稿标识保存后锁定，防止下载路径错位。</p>
      {notice && <p role="status" className="mt-4 rounded-md border p-3 text-sm">{notice}</p>}
      <div className="mt-8 space-y-6">
        <details className="rounded-lg border p-5"><summary className="cursor-pointer font-semibold">新建软件版本</summary><div className="mt-5">{products.length ? <ReleaseForm products={products} /> : <p>请先在商品管理中创建商品。</p>}</div></details>
        {releases.map((release) => <details key={release.id} id={`release-${release.id}`} open={release.id === query.release} className="rounded-lg border p-5"><summary className="cursor-pointer break-words font-semibold">{release.product_slug} · {release.version} · {release.status === "published" ? "已发布" : "草稿"}{release.is_current ? " · 当前版本" : ""}</summary><div className="mt-5"><ReleaseForm release={release} products={products} /></div></details>)}
      </div>
    </div>
  );
}
