"use client";

import { Logo } from "./logo";
import Link from "next/link";
import { Mail } from "lucide-react";
import packageJson from "@/package.json";
import { usePathname } from "next/navigation";
import { getMessages } from "@/i18n/messages";
import { localeFromPathname, localePath } from "@/i18n/config";

export function Footer() {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const copy = getMessages(locale).common;
  const localized = pathname?.startsWith(`/${locale}`);
  const footerLinks = [
    { title: copy.browse, links: [
      { label: copy.allProducts, href: localized ? `/${locale}` : "/products" },
      { label: copy.browserExtensions, href: "/categories/browser-extensions" },
      { label: copy.xTweetExtractor, href: "/products/x-tweet-extractor" },
      { label: "GitFinder 2", href: localePath(locale, "/products/gitfinder-2") },
    ] },
    { title: copy.company, links: [{ label: copy.about, href: "/about" }, { label: copy.support, href: "/support" }] },
    { title: copy.legal, links: [{ label: copy.privacyPolicy, href: "/privacy" }, { label: copy.terms, href: "/terms" }] },
  ];
  return (
    <footer className="border-t">
      <div className="container px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-full lg:col-span-2">
            <Logo href={localized ? `/${locale}` : "/"} />
            <p className="mt-4 text-sm text-muted-foreground">
              {copy.footerDescription}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <a href="mailto:support@oaktech.dev" className="hover:text-primary transition-colors">
                support@oaktech.dev
              </a>
            </div>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-4">
            {footerLinks.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">{group.title}</h3>
                <nav className="flex flex-col gap-2">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-1 border-t pt-8 text-center text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} OakTech. {copy.rights}</p>
          <p>{copy.storeVersion} v{packageJson.version}</p>
        </div>
      </div>
    </footer>
  );
}
