// Navigation only. Every privileged route still performs its own server-side authorization.
export type WorkspaceView = "products" | "account";
export function workspaceView(requested: unknown, _administrator: boolean): WorkspaceView {
  // A view selects a page, not privileges. The shared list resolves authorization
  // independently and ordinary users receive only its public projection.
  return requested === "account" ? "account" : "products";
}
export function workspaceProductsHref(query: { q?: unknown; state?: unknown } = {}): string {
  const params = new URLSearchParams({ view: "products" });
  if (typeof query.q === "string" && query.q.trim()) params.set("q", query.q.trim().slice(0, 200));
  if (typeof query.state === "string" && ["all", "published", "draft"].includes(query.state)) params.set("state", query.state);
  return `/dashboard?${params}`;
}
export function workspaceSections(administrator: boolean) {
  return [
    { view: "products" as const, label: administrator ? "商品管理" : "商品目录", href: workspaceProductsHref() },
    { view: "account" as const, label: "账号与支持", href: "/dashboard?view=account" },
  ];
}
