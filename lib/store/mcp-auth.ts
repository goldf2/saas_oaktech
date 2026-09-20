import { timingSafeEqual } from 'node:crypto';
import { isStoreSlug } from './policy';

export const MCP_SCOPES = ['read', 'product:write', 'release:write', 'product:publish', 'release:publish'] as const;
export type McpScope = typeof MCP_SCOPES[number];
export type McpPrincipal = { scopes: McpScope[]; products: string[]; tokenId?: string };
// An independent, explicitly configured service identity. Existing release tokens
// and browser cookies never grant these new capabilities.
export function authenticateStoreMcp(authorization: string | null, env = process.env): McpPrincipal | null {
  const expected = Buffer.from(env.OAKTECH_MCP_TOKEN ?? '');
  const supplied = Buffer.from(/^Bearer ([^\s]+)$/i.exec(authorization ?? '')?.[1] ?? '');
  if (expected.length < 32 || supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) return null;
  const scopes = (env.OAKTECH_MCP_SCOPES ?? '').split(',').map(s => s.trim());
  const products = (env.OAKTECH_MCP_PRODUCTS ?? '').split(',').map(s => s.trim());
  if (!scopes.length || scopes.some(s => !MCP_SCOPES.includes(s as McpScope)) || !products.length || products.some(p => !isStoreSlug(p))) return null;
  return { scopes: scopes as McpScope[], products };
}
export function requireMcpScope(principal: McpPrincipal, scope: McpScope, slug?: string) {
  if (!principal.scopes.includes(scope) || slug !== undefined && !principal.products.includes(slug)) throw new Error('MCP_FORBIDDEN');
}
