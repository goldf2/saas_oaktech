import { requireStoreAdmin } from "@/lib/store/admin";
import {
  codexMcpConfig,
  genericMcpConfig,
  mcpUsageGuide,
} from "@/lib/store/mcp-client-config";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireStoreAdmin();
  } catch {
    return Response.json(
      { error: "STORE_ADMIN_FORBIDDEN" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  const url = new URL(request.url),
    format = url.searchParams.get("format"),
    locale = url.searchParams.get("locale") === "en" ? "en" : "zh";
  const endpoint = new URL(
    "/api/mcp",
    process.env.NEXTAUTH_URL || process.env.BASE_URL || url.origin,
  ).href;
  const choices = {
    codex: { body: codexMcpConfig(endpoint), file: "oaktech-mcp.toml" },
    json: {
      body: genericMcpConfig(endpoint),
      file: "oaktech-mcp.template.json",
    },
    guide: {
      body: mcpUsageGuide(endpoint, locale),
      file: "oaktech-mcp-guide.md",
    },
  };
  if (!format || !Object.hasOwn(choices, format))
    return Response.json({ error: "MCP_CONFIG_FORMAT" }, { status: 400 });
  const selected = choices[format as keyof typeof choices];
  return new Response(selected.body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="${selected.file}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
