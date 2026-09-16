import { NextRequest } from "next/server";
import { getStoreAdmin } from "@/lib/store/admin";
import { readStoreCatalog } from "@/lib/store/file-catalog";
import { isPublicProductImage, loadProductImage, productImageFile } from "@/lib/store/product-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ slug: string; file: string }> };
const cacheHeaders = { "Cache-Control": "private, no-store", "CDN-Cache-Control": "no-store", Vary: "Cookie", "X-Content-Type-Options": "nosniff" };
async function imageResponse(context: Context, head: boolean) {
  try {
    const { slug, file } = await context.params;
    productImageFile(slug, file);
    const { catalog } = await readStoreCatalog();
    const url = `/media/products/${slug}/${file}`;
    const media = catalog.productMedia?.find(item => item.productSlug === slug && item.url === url);
    if (!media || (!isPublicProductImage(catalog, url) && !(await getStoreAdmin()))) return new Response(null, { status: 404, headers: cacheHeaders });
    const bytes = await loadProductImage(slug, file);
    if (bytes.byteLength !== media.sizeBytes) throw new Error("PRODUCT_IMAGE_MISSING");
    return new Response(head ? null : new Uint8Array(bytes), { headers: { ...cacheHeaders, "Content-Type": "image/webp", "Content-Length": String(bytes.byteLength), "Content-Disposition": `inline; filename="${file}"` } });
  } catch { return new Response(null, { status: 404, headers: cacheHeaders }); }
}
export async function GET(_request: NextRequest, context: Context) { return imageResponse(context, false); }
export async function HEAD(_request: NextRequest, context: Context) { return imageResponse(context, true); }
