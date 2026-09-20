import "server-only";
import {
  createHash,
  randomBytes,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { getReleaseStorageRoot } from "./storage";
import {
  MCP_SCOPES,
  authenticateStoreMcp,
  type McpScope,
  type McpPrincipal,
} from "./mcp-auth";
import { isStoreSlug } from "./policy";

export const tokenInput = z
  .object({
    name: z.string().trim().min(1).max(80),
    products: z.array(z.string().refine(isStoreSlug)).min(1).max(100),
    scopes: z
      .array(z.enum(MCP_SCOPES))
      .min(1)
      .refine((s) => s.includes("read")),
    expiresInDays: z.number().int().min(1).max(365),
  })
  .strict();
type TokenRecord = {
  id: string;
  name: string;
  digest: string;
  scopes: McpScope[];
  products: string[];
  createdAt: string;
  createdBy: string;
  expiresAt: string;
  revokedAt: string | null;
  revokedBy: string | null;
};
type TokenStore = { schemaVersion: 1; tokens: TokenRecord[] };
export type TokenSummary = Omit<
  TokenRecord,
  "digest" | "createdBy" | "revokedBy"
>;
function location() {
  return path.join(getReleaseStorageRoot(), ".mcp", "tokens.json");
}
async function readTokens(): Promise<TokenStore> {
  try {
    const data = JSON.parse(await readFile(location(), "utf8")) as TokenStore;
    if (data.schemaVersion !== 1 || !Array.isArray(data.tokens))
      throw new Error("MCP_TOKEN_STORE_INVALID");
    return data;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT")
      return { schemaVersion: 1, tokens: [] };
    throw e;
  }
}
// Matches the catalog's single-process deployment boundary. The whole record,
// including creator/revoker attribution, is committed in one atomic rename.
let queue: Promise<unknown> = Promise.resolve();
function mutate<T>(fn: (data: TokenStore) => T) {
  const run = queue.then(async () => {
    const data = await readTokens();
    const result = fn(data);
    const file = location();
    await mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
    const temp = `${file}.${randomUUID()}.tmp`;
    await writeFile(temp, JSON.stringify(data), { mode: 0o600, flag: "wx" });
    await rename(temp, file);
    return result;
  });
  queue = run.catch(() => {});
  return run;
}
function summary({
  digest: _digest,
  createdBy: _creator,
  revokedBy: _revoker,
  ...value
}: TokenRecord): TokenSummary {
  return value;
}
export async function listMcpTokens() {
  return (await readTokens()).tokens.map(summary).reverse();
}
export async function createMcpToken(raw: unknown, actorId: string) {
  const input = tokenInput.parse(raw);
  const token = `oak_mcp_${randomBytes(32).toString("base64url")}`;
  const createdAt = new Date().toISOString();
  const record: TokenRecord = {
    id: randomUUID(),
    name: input.name,
    digest: createHash("sha256").update(token).digest("hex"),
    scopes: Array.from(new Set(input.scopes)),
    products: Array.from(new Set(input.products)),
    createdAt,
    createdBy: actorId,
    expiresAt: new Date(
      Date.now() + input.expiresInDays * 86400000,
    ).toISOString(),
    revokedAt: null,
    revokedBy: null,
  };
  await mutate((data) => {
    if (data.tokens.length >= 1000) throw new Error("MCP_TOKEN_LIMIT");
    data.tokens.push(record);
  });
  return { token, record: summary(record) };
}
export async function revokeMcpToken(id: string, actorId: string) {
  return mutate((data) => {
    const item = data.tokens.find((t) => t.id === id);
    if (!item) throw new Error("MCP_TOKEN_NOT_FOUND");
    if (!item.revokedAt) {
      item.revokedAt = new Date().toISOString();
      item.revokedBy = actorId;
    }
    return summary(item);
  });
}
export async function authenticateManagedMcp(
  authorization: string | null,
): Promise<McpPrincipal | null> {
  const raw = /^Bearer ([^\s]+)$/i.exec(authorization ?? "")?.[1] ?? "";
  // Never revive a revoked managed credential through the environment fallback.
  if (!raw.startsWith("oak_mcp_")) return authenticateStoreMcp(authorization);
  if (!/^oak_mcp_[A-Za-z0-9_-]{43}$/.test(raw)) return null;
  const digest = createHash("sha256").update(raw).digest();
  const record = (await readTokens()).tokens.find((t) => {
    const expected = Buffer.from(t.digest, "hex");
    return (
      expected.length === digest.length && timingSafeEqual(expected, digest)
    );
  });
  if (
    !record ||
    record.revokedAt ||
    !Number.isFinite(Date.parse(record.expiresAt)) ||
    Date.parse(record.expiresAt) <= Date.now()
  )
    return null;
  return {
    scopes: record.scopes,
    products: record.products,
    tokenId: record.id,
  };
}
