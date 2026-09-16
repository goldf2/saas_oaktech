import { NextRequest, NextResponse } from "next/server";
import { requireStoreAdmin } from "@/lib/store/admin";
import { readLimitedImage, storeProductImage } from "@/lib/store/product-media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    await requireStoreAdmin();
    const configured = process.env.NEXTAUTH_URL || process.env.BASE_URL;
    // Never trust an arbitrary forwarded Host or a supplied form field as the expected origin.
    const origin = configured ? new URL(configured).origin : request.nextUrl.origin;
    if (request.headers.get("origin") !== origin || request.headers.get("x-oaktech-product-upload") !== "1") {
      return NextResponse.json({ error: "PRODUCT_UPLOAD_ORIGIN" }, { status: 403 });
    }
    const { slug } = await params;
    const bytes = await readLimitedImage(request);
    const media = await storeProductImage(slug, bytes);
    return NextResponse.json({ ok: true, media }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "PRODUCT_UPLOAD_FAILED";
    const known = ["STORE_ADMIN_FORBIDDEN", "STORE_PRODUCT_NOT_FOUND", "PRODUCT_IMAGE_TOO_LARGE", "PRODUCT_IMAGE_EMPTY", "PRODUCT_IMAGE_TYPE", "PRODUCT_IMAGE_INVALID", "PRODUCT_IMAGE_LIMIT", "PRODUCT_IMAGE_PATH"];
    const status = code === "STORE_ADMIN_FORBIDDEN" ? 403 : code === "STORE_PRODUCT_NOT_FOUND" ? 404 : code === "PRODUCT_IMAGE_TOO_LARGE" ? 413 : known.includes(code) ? 400 : 500;
    return NextResponse.json({ error: known.includes(code) ? code : "PRODUCT_UPLOAD_FAILED" }, { status, headers: { "Cache-Control": "no-store" } });
  }
}
