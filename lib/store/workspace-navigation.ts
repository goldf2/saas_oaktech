// Navigation only. Every privileged route still performs its own server-side authorization.
export type WorkspaceView = "products" | "library" | "account";
export function workspaceView(requested: unknown, administrator: boolean): WorkspaceView | "forbidden" {
  if (requested === "products") return administrator ? "products" : "forbidden";
  if (requested === "library" || requested === "account") return requested;
  return administrator ? "products" : "library";
}
export function workspaceProductsHref(query: { q?: unknown; state?: unknown } = {}): string {
  const params = new URLSearchParams({ view: "products" });
  if (typeof query.q === "string" && query.q.trim()) params.set("q", query.q.trim().slice(0, 200));
  if (typeof query.state === "string" && ["all", "published", "draft"].includes(query.state)) params.set("state", query.state);
  return `/dashboard?${params}`;
}
export function workspaceSections(administrator: boolean) {
  return [
    ...(administrator ? [{ view: "products" as const, label: "商品管理", href: workspaceProductsHref() }] : []),
    { view: "library" as const, label: "软件目录", href: "/dashboard?view=library" },
    { view: "account" as const, label: "账号与支持", href: "/dashboard?view=account" },
  ];
}
