import { notFound } from "next/navigation";
import Link from "next/link";
import { getStoreAdmin } from "@/lib/store/admin";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SoftwareAdminPage() {
  if (!(await getStoreAdmin())) notFound();
  return (
    <div className="container px-4 py-12">
      <p className="text-sm font-medium text-primary">Store administration</p>
      <h1 className="mt-2 text-4xl font-bold">Software publishing</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">Create bilingual products, prepare release drafts, upload chunked artifacts to the persistent server volume, and publish after SHA-512 verification.</p>
      <div className="mt-8 flex gap-3"><Button asChild><Link href="/admin/products">Manage products</Link></Button><Button asChild variant="outline"><Link href="/admin/releases">Manage releases</Link></Button></div>
    </div>
  );
}
