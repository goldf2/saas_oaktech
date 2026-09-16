import { saveReleaseDraftAction, unpublishReleaseAction, deleteReleaseAction } from "@/app/admin/actions";
import { AdminActionForm } from "@/components/admin/action-form";
import { ArtifactUpload } from "@/components/admin/artifact-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminProductReleaseRow, AdminStoreProductRow } from "@/lib/store/types";

function ReleaseDetails({ product, release }: { product: AdminStoreProductRow; release?: AdminProductReleaseRow }) {
  const published = release?.status === "published";
  return <div className="mt-5 space-y-5">
    <AdminActionForm action={saveReleaseDraftAction} className="grid gap-4" pendingText="正在保存当前商品的版本草稿…">
      <input type="hidden" name="id" value={release?.id ?? ""} />
      <input type="hidden" name="product_slug" value={product.slug} />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">版本号<Input name="version" defaultValue={release?.version} readOnly={Boolean(release)} placeholder="1.0.0" required /></label>
        <label className="text-sm">发布渠道<Input name="channel" defaultValue={release?.channel ?? "stable"} readOnly={Boolean(release)} placeholder="stable / beta" required /></label>
        <label className="text-sm sm:col-span-2">版本标题<Input name="title_zh" defaultValue={release?.title_zh} readOnly={published} required /></label>
        <label className="text-sm sm:col-span-2">更新说明<Textarea name="notes_zh" rows={4} defaultValue={release?.notes_zh} readOnly={published} required /></label>
      </div>
      <details><summary className="cursor-pointer text-sm">英文更新说明（当前版本服务必填）</summary><div className="mt-3 grid gap-3">
        <label className="text-sm">English title<Input name="title_en" defaultValue={release?.title_en} readOnly={published} required /></label>
        <label className="text-sm">English release notes<Textarea name="notes_en" defaultValue={release?.notes_en} readOnly={published} required /></label>
      </div></details>
      {!published && <Button type="submit" className="w-fit">保存版本草稿</Button>}
    </AdminActionForm>
    {release && <>
      {release.source_commit && <p className="break-all text-xs text-muted-foreground">来源提交：<code>{release.source_commit}</code></p>}
      <section><h3 className="font-medium">版本文件</h3>
        {release.release_artifacts.length === 0 && <p className="mt-2 text-sm text-muted-foreground">尚无文件。上传只是准备，不会立即公开。</p>}
        <div className="mt-3 grid gap-3 md:grid-cols-2">{release.release_artifacts.map(artifact => <div key={artifact.id} className="min-w-0 rounded-lg border p-3 text-sm">
          <p className="font-medium">{artifact.platform} · {artifact.architecture} · {artifact.package_kind}</p>
          <p className="mt-1 break-all">{artifact.file_name}</p><p className="mt-1 text-xs text-muted-foreground">{(artifact.size_bytes / 1024 / 1024).toFixed(2)} MiB · SHA-512 {artifact.sha512.slice(0, 16)}…</p>
          {published && <a href={artifact.public_path} download={artifact.file_name} className="mt-2 inline-block text-primary underline">下载已发布文件</a>}
        </div>)}</div>
      </section>
      {!published && <ArtifactUpload releaseId={release.id} />}
      {!published && <p className="text-sm text-muted-foreground">上传完成后，切换到「预览与发布」勾选本版本，与商品资料一起确认发布。</p>}
      {published ? <AdminActionForm action={unpublishReleaseAction} className="flex flex-wrap items-center gap-3">
        <input type="hidden" name="release_id" value={release.id} /><Button variant="outline" type="submit">撤回版本为草稿</Button>
        <span className="text-xs text-muted-foreground">撤回后停止提供此版本的新下载请求，不自动回退到历史版本。</span>
      </AdminActionForm> : <AdminActionForm action={deleteReleaseAction} className="flex flex-wrap gap-3">
        <input type="hidden" name="release_id" value={release.id} />
        <Input name="confirm_version" aria-label="输入版本号确认删除" placeholder={`输入 ${release.version} 确认删除`} className="max-w-xs" required />
        <Button variant="destructive" type="submit">删除版本草稿</Button>
      </AdminActionForm>}
    </>}
  </div>;
}
export function ProductReleases({ product, releases, selectedRelease, notice }: {
  product: AdminStoreProductRow; releases: AdminProductReleaseRow[]; selectedRelease?: string; notice?: string;
}) {
  return <section data-testid="product-releases" className="space-y-5">
    <div><h2 className="text-xl font-semibold">{product.name_zh || product.slug} · 软件版本</h2>
      <p className="mt-2 text-sm text-muted-foreground">只管理当前商品的版本和安装包。保存、上传、预览、发布是不同步骤。</p></div>
    {notice && <p role="status" className="rounded-lg border p-3 text-sm">{notice}</p>}
    <details data-testid="new-product-release" className="rounded-xl border p-5"><summary className="cursor-pointer font-semibold">添加软件版本</summary><ReleaseDetails product={product} /></details>
    {releases.map(release => <details key={release.id} data-release-id={release.id} id={`release-${release.id}`} open={selectedRelease === release.id} className="rounded-xl border p-5">
      <summary className="cursor-pointer break-words font-semibold">{release.version} · {release.channel} · {release.status === "published" ? "已发布" : "草稿"}{release.is_current ? " · 当前" : ""}</summary>
      <ReleaseDetails product={product} release={release} />
    </details>)}
  </section>;
}
