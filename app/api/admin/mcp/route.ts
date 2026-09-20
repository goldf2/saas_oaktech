import { requireStoreAdmin } from "@/lib/store/admin";
import {
  listMcpTokens,
  createMcpToken,
  revokeMcpToken,
} from "@/lib/store/mcp-tokens";
import { readStoreCatalog } from "@/lib/store/file-catalog";
import { getReleaseStorageRoot } from "@/lib/store/storage";
import { z } from "zod";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
function failure(e: unknown) {
  const message =
    e instanceof z.ZodError
      ? "MCP_TOKEN_INPUT_INVALID"
      : e instanceof Error
        ? e.message
        : "";
  const code = /^[A-Z_0-9]+$/.test(message)
    ? message
    : "MCP_TOKEN_OPERATION_FAILED";
  return Response.json(
    { error: code },
    {
      status:
        code === "STORE_ADMIN_FORBIDDEN"
          ? 403
          : code === "MCP_TOKEN_NOT_FOUND"
            ? 404
            : 400,
      headers,
    },
  );
}
export async function GET() {
  try {
    await requireStoreAdmin();
    getReleaseStorageRoot();
    const [tokens, { catalog }] = await Promise.all([
      listMcpTokens(),
      readStoreCatalog(),
    ]);
    return Response.json(
      {
        tokens,
        products: catalog.products.map((p) => ({
          slug: p.slug,
          name: p.name_zh,
          nameEn: p.name_en,
        })),
        legacyTokenConfigured: !!process.env.OAKTECH_MCP_TOKEN,
      },
      { headers },
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const admin = await requireStoreAdmin();
    const configured = process.env.NEXTAUTH_URL || process.env.BASE_URL;
    if (
      !configured ||
      request.headers.get("origin") !== new URL(configured).origin ||
      request.headers.get("x-oaktech-mcp-admin") !== "1"
    )
      return Response.json(
        { error: "MCP_ADMIN_ORIGIN" },
        { status: 403, headers },
      );
    if (!request.body) throw new Error("MCP_TOKEN_INPUT_INVALID");
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let length = 0;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > 16384) {
          await reader.cancel();
          return Response.json(
            { error: "MCP_TOKEN_INPUT_TOO_LARGE" },
            { status: 413, headers },
          );
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (body.action === "create") {
      const input = z
        .object({ action: z.literal("create"), input: z.unknown() })
        .strict()
        .parse(body);
      return Response.json(await createMcpToken(input.input, admin.id), {
        status: 201,
        headers,
      });
    }
    const input = z
      .object({ action: z.literal("revoke"), id: z.string().uuid() })
      .strict()
      .parse(body);
    return Response.json(
      { record: await revokeMcpToken(input.id, admin.id) },
      { headers },
    );
  } catch (e) {
    return failure(e);
  }
}
