import type { Locale } from "@/lib/store/types";

export const LOCALES = ["en", "zh"] as const;
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "oaktech-locale";
// v1 used LOCALE_COOKIE for both automatic detection and manual choices. Those
// values cannot prove user intent, so only the explicit preference below wins.
export const LANGUAGE_PREFERENCE_COOKIE = "oaktech-language-preference";
export const REQUEST_LOCALE_HEADER = "x-oaktech-request-locale";
export type LanguagePreference = Locale | "auto";

export function languagePreference(value: string | undefined): LanguagePreference {
  return isLocale(value) ? value : "auto";
}

export function explicitLocale(pathname: string | null | undefined): Locale | null {
  const segment = pathname?.split("/")[1];
  return isLocale(segment) ? segment : null;
}

export function resolveLocale(pathname: string | null | undefined, preference: string | undefined, accepted: string | null | undefined): Locale {
  return explicitLocale(pathname) ?? (isLocale(preference) ? preference : localeFromAcceptLanguage(accepted));
}

// Only routes with an existing localized counterpart get a language prefix.
// Dashboard, editor, account and support routes keep their path and query state.
export function languageTarget(pathname: string, locale: Locale): string {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return `/${locale}`;
  const base = stripLocale(pathname);
  if (base === "/" || base === "/products") return `/${locale}`;
  if (/^\/products\/[a-z0-9][a-z0-9-]*(?:\/releases)?$/.test(base)) return localePath(locale, base);
  return pathname;
}

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "zh";
}

export function localeFromAcceptLanguage(value: string | null | undefined): Locale {
  const candidates = (value ?? "")
    .split(",")
    .map((entry, index) => {
      const [rawTag, ...parameters] = entry.trim().toLowerCase().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const quality = qualityParameter ? Number(qualityParameter.trim().slice(2)) : 1;
      return { tag: rawTag, quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .filter((candidate) => candidate.tag && candidate.quality > 0 && candidate.quality <= 1)
    .sort((left, right) => right.quality - left.quality || left.index - right.index);

  for (const candidate of candidates) {
    if (candidate.tag === "zh" || candidate.tag.startsWith("zh-")) return "zh";
    if (candidate.tag === "en" || candidate.tag.startsWith("en-")) return "en";
  }

  return DEFAULT_LOCALE;
}

export function localeFromPathname(pathname: string | null | undefined): Locale {
  const firstSegment = pathname?.split("/").filter(Boolean)[0];
  return isLocale(firstSegment) ? firstSegment : DEFAULT_LOCALE;
}

export function stripLocale(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  if (isLocale(segments[0])) segments.shift();
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
}

export function localePath(locale: Locale, pathname = "/") {
  const clean = stripLocale(pathname);
  return clean === "/" ? `/${locale}` : `/${locale}${clean}`;
}
