"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { TokenSummary } from "@/lib/store/mcp-tokens";
import type { McpScope } from "@/lib/store/mcp-auth";

type Data = {
  tokens: TokenSummary[];
  products: { slug: string; name: string; nameEn: string }[];
  legacyTokenConfigured: boolean;
};
const scopeLabels: [McpScope, string, string][] = [
  ["read", "查询商品与版本", "Read products and versions"],
  ["product:write", "创建和编辑商品草稿", "Create and edit product drafts"],
  [
    "release:write",
    "创建版本、编辑说明和导入文件",
    "Create versions, edit notes and import files",
  ],
  ["product:publish", "正式发布商品介绍", "Publish product information"],
  ["release:publish", "正式发布软件版本", "Publish software versions"],
];
export function McpManagement({ locale }: { locale: "zh" | "en" }) {
  const zh = locale === "zh",
    t = (cn: string, en: string) => (zh ? cn : en);
  const [data, setData] = useState<Data | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [endpoint, setEndpoint] = useState(""),
    [name, setName] = useState(""),
    [days, setDays] = useState(90),
    [products, setProducts] = useState<string[]>([]),
    [future, setFuture] = useState(""),
    [scopes, setScopes] = useState<McpScope[]>(["read"]);
  const [created, setCreated] = useState<{ token: string; id: string } | null>(
      null,
    ),
    [probe, setProbe] = useState(""),
    [connection, setConnection] = useState(""),
    [testing, setTesting] = useState(false),
    [revokeId, setRevokeId] = useState<string | null>(null);
  const message = (code: string) =>
    ({
      STORE_ADMIN_FORBIDDEN: t(
        "没有管理权限，请重新登录管理员账号。",
        "Administrator access is required.",
      ),
      RELEASE_STORAGE_ROOT_REQUIRED: t(
        "尚未配置持久存储，暂时无法管理令牌。",
        "Persistent storage is not configured.",
      ),
      MCP_ADMIN_ORIGIN: t(
        "请求来源与站点配置不一致，请检查站点地址配置。",
        "Request origin does not match the configured site URL.",
      ),
      MCP_TOKEN_INPUT_INVALID: t(
        "请填写名称，选择商品和权限；新增商品标识仅支持小写字母、数字和连字符。",
        "Enter a name, products and permissions. New slugs use lowercase letters, digits and hyphens.",
      ),
      MCP_TOKEN_LIMIT: t(
        "令牌记录已达到上限，请联系维护人员。",
        "Token record limit reached. Contact your operator.",
      ),
    })[code] ??
    t(
      "操作未完成，请刷新后检查结果再重试。",
      "Operation failed. Refresh and inspect the result before retrying.",
    );
  async function load() {
    try {
      const r = await fetch("/api/admin/mcp", { cache: "no-store" });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      setData(body);
      setError("");
    } catch (e) {
      setData(null);
      setError(message(e instanceof Error ? e.message : ""));
    }
  }
  useEffect(() => {
    setEndpoint(`${window.location.origin}/api/mcp`);
    void load();
  }, []); // Server API always checks the current administrator.
  async function mutate(body: unknown) {
    const r = await fetch("/api/admin/mcp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-oaktech-mcp-admin": "1",
      },
      body: JSON.stringify(body),
    });
    const result = await r.json();
    if (!r.ok) throw new Error(result.error);
    return result;
  }
  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const all = Array.from(
        new Set([
          ...products,
          ...future
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        ]),
      );
      const result = await mutate({
        action: "create",
        input: { name, products: all, scopes, expiresInDays: days },
      });
      setCreated({ token: result.token, id: result.record.id });
      setProbe("");
      setConnection("");
      setName("");
      await load();
    } catch (e) {
      setError(message(e instanceof Error ? e.message : ""));
    } finally {
      setBusy(false);
    }
  }
  async function revoke(id: string) {
    setBusy(true);
    try {
      await mutate({ action: "revoke", id });
      if (created?.id === id) setCreated(null);
      setProbe("");
      setConnection("");
      setRevokeId(null);
      await load();
      setNotice(
        t(
          "令牌已撤销，后续请求将被拒绝。",
          "Token revoked. Subsequent requests will be rejected.",
        ),
      );
    } catch (e) {
      setError(message(e instanceof Error ? e.message : ""));
    } finally {
      setBusy(false);
    }
  }
  async function copy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(t("已复制。", "Copied."));
    } catch {
      setError(
        t(
          "无法访问剪贴板，请手动选择复制。",
          "Clipboard unavailable. Select and copy manually.",
        ),
      );
    }
  }
  async function verify() {
    setTesting(true);
    setConnection("");
    try {
      const token = probe.trim() || created?.token;
      if (!token) throw new Error("missing");
      const call = async (id: number, method: string, params?: unknown) => {
        const r = await fetch("/api/mcp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json, text/event-stream",
            Authorization: `Bearer ${token}`,
            "MCP-Protocol-Version": "2025-11-25",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id,
            method,
            ...(params ? { params } : {}),
          }),
        });
        if (r.status === 401) throw new Error("unauthorized");
        if (!r.ok) throw new Error(`http_${r.status}`);
        const body = await r.json();
        if (body.error) throw new Error("rpc");
        return body.result;
      };
      await call(1, "initialize", {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "oaktech-admin-check", version: "1.0.0" },
      });
      const result = await call(2, "tools/list");
      if (!Array.isArray(result.tools)) throw new Error("rpc");
      setConnection(
        t(
          `令牌验证成功，可发现 ${result.tools.length} 个工具。尚未检查外部 AI 客户端。`,
          `Token verified: ${result.tools.length} tools discovered. External AI client connection not checked.`,
        ),
      );
    } catch (e) {
      const reason = e instanceof Error ? e.message : "";
      setConnection(
        reason === "unauthorized"
          ? t(
              "令牌无效、已过期或已撤销。",
              "Token invalid, expired or revoked.",
            )
          : reason === "missing"
            ? t(
                "请创建令牌，或填写需要验证的已有令牌。",
                "Create a token or enter an existing token to verify.",
              )
            : t(
                "连接验证失败，请检查服务部署和站点配置。",
                "Connection failed. Check deployment and site configuration.",
              ),
      );
    } finally {
      setTesting(false);
    }
  }
  const field = "w-full rounded-md border bg-background px-3 py-2 text-sm";
  return (
    <section data-testid="mcp-management" className="space-y-5">
      <header>
        <h2 className="text-xl font-semibold">
          MCP / {t("AI 接入", "AI integration")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(
            "让 AI 工具直接管理商品和软件版本。先创建独立令牌，再连接客户端。",
            "Manage products and releases from your AI tools. Create a scoped token, then connect your client.",
          )}
        </p>
      </header>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-300 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-primary">
          {notice}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="min-w-0 rounded-xl border p-5">
          <h3 className="font-semibold">1. {t("连接信息", "Connection")}</h3>
          <label className="mt-4 block text-sm" htmlFor="mcp-endpoint">
            {t("MCP 服务地址", "MCP endpoint")}
          </label>
          <input
            id="mcp-endpoint"
            className={`${field} mt-1`}
            readOnly
            value={endpoint}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!endpoint}
              onClick={() => copy(endpoint)}
            >
              {t("复制地址", "Copy endpoint")}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/admin/mcp/config?format=codex&locale=${locale}`}>
                {t("下载 Codex 配置", "Download Codex config")}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/admin/mcp/config?format=json&locale=${locale}`}>
                {t("通用 JSON 模板", "Generic JSON template")}
              </a>
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {t(
              "Streamable HTTP · 独立 Bearer 令牌。模板不包含密钥；通用 JSON 格式需按客户端要求调整。",
              "Streamable HTTP · independent Bearer token. Templates contain no secrets; adapt the generic JSON to your client.",
            )}
          </p>
          <p className="mt-4 text-sm">
            {data
              ? t(
                  "管理服务可用；连接状态请使用下方验证。",
                  "Management available; verify the connection below.",
                )
              : error
                ? t("管理服务暂不可用", "Management unavailable")
                : t("正在读取服务状态…", "Loading service status…")}
          </p>
          <label htmlFor="mcp-probe" className="mt-4 block text-sm">
            {t("验证已有令牌（可选）", "Verify an existing token (optional)")}
          </label>
          <input
            id="mcp-probe"
            type="password"
            autoComplete="off"
            className={`${field} mt-1`}
            value={probe}
            onChange={(e) => setProbe(e.target.value)}
            placeholder={t(
              "留空时使用刚创建的令牌",
              "Leave blank to use the newly created token",
            )}
          />
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={verify} disabled={testing}>
              {testing
                ? t("验证中…", "Verifying…")
                : t("验证连接", "Verify connection")}
            </Button>
            {probe && (
              <Button
                variant="ghost"
                onClick={() => {
                  setProbe("");
                  setConnection("");
                }}
              >
                {t("清空", "Clear")}
              </Button>
            )}
          </div>
          {connection && (
            <p role="status" className="mt-3 text-sm">
              {connection}
            </p>
          )}
        </article>
        <form onSubmit={create} className="min-w-0 rounded-xl border p-5">
          <h3 className="font-semibold">
            2. {t("创建独立令牌", "Create a token")}
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              {t("令牌名称", "Token name")}
              <input
                name="tokenName"
                required
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("例如：我的 Codex", "For example: My Codex")}
                className={`${field} mt-1`}
              />
            </label>
            <label className="text-sm">
              {t("有效期", "Expires in")}
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className={`${field} mt-1`}
              >
                {[7, 30, 90, 365].map((d) => (
                  <option value={d} key={d}>
                    {d} {t("天", "days")}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <fieldset className="mt-4">
            <legend className="text-sm font-medium">
              {t("允许管理的商品", "Allowed products")}
            </legend>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto">
              {data?.products.map((p) => (
                <label key={p.slug} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={products.includes(p.slug)}
                    onChange={(e) =>
                      setProducts(
                        e.target.checked
                          ? [...products, p.slug]
                          : products.filter((x) => x !== p.slug),
                      )
                    }
                  />
                  <span>
                    {zh ? p.name : p.nameEn || p.name}
                    <span className="ml-2 break-all text-xs text-muted-foreground">
                      {p.slug}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            <label className="mt-3 block text-xs text-muted-foreground">
              {t(
                "尚未创建的商品标识（可选，逗号分隔）",
                "Future product slugs (optional, comma-separated)",
              )}
              <input
                name="futureProducts"
                className={`${field} mt-1`}
                value={future}
                onChange={(e) => setFuture(e.target.value)}
                placeholder="my-new-app"
              />
            </label>
          </fieldset>
          <fieldset className="mt-4 space-y-2">
            <legend className="mb-2 text-sm font-medium">
              {t("操作权限", "Permissions")}
            </legend>
            {scopeLabels.map(([scope, cn, en]) => (
              <label key={scope} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  disabled={scope === "read"}
                  checked={scopes.includes(scope)}
                  onChange={(e) =>
                    setScopes(
                      e.target.checked
                        ? [...scopes, scope]
                        : scopes.filter((s) => s !== scope),
                    )
                  }
                />
                <span>{zh ? cn : en}</span>
              </label>
            ))}
          </fieldset>
          {scopes.some((s) => s.endsWith(":publish")) && (
            <p className="mt-3 text-sm text-amber-700">
              {t(
                "已选择正式发布权限：客户端将能让选定商品的内容或下载对外公开。",
                "Publication enabled: the client can make selected product content or downloads public.",
              )}
            </p>
          )}
          <Button
            type="submit"
            className="mt-4"
            disabled={busy || !data || !!created}
          >
            {busy ? t("处理中…", "Working…") : t("创建令牌", "Create token")}
          </Button>
          {created && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t(
                "请先保存并关闭下方的一次性令牌。",
                "Save and close the one-time token below first.",
              )}
            </p>
          )}
        </form>
      </div>
      {created && (
        <article
          className="rounded-xl border border-primary bg-primary/5 p-5"
          data-testid="mcp-new-token"
        >
          <h3 className="font-semibold">
            {t("令牌已创建 · 明文仅此一次", "Token created · shown only once")}
          </h3>
          <p className="mt-2 text-sm">
            {t(
              "请复制到客户端的秘密配置。关闭或刷新后无法重新查看；不要发送到聊天或提交到代码仓库。",
              "Copy it into your client secret settings. Closing or refreshing removes this view. Do not put it in chats or source control.",
            )}
          </p>
          <input
            aria-label={t("新令牌", "New token")}
            type="password"
            readOnly
            value={created.token}
            className={`${field} mt-3`}
            autoComplete="off"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => copy(created.token)}>
              {t("复制令牌", "Copy token")}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCreated(null);
                setConnection("");
              }}
            >
              {t("我已保存，关闭", "Saved, close")}
            </Button>
          </div>
        </article>
      )}
      <article className="rounded-xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">{t("已创建的令牌", "Tokens")}</h3>
          <Button variant="ghost" size="sm" onClick={load}>
            {t("刷新", "Refresh")}
          </Button>
        </div>
        {data?.legacyTokenConfigured && (
          <p className="mt-3 text-sm text-amber-700">
            {t(
              "另有环境变量令牌，由部署平台管理；此处撤销仅影响下列页面令牌。",
              "An environment token also exists and is managed by your deployment platform. Revocation here only affects the tokens below.",
            )}
          </p>
        )}
        {data?.tokens.length === 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("还没有创建令牌。", "No tokens yet.")}
          </p>
        )}
        <ul className="mt-3 divide-y">
          {data?.tokens.map((item) => {
            const inactive =
              !!item.revokedAt || Date.parse(item.expiresAt) <= Date.now();
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-start justify-between gap-3 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {item.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.revokedAt
                        ? t("已撤销", "Revoked")
                        : inactive
                          ? t("已过期", "Expired")
                          : t("有效", "Active")}
                    </span>
                  </p>
                  <p className="mt-1 break-words text-xs text-muted-foreground">
                    {item.products.join(", ")}
                  </p>
                  <p className="mt-1 text-xs">
                    {scopeLabels
                      .filter(([s]) => item.scopes.includes(s))
                      .map(([, cn, en]) => (zh ? cn : en))
                      .join(" · ")}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("到期：", "Expires: ")}
                    {new Date(item.expiresAt).toLocaleDateString(
                      zh ? "zh-CN" : "en-US",
                    )}
                  </p>
                </div>
                {!inactive &&
                  (revokeId === item.id ? (
                    <div className="space-y-2">
                      <p className="text-sm">
                        {t(
                          "撤销后连接将失效。",
                          "This will invalidate the token.",
                        )}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={busy}
                          onClick={() => revoke(item.id)}
                        >
                          {t("确认撤销", "Confirm revoke")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRevokeId(null)}
                        >
                          {t("取消", "Cancel")}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRevokeId(item.id)}
                    >
                      {t("撤销", "Revoke")}
                    </Button>
                  ))}
              </li>
            );
          })}
        </ul>
      </article>
      <article className="rounded-xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">3. {t("使用文档", "Usage guide")}</h3>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/admin/mcp/config?format=guide&locale=${locale}`}>
              {t("下载使用文档", "Download guide")}
            </a>
          </Button>
        </div>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm">
          <li>
            {t(
              "创建令牌，勾选商品和所需操作；先从查询或草稿编辑开始。",
              "Create a token for selected products and operations. Start with read or draft editing.",
            )}
          </li>
          <li>
            {t(
              "在支持 Bearer/Header 的客户端添加上述地址和令牌。Codex 配置模板使用 OAKTECH_MCP_TOKEN 环境变量，需让实际运行 Codex 的进程读取到它，再重新连接。",
              "Add the endpoint and token in a client supporting Bearer/header authentication. The Codex template reads OAKTECH_MCP_TOKEN from its process environment; supply it there and reconnect.",
            )}
          </li>
          <li>
            {t(
              "先在本页验证令牌，再在客户端检查工具列表。可以说：“查询 GitFinder 的版本”或“修改商品简介，只保存草稿”。",
              "Verify the token here, then inspect the tool list in your client. Try: “List GitFinder versions” or “Update the description as a draft.”",
            )}
          </li>
        </ol>
        <p className="mt-4 text-sm text-muted-foreground">
          {t(
            "远程 MCP 不需要下载服务程序。当前提供独立令牌，尚无 OAuth；ChatGPT 或其他客户端若不能填写 Bearer/Header，仅填地址无法完成授权。",
            "Remote MCP needs no server download. This service uses independent tokens, not OAuth. A client without Bearer/header support cannot authenticate using only the URL.",
          )}
        </p>
        <a
          className="mt-3 inline-block text-sm text-primary underline"
          href="https://developers.openai.com/codex/mcp"
          target="_blank"
          rel="noreferrer"
        >
          {t("Codex 官方接入说明", "Official Codex connection guide")}
        </a>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium">
            {t("工具和常见问题", "Tools and troubleshooting")}
          </summary>
          <div className="mt-3 space-y-2 text-sm">
            <p>
              list_products / get_product → create_product / update_product →
              publish_product
            </p>
            <p>
              list_releases / get_release → create_release / update_release →
              import_release_file → publish_release
            </p>
            <p>list_github_releases · import_product_image</p>
            <p>
              {t(
                "401：令牌无效、过期或已撤销。403 / MCP_FORBIDDEN：没有相应商品或操作权限。编辑冲突：重新读取商品或版本，再提交修改。下载模板包含占位符，需要按说明设置凭据。",
                "401: invalid, expired or revoked token. 403 / MCP_FORBIDDEN: missing product or operation permission. Edit conflicts: fetch the latest version before editing. Templates contain placeholders; configure credentials as documented.",
              )}
            </p>
          </div>
        </details>
      </article>
    </section>
  );
}
