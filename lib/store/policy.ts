import type { PublicationStatus } from "./types.ts";

export type AdminIdentity = { provider?: "casdoor" | "supabase"; id?: string | null; subject?: string | null; email?: string | null };

function parseAllowlist(value: string | undefined, caseSensitive = false) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => caseSensitive ? item.trim() : item.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isStoreAdmin(
  identity: AdminIdentity | null | undefined,
  config: { userIds?: string; subjects?: string; emails?: string },
) {
  if (!identity) return false;
  if (identity.provider === "casdoor") {
    const subjects = parseAllowlist(config.subjects, true);
    return Boolean(identity.subject && subjects.has(identity.subject));
  }

  const ids = parseAllowlist(config.userIds);
  const emails = parseAllowlist(config.emails);
  if (ids.size === 0 && emails.size === 0) return false;

  const id = identity.id?.trim().toLowerCase();
  const email = identity.email?.trim().toLowerCase();
  return Boolean((id && ids.has(id)) || (email && emails.has(email)));
}

export function isStoreSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function isManagedAssetUrl(value: string) {
  return value.startsWith("/") || isHttpsUrl(value);
}

export function isSafeFileName(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9._+-]*$/.test(value) && value !== "." && value !== "..";
}

export function isSha512(value: string) {
  return /^[a-f0-9]{128}$/i.test(value);
}

export function selectPublishedRows<T extends {
  status: PublicationStatus;
  is_current: boolean;
  published_at: string | null;
}>(rows: T[]) {
  return rows
    .filter((row) => row.status === "published" && Boolean(row.published_at))
    .sort((left, right) => {
      if (left.is_current !== right.is_current) return Number(right.is_current) - Number(left.is_current);
      return new Date(right.published_at!).getTime() - new Date(left.published_at!).getTime();
    });
}

export function isMissingStoreSchemaError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  return error.code === "42P01"
    || error.code === "PGRST205"
    || /store_products|product_releases|release_artifacts/i.test(error.message ?? "")
      && /does not exist|schema cache|could not find/i.test(error.message ?? "");
}
