import assert from "node:assert/strict";
import test from "node:test";
import { getAuthProvider, getMissingCasdoorEnvironment, normalizeIssuer, getCasdoorLogoutUrl } from "../lib/auth-config.ts";

test("Supabase remains the safe fallback until Casdoor is explicitly enabled", () => {
  assert.equal(getAuthProvider({}), "supabase");
  assert.deepEqual(getMissingCasdoorEnvironment({}), []);
});

test("Casdoor mode fails closed when required configuration is incomplete", () => {
  const env = { CASDOOR_AUTH_ENABLED: "true" };
  assert.equal(getAuthProvider(env), "casdoor");
  assert.deepEqual(getMissingCasdoorEnvironment(env), [
    "NEXTAUTH_URL",
    "NEXTAUTH_SECRET",
    "CASDOOR_ISSUER",
    "CASDOOR_CLIENT_ID",
  ]);
});

test("Casdoor issuer is normalized before OIDC discovery", () => {
  assert.equal(normalizeIssuer("https://auth.oaktechz.com///"), "https://auth.oaktechz.com");
});

test("Casdoor logout uses the fixed store return URL without exposing a secret or token", () => {
  const url = new URL(getCasdoorLogoutUrl({
    NEXTAUTH_URL: "https://store.example.com",
    CASDOOR_ISSUER: "https://identity.example.com/",
    CASDOOR_CLIENT_ID: "store web",
  }));
  assert.equal(url.origin + url.pathname, "https://identity.example.com/api/logout");
  assert.deepEqual(Object.fromEntries(url.searchParams), {
    client_id: "store web",
    post_logout_redirect_uri: "https://store.example.com/sign-in",
  });
});
