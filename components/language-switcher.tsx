"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localePath, stripLocale } from "@/i18n/config";

export function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const base = stripLocale(pathname);
  const localizedBase = base === "/" || base.startsWith("/products/") ? base : "/";
  return <div className="hidden items-center rounded-md border p-0.5 sm:flex" aria-label="Language"><Link href={localePath("en", localizedBase)} hrefLang="en" className="rounded px-2 py-1 text-xs hover:bg-accent">EN</Link><Link href={localePath("zh", localizedBase)} hrefLang="zh-CN" className="rounded px-2 py-1 text-xs hover:bg-accent">中文</Link></div>;
}
