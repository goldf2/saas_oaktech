import "server-only";
import { cookies, headers } from "next/headers";
import { isLocale, languagePreference, resolveLocale, LANGUAGE_PREFERENCE_COOKIE, REQUEST_LOCALE_HEADER } from "./config";

export async function getRequestLanguage() {
  const [cookieStore, requestHeaders] = await Promise.all([cookies(), headers()]);
  const preference = languagePreference(cookieStore.get(LANGUAGE_PREFERENCE_COOKIE)?.value);
  const fromProxy = requestHeaders.get(REQUEST_LOCALE_HEADER) ?? undefined;
  const defaultLocale = resolveLocale(null, preference, requestHeaders.get("accept-language"));
  const locale = isLocale(fromProxy) ? fromProxy : defaultLocale;
  return { locale, defaultLocale, preference };
}
