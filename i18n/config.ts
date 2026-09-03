import type { Locale } from "@/lib/store/types";

export const LOCALES = ["en", "zh"] as const;
export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "zh";
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
