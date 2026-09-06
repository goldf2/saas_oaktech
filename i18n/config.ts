import type { Locale } from "@/lib/store/types";

export const LOCALES = ["en", "zh"] as const;
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "oaktech-locale";

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
    .filter((candidate) => candidate.tag && candidate.quality > 0)
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
