export type AuthProvider = "casdoor" | "supabase";

export type AuthEnvironment = Partial<Record<
  | "CASDOOR_AUTH_ENABLED"
  | "NEXTAUTH_URL"
  | "NEXTAUTH_SECRET"
  | "CASDOOR_ISSUER"
  | "CASDOOR_CLIENT_ID",
  string
>>;

const CASDOOR_REQUIRED_ENV = [
  "NEXTAUTH_URL",
  "NEXTAUTH_SECRET",
  "CASDOOR_ISSUER",
  "CASDOOR_CLIENT_ID",
] as const;

export function getAuthProvider(env: AuthEnvironment = process.env): AuthProvider {
  return env.CASDOOR_AUTH_ENABLED === "true" ? "casdoor" : "supabase";
}

export function getMissingCasdoorEnvironment(env: AuthEnvironment = process.env) {
  if (getAuthProvider(env) !== "casdoor") return [];
  return CASDOOR_REQUIRED_ENV.filter((name) => !env[name]?.trim());
}

export function normalizeIssuer(value: string | undefined) {
  return (value ?? "http://localhost:8000").replace(/\/+$/, "");
}

export function getCasdoorLogoutUrl(env: AuthEnvironment = process.env) {
  const url = new URL("/api/logout", normalizeIssuer(env.CASDOOR_ISSUER));
  url.searchParams.set("client_id", env.CASDOOR_CLIENT_ID ?? "");
  url.searchParams.set("post_logout_redirect_uri", new URL("/sign-in", env.NEXTAUTH_URL).href);
  return url.href;
}
