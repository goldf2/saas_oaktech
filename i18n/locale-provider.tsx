"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/store/types";
import { explicitLocale, localeFromAcceptLanguage, LANGUAGE_PREFERENCE_COOKIE, LOCALE_COOKIE, type LanguagePreference } from "./config";

type LanguageContext = { locale: Locale; preference: LanguagePreference; choose: (preference: LanguagePreference) => Locale };
const Context = createContext<LanguageContext | null>(null);

export function LocaleProvider({ initialLocale, initialPreference, children }: {
  initialLocale: Locale; initialPreference: LanguagePreference; children: ReactNode;
}) {
  const pathname = usePathname();
  const [selection, setSelection] = useState<{ locale: Locale; preference: LanguagePreference } | null>(null);
  const preference = selection?.preference ?? initialPreference;
  const locale = explicitLocale(pathname) ?? selection?.locale ?? initialLocale;
  useEffect(() => { document.documentElement.lang = locale === "zh" ? "zh-CN" : "en"; }, [locale]);

  function choose(next: LanguagePreference): Locale {
    const resolved = next === "auto" ? localeFromAcceptLanguage(navigator.languages.join(",") || navigator.language) : next;
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${LANGUAGE_PREFERENCE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    document.cookie = `${LOCALE_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    setSelection({ locale: resolved, preference: next });
    return resolved;
  }

  return <Context.Provider value={{ locale, preference, choose }}>{children}</Context.Provider>;
}

export function useLocale() {
  const context = useContext(Context);
  if (!context) throw new Error("LocaleProvider is required");
  return context;
}
