import "./helpers/store-test-loader.mjs";
import test, { before, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import {
  codexMcpConfig,
  genericMcpConfig,
} from "../lib/store/mcp-client-config.ts";
let tokens: typeof import("../lib/store/mcp-tokens.ts");
let admin: typeof import("../app/api/admin/mcp/route.ts");
let mcp: typeof import("../app/api/mcp/route.ts");
let root: string;
const saved = { ...process.env };
before(async () => {
  tokens = await import("../lib/store/mcp-tokens.ts");
  admin = await import("../app/api/admin/mcp/route.ts");
  mcp = await import("../app/api/mcp/route.ts");
});
beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), "mcp-tokens-"));
  process.env.RELEASE_STORAGE_ROOT = root;
  process.env.NEXTAUTH_URL = "https://store.invalid";
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  for (const key of ["RELEASE_STORAGE_ROOT", "NEXTAUTH_URL"]) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  (globalThis as Record<string, unknown>).__storeTestDenied = false;
});
const input = {
  name: "My AI",
  products: ["new-app"],
  scopes: ["read", "product:write"],
  expiresInDays: 30,
};
function request(body: unknown, origin = "https://store.invalid") {
  return new Request("https://store.invalid/api/admin/mcp", {
    method: "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      "x-oaktech-mcp-admin": "1",
    },
    body: JSON.stringify(body),
  });
}
async function rpc(token: string, method: string, params?: unknown) {
  return mcp.POST(
    new Request("https://store.invalid/api/mcp", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }),
  );
}
test("one-time token is hashed on disk, list hides secrets, authentication survives fresh disk reads", async () => {
  const created = await tokens.createMcpToken(input, "admin");
  assert.match(created.token, /^oak_mcp_/);
  const raw = await readFile(path.join(root, ".mcp/tokens.json"), "utf8");
  assert.ok(!raw.includes(created.token));
  assert.match(raw, /"digest"/);
  assert.equal(
    (await stat(path.join(root, ".mcp/tokens.json"))).mode & 0o777,
    0o600,
  );
  const list = JSON.stringify(await tokens.listMcpTokens());
  assert.ok(!list.includes("digest"));
  assert.ok(!list.includes(created.token));
  const identity = await tokens.authenticateManagedMcp(
    `Bearer ${created.token}`,
  );
  assert.deepEqual(identity?.products, ["new-app"]);
  assert.equal(identity?.tokenId, created.record.id);
});
test("creation via administrator endpoint yields usable scoped MCP token; revoke denies later requests", async () => {
  const r = await admin.POST(request({ action: "create", input }));
  assert.equal(r.status, 201);
  assert.equal(r.headers.get("cache-control"), "no-store");
  const created = await r.json();
  const init = await rpc(created.token, "initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "test", version: "1" },
  });
  assert.equal(init.status, 200);
  const tools = await (await rpc(created.token, "tools/list")).json();
  assert.ok(
    tools.result.tools.some(
      (t: { name: string }) => t.name === "create_product",
    ),
  );
  assert.ok(
    !tools.result.tools.some(
      (t: { name: string }) => t.name === "publish_product",
    ),
  );
  const forbidden = await (
    await rpc(created.token, "tools/call", {
      name: "get_product",
      arguments: { slug: "open-play" },
    })
  ).json();
  assert.equal(forbidden.result.isError, true);
  assert.equal(
    (await admin.POST(request({ action: "revoke", id: created.record.id })))
      .status,
    200,
  );
  assert.equal((await rpc(created.token, "tools/list")).status, 401);
  assert.equal(
    (await admin.POST(request({ action: "revoke", id: created.record.id })))
      .status,
    200,
  );
});
test("expired and malformed managed tokens fail closed without environment fallback", async () => {
  const created = await tokens.createMcpToken(input, "admin");
  const file = path.join(root, ".mcp/tokens.json");
  const data = JSON.parse(await readFile(file, "utf8"));
  data.tokens[0].expiresAt = "2000-01-01T00:00:00Z";
  await writeFile(file, JSON.stringify(data));
  assert.equal(
    await tokens.authenticateManagedMcp(`Bearer ${created.token}`),
    null,
  );
  assert.equal(await tokens.authenticateManagedMcp("Bearer oak_mcp_bad"), null);
});
test("ordinary users and cross-site creation/revocation cannot access tokens", async () => {
  (globalThis as Record<string, unknown>).__storeTestDenied = true;
  assert.equal((await admin.GET()).status, 403);
  assert.equal(
    (await admin.POST(request({ action: "create", input }))).status,
    403,
  );
  (globalThis as Record<string, unknown>).__storeTestDenied = false;
  assert.equal(
    (
      await admin.POST(
        request({ action: "create", input }, "https://attacker.invalid"),
      )
    ).status,
    403,
  );
  assert.equal((await tokens.listMcpTokens()).length, 0);
});
test("invalid permissions, identities, expiration and oversized inputs do not issue tokens", async () => {
  for (const patch of [
    { scopes: ["super_admin"] },
    { scopes: ["product:publish"] },
    { products: [] },
    { products: ["*"] },
    { expiresInDays: 0 },
    { expiresInDays: 366 },
    { name: " " },
  ])
    assert.equal(
      (
        await admin.POST(
          request({ action: "create", input: { ...input, ...patch } }),
        )
      ).status,
      400,
    );
  assert.equal(
    (
      await admin.POST(
        request({
          action: "create",
          input: { ...input, name: "x".repeat(20000) },
        }),
      )
    ).status,
    413,
  );
  assert.equal((await tokens.listMcpTokens()).length, 0);
});
test("parallel issuance preserves all records and revoke audit attribution", async () => {
  const all = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      tokens.createMcpToken({ ...input, name: `client ${i}` }, "admin"),
    ),
  );
  assert.equal((await tokens.listMcpTokens()).length, 6);
  await Promise.all(
    all.map((t) => tokens.revokeMcpToken(t.record.id, "other-admin")),
  );
  const data = JSON.parse(
    await readFile(path.join(root, ".mcp/tokens.json"), "utf8"),
  );
  assert.ok(
    data.tokens.every(
      (t: { revokedBy: string }) => t.revokedBy === "other-admin",
    ),
  );
});
test("configuration downloads reference env or placeholder, never live token", () => {
  const url = "https://store.invalid/api/mcp";
  assert.match(
    codexMcpConfig(url),
    /bearer_token_env_var = "OAKTECH_MCP_TOKEN"/,
  );
  assert.equal(
    JSON.parse(genericMcpConfig(url)).mcpServers.oaktech.headers.Authorization,
    "Bearer <YOUR_TOKEN>",
  );
});

test("admin downloads return secret-free attachments and deny ordinary accounts", async () => {
  const config = await import("../app/api/admin/mcp/config/route.ts");
  const created = await tokens.createMcpToken(input, "admin");
  for (const format of ["codex", "json", "guide"]) {
    const response = await config.GET(
      new Request(
        `https://store.invalid/api/admin/mcp/config?format=${format}`,
      ),
    );
    assert.equal(response.status, 200);
    assert.match(
      response.headers.get("content-disposition") ?? "",
      /attachment/,
    );
    const text = await response.text();
    assert.ok(text.includes("https://store.invalid/api/mcp"));
    assert.ok(!text.includes(created.token));
  }
  (globalThis as Record<string, unknown>).__storeTestDenied = true;
  assert.equal(
    (
      await config.GET(
        new Request("https://store.invalid/api/admin/mcp/config?format=codex"),
      )
    ).status,
    403,
  );
});
