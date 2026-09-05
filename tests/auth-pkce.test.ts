import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import test from "node:test";
import type { OAuthConfig } from "next-auth/providers/oauth";
import { createAuthOptions } from "../lib/auth-options.ts";

const require = createRequire(import.meta.url);
// Exercise the same client factory used by NextAuth's OAuth callback.
const { openidClient } = require(join(dirname(require.resolve("next-auth")), "core/lib/oauth/client.js"));

test("Casdoor callback sends a PKCE verifier without client authentication", async (t) => {
  let issuer = "";
  let tokenRequest: { authorization: string | undefined; body: URLSearchParams } | undefined;
  const server = createServer(async (req, res) => {
    res.setHeader("Content-Type", "application/json");
    if (req.url === "/.well-known/openid-configuration") {
      res.end(JSON.stringify({
        issuer,
        authorization_endpoint: `${issuer}/login/oauth/authorize`,
        token_endpoint: `${issuer}/api/login/oauth/access_token`,
        jwks_uri: `${issuer}/.well-known/jwks`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        code_challenge_methods_supported: ["S256"],
      }));
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk);
    tokenRequest = {
      authorization: req.headers.authorization,
      body: new URLSearchParams(Buffer.concat(chunks).toString()),
    };
    // Receiving this provider error proves the callback reached the token endpoint.
    res.writeHead(400).end(JSON.stringify({ error: "invalid_grant" }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  issuer = `http://127.0.0.1:${address.port}`;

  const options = createAuthOptions({
    CASDOOR_AUTH_ENABLED: "true",
    NEXTAUTH_URL: "https://store.example.com",
    NEXTAUTH_SECRET: "independent-store-session-secret-for-test",
    CASDOOR_ISSUER: issuer,
    CASDOOR_CLIENT_ID: "store-web",
  });
  const provider = options.providers[0] as OAuthConfig<Record<string, unknown>>;
  assert.equal(provider.client?.token_endpoint_auth_method, "none");
  assert.equal("clientSecret" in provider, false);
  assert.deepEqual(provider.checks, ["pkce", "state"]);
  assert.equal(provider.idToken, true);
  assert.deepEqual(provider.authorization, { params: { scope: "openid" } });
  assert.equal(options.secret, "independent-store-session-secret-for-test");

  const callbackUrl = "https://store.example.com/api/auth/callback/casdoor";
  const client = await openidClient({ provider: { ...provider, callbackUrl } });
  const codeVerifier = "v".repeat(43);
  const authorization = new URL(client.authorizationUrl({
    scope: "openid", state: "test-state", code_challenge: "challenge", code_challenge_method: "S256",
  }));
  assert.equal(authorization.searchParams.get("code_challenge_method"), "S256");
  await assert.rejects(client.callback(callbackUrl, { code: "test-code", state: "test-state" }, {
    code_verifier: codeVerifier, state: "test-state",
  }), /invalid_grant/);
  assert.ok(tokenRequest);
  assert.equal(tokenRequest.authorization, undefined);
  assert.deepEqual(Object.fromEntries(tokenRequest.body), {
    grant_type: "authorization_code",
    code: "test-code",
    redirect_uri: callbackUrl,
    code_verifier: codeVerifier,
    client_id: "store-web",
  });
});
