import type { NextAuthOptions, Session } from "next-auth";
import { getAuthProvider, getMissingCasdoorEnvironment, normalizeIssuer, type AuthEnvironment } from "./auth-config.ts";

function requireSubject(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error("INVALID_CASDOOR_SUBJECT");
  }
  return value;
}

export function createAuthOptions(env: AuthEnvironment = process.env): NextAuthOptions {
  const missingEnvironment = getMissingCasdoorEnvironment(env);
  if (missingEnvironment.length > 0) {
    throw new Error(`Casdoor authentication is missing: ${missingEnvironment.join(", ")}`);
  }

  const casdoorIssuer = normalizeIssuer(env.CASDOOR_ISSUER);
  return {
    providers: getAuthProvider(env) === "casdoor"
      ? [{
          id: "casdoor",
          name: "Casdoor",
          type: "oauth",
          wellKnown: `${casdoorIssuer}/.well-known/openid-configuration`,
          clientId: env.CASDOOR_CLIENT_ID,
          client: { token_endpoint_auth_method: "none" },
          idToken: true,
          checks: ["pkce", "state"],
          authorization: { params: { scope: "openid" } },
          profile(profile) {
            return { id: requireSubject(profile.sub), name: null, email: null, image: null };
          },
        }]
      : [],
    session: { strategy: "jwt" },
    secret: env.NEXTAUTH_SECRET,
    pages: { signIn: "/sign-in" },
    callbacks: {
      async jwt({ token, account, profile }) {
        const signingIn = account?.provider === "casdoor";
        if (!signingIn && token.casdoorIssuer !== casdoorIssuer) {
          throw new Error("INVALID_CASDOOR_ISSUER");
        }
        const subject = requireSubject(signingIn ? profile?.sub : token.casdoorSubject);
        // Keep only the business identity, including when renewing an older session.
        return { sub: subject, casdoorSubject: subject, casdoorIssuer };
      },
      async session({ session, token }) {
        const subject = requireSubject(token.casdoorSubject);
        const user: NonNullable<Session["user"]> & { id: string; subject: string; issuer: string } = {
          id: subject, subject, issuer: casdoorIssuer,
        };
        return {
          expires: session.expires,
          user,
        };
      },
    },
  };
}
