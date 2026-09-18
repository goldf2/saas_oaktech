"use client";

import { usePathname, useRouter } from "next/navigation";
import { languageTarget, type LanguagePreference } from "@/i18n/config";
import { useLocale } from "@/i18n/locale-provider";

export function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { locale, preference, choose } = useLocale();
  function change(next: LanguagePreference) {
    const resolved = choose(next);
    const target = languageTarget(pathname, resolved);
    // No document navigation: server refresh preserves unaffected controlled forms.
    if (target !== pathname) router.push(target + window.location.search + window.location.hash);
    else router.refresh();
  }
  const options: { value: LanguagePreference; title: string }[] = [
    { value: "auto", title: locale === "zh" ? "自动" : "Auto" },
    { value: "en", title: "EN" }, { value: "zh", title: "中文" },
  ];
  return <div data-testid="language-switcher" data-language={locale} data-preference={preference}>
    <div className="hidden items-center rounded-md border p-0.5 sm:flex" role="group" aria-label="语言 / Language">
      {options.map(option => <button key={option.value} type="button" data-language-choice={option.value} aria-pressed={preference === option.value}
        title={option.value === "auto" ? (locale === "zh" ? "跟随浏览器语言" : "Follow browser language") : option.title}
        className="rounded px-2 py-1 text-xs hover:bg-accent aria-pressed:bg-accent aria-pressed:font-semibold"
        onClick={() => change(option.value)}>{option.title}</button>)}
    </div>
    <select data-testid="mobile-language-switcher" aria-label="语言 / Language" value={preference} onChange={event => change(event.target.value as LanguagePreference)}
      className="h-8 max-w-[88px] rounded-md border bg-background px-1 text-xs sm:hidden">
      {options.map(option => <option key={option.value} value={option.value}>{option.title}</option>)}
    </select>
  </div>;
}
