// Local-only synthetic-session fixture for manual UI QA. Never run on a public host.
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  { encode } = require("next-auth/jwt");
const socket = net.createServer();
await new Promise((r) => socket.listen(0, "127.0.0.1", r));
const port = socket.address().port;
await new Promise((r) => socket.close(r));
const root = await mkdtemp(path.join(os.tmpdir(), "oaktech-mcp-ui-"));
const secret = randomBytes(32).toString("hex");
const base = `http://127.0.0.1:${port}`;
const issuer = "http://127.0.0.1:9";
const app = spawn(
  process.execPath,
  [
    "node_modules/next/dist/bin/next",
    "start",
    "-H",
    "127.0.0.1",
    "-p",
    String(port),
  ],
  {
    env: {
      ...process.env,
      NODE_ENV: "production",
      RELEASE_STORAGE_ROOT: root,
      CASDOOR_AUTH_ENABLED: "true",
      CASDOOR_ISSUER: issuer,
      CASDOOR_CLIENT_ID: "mcp-local-qa",
      NEXTAUTH_URL: base,
      NEXTAUTH_SECRET: secret,
      BASE_URL: base,
      OAKTECH_ADMIN_SUBJECTS: "isolated-mcp-admin",
      OAKTECH_ADMIN_USER_IDS: "",
      OAKTECH_ADMIN_EMAILS: "",
      OAKTECH_MCP_TOKEN: "",
      OAKTECH_MCP_SCOPES: "",
      OAKTECH_MCP_PRODUCTS: "",
    },
    stdio: "ignore",
  },
);
for (let i = 0; i < 120; i++) {
  if (app.exitCode !== null) throw new Error("preview server exited");
  try {
    if ((await fetch(base + "/api/health")).ok) break;
  } catch {}
  if (i === 119) throw new Error("preview startup timeout");
  await new Promise((r) => setTimeout(r, 250));
}
const login = createServer(async (req, res) => {
  if (!["/admin", "/user"].includes(req.url)) {
    res.writeHead(404);
    res.end();
    return;
  }
  const subject =
    req.url === "/admin" ? "isolated-mcp-admin" : "isolated-mcp-user";
  const token = await encode({
    secret,
    token: { sub: subject, casdoorSubject: subject, casdoorIssuer: issuer },
    maxAge: 3600,
  });
  res.writeHead(302, {
    "Set-Cookie": [
      `next-auth.session-token=${token}; Path=/; HttpOnly; SameSite=Lax`,
      `oaktech-language=zh; Path=/; SameSite=Lax`,
    ],
    Location: base + "/dashboard?view=mcp",
    "Cache-Control": "no-store",
  });
  res.end();
});
await new Promise((r) => login.listen(0, "127.0.0.1", r));
console.log(
  JSON.stringify({
    app: base,
    admin: `http://127.0.0.1:${login.address().port}/admin`,
    user: `http://127.0.0.1:${login.address().port}/user`,
    scope: "isolated temporary storage and synthetic local accounts only",
  }),
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  login.close();
  app.kill("SIGTERM");
  await new Promise((r) => (app.exitCode !== null ? r() : app.once("exit", r)));
  await rm(root, { recursive: true, force: true });
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
