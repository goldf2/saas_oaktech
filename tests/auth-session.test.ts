import assert from "node:assert/strict";
import test from "node:test";
import { createAuthOptions } from "../lib/auth-options.ts";

const options = createAuthOptions({
  CASDOOR_AUTH_ENABLED: "true",
  NEXTAUTH_URL: "https://store.example.com",
  NEXTAUTH_SECRET: "session-secret-for-test-only",
  CASDOOR_ISSUER: "https://identity.example.com",
  CASDOOR_CLIENT_ID: "store-web",
  CASDOOR_CLIENT_SECRET: "client-secret-for-test-only",
});

test("Casdoor callbacks discard personal claims and retain the exact business identity", async () => {
  const token = await options.callbacks!.jwt!({
    token: { sub: "User-A", name: "Private Name", email: "private@example.com", picture: "https://example.com/avatar.png" },
    account: { provider: "casdoor", access_token: "must-not-be-persisted" },
    profile: { sub: "User-A", email: "private@example.com", phone: "private-phone" },
  } as never);
  assert.deepEqual(token, {
    sub: "User-A", casdoorSubject: "User-A", casdoorIssuer: "https://identity.example.com",
  });

  const session = await options.callbacks!.session!({
    session: { expires: "2030-01-01T00:00:00Z", user: { name: "Private Name", email: "private@example.com", image: "private-avatar" } },
    token,
  } as never);
  assert.deepEqual(session, {
    expires: "2030-01-01T00:00:00Z",
    user: { id: "User-A", subject: "User-A", issuer: "https://identity.example.com" },
  });
});

test("renewing a Casdoor session also removes obsolete personal claims", async () => {
  const token = await options.callbacks!.jwt!({
    token: { sub: "User-A", casdoorSubject: "User-A", casdoorIssuer: "https://identity.example.com", email: "old@example.com", name: "Old Name" },
  } as never);
  assert.deepEqual(token, {
    sub: "User-A", casdoorSubject: "User-A", casdoorIssuer: "https://identity.example.com",
  });
});

test("Casdoor sessions reject missing subjects and identities from a previous issuer", async () => {
  await assert.rejects(async () => options.callbacks!.jwt!({
    token: {}, account: { provider: "casdoor" }, profile: {},
  } as never), /INVALID_CASDOOR_SUBJECT/);
  await assert.rejects(async () => options.callbacks!.jwt!({
    token: { casdoorSubject: "User-A", casdoorIssuer: "https://old-identity.example.com" },
  } as never), /INVALID_CASDOOR_ISSUER/);
});
