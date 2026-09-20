import type { Locale } from "./types";

// Navigation only. Every privileged route still performs its own server-side authorization.
export type WorkspaceView = "products" | "account" | "mcp";
export function workspaceView(requested: unknown, _administrator: boolean): WorkspaceView {
  // A view selects a page, not privileges. The shared list resolves authorization
  // independently and ordinary users receive only its public projection.
  if (requested === "mcp" && _administrator) return "mcp";
  return requested === "account" ? "account" : "products";
}
export function workspaceProductsHref(query: { q?: unknown; state?: unknown } = {}): string {
  const params = new URLSearchParams({ view: "products" });
  if (typeof query.q === "string" && query.q.trim()) params.set("q", query.q.trim().slice(0, 200));
  if (typeof query.state === "string" && ["all", "published", "draft"].includes(query.state)) params.set("state", query.state);
  return `/dashboard?${params}`;
}
export function workspaceSections(administrator: boolean, locale: Locale = "zh") {
  const zh = locale === "zh";
  return [
    { view: "products" as const, label: administrator ? (zh ? "商品管理" : "Product management") : (zh ? "商品目录" : "Product catalog"), href: workspaceProductsHref() },
    ...(administrator ? [{ view: "mcp" as const, label: zh ? "MCP / AI 接入" : "MCP / AI integration", href: "/dashboard?view=mcp" }] : []),
    { view: "account" as const, label: zh ? "账号与支持" : "Account & support", href: "/dashboard?view=account" },
  ];
}
