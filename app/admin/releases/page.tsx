import { notFound } from "next/navigation";
import Link from "next/link";
import { getStoreAdmin, listAdminProducts, listAdminReleases } from "@/lib/store/admin";
import { deleteReleaseAction, publishReleaseAction, saveReleaseDraftAction, unpublishReleaseAction } from "@/app/admin/actions";
import { ArtifactUpload } from "@/components/admin/artifact-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { AdminProductReleaseRow, AdminStoreProductRow } from "@/lib/store/types";

export const dynamic = "force-dynamic";

function ReleaseForm({ release, products }: { release?: AdminProductReleaseRow; products: AdminStoreProductRow[] }) {
  const immutable = release?.status === "published";
  return (
    <div>
      <form action={saveReleaseDraftAction} className="grid gap-4">
        <input type="hidden" name="id" value={release?.id ?? ""} />
        <div className="grid gap-4 md:grid-cols-3">
          <label><Label>Product</Label><select name="product_slug" defaultValue={release?.product_slug} disabled={immutable} className="mt-2 h-10 w-full rounded-md border bg-background px-3" required>{products.map((product) => <option key={product.id} value={product.slug}>{product.name_en}</option>)}</select>{immutable && <input type="hidden" name="product_slug" value={release.product_slug} />}</label>
          <label><Label>Version</Label><Input name="version" defaultValue={release?.version} readOnly={immutable} required /></label>
          <label><Label>Channel</Label><Input name="channel" defaultValue={release?.channel ?? "alpha"} readOnly={immutable} required /></label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label><Label>Title (English)</Label><Input name="title_en" defaultValue={release?.title_en} readOnly={immutable} required /></label>
          <label><Label>标题（中文）</Label><Input name="title_zh" defaultValue={release?.title_zh} readOnly={immutable} required /></label>
          <label><Label>Release notes (English)</Label><Textarea name="notes_en" defaultValue={release?.notes_en} readOnly={immutable} required /></label>
          <label><Label>发布说明（中文）</Label><Textarea name="notes_zh" defaultValue={release?.notes_zh} readOnly={immutable} required /></label>
        </div>
        {!immutable && <Button type="submit" className="w-fit">Save draft</Button>}
      </form>
      {release && <div className="mt-5">
        <h3 className="text-sm font-semibold">Artifacts</h3>
        <div className="mt-2 space-y-2">{release.release_artifacts.map((artifact) => <div key={artifact.id} className="rounded border p-3 text-xs"><strong>{artifact.platform} · {artifact.architecture} · {artifact.package_kind}</strong><div>{artifact.file_name} · {artifact.size_bytes} bytes</div><code className="break-all text-muted-foreground">SHA-512 {artifact.sha512}</code></div>)}</div>
        {!immutable && <ArtifactUpload releaseId={release.id} />}
        <div className="mt-4 flex flex-wrap gap-3">
          {!immutable && release.release_artifacts.length > 0 && <form action={publishReleaseAction}><input type="hidden" name="release_id" value={release.id} /><Button type="submit">Verify and publish</Button></form>}
          {immutable && <form action={unpublishReleaseAction}><input type="hidden" name="release_id" value={release.id} /><Button type="submit" variant="outline">Unpublish to draft</Button></form>}
          {!immutable && <form action={deleteReleaseAction} className="flex gap-2"><input type="hidden" name="release_id" value={release.id} /><Input name="confirm_version" placeholder={`Type ${release.version}`} className="w-52" /><Button type="submit" variant="destructive">Delete draft</Button></form>}
        </div>
      </div>}
    </div>
  );
}

export default async function AdminReleasesPage() {
  if (!(await getStoreAdmin())) notFound();
  const [products, releases] = await Promise.all([listAdminProducts(), listAdminReleases()]);
  return (
    <div className="container px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm text-primary">Store administration</p><h1 className="text-3xl font-bold">Releases and artifacts</h1><p className="mt-2 text-sm text-muted-foreground">Upload to the persistent server volume, verify SHA-512, then atomically switch the public current release.</p></div><Button asChild variant="outline"><Link href="/admin/products">Manage products</Link></Button></div>
      <div className="mt-8 space-y-6">
        <details className="rounded-lg border p-5"><summary className="cursor-pointer font-semibold">Create release draft</summary><div className="mt-5"><ReleaseForm products={products} /></div></details>
        {releases.map((release) => <details key={release.id} open={release.id === "bootstrap-gitfinder-2-alpha-85"} className="rounded-lg border p-5"><summary className="cursor-pointer font-semibold">{release.product_slug} · {release.version} · {release.status}{release.is_current ? " · current" : ""}</summary><div className="mt-5"><ReleaseForm release={release} products={products} /></div></details>)}
      </div>
    </div>
  );
}
