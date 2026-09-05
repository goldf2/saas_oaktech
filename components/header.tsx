"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { AuthSignOutButton } from "./auth-sign-out-button";
import { ThemeSwitcher } from "./theme-switcher";
import { Logo } from "./logo";
import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { LanguageSwitcher } from "./language-switcher";
import { localeFromPathname } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";
import type { AppUser } from "@/lib/auth";
import type { AuthProvider } from "@/lib/auth-config";

interface HeaderProps {
  user: AppUser | null;
  authProvider: AuthProvider;
}

interface NavItem {
  label: string;
  href: string;
}

export default function Header({ user, authProvider }: HeaderProps) {
  const pathname = usePathname();
  const locale = localeFromPathname(pathname);
  const copy = getMessages(locale).common;
  const localized = pathname?.startsWith(`/${locale}`);
  const isDashboard = pathname?.startsWith("/dashboard");

  const mainNavItems: NavItem[] = [
    { label: copy.products, href: localized ? `/${locale}` : "/products" },
    { label: copy.browserExtensions, href: "/categories/browser-extensions" },
    { label: copy.support, href: "/support" },
  ];

  const dashboardItems: NavItem[] = [];

  const navItems = isDashboard ? dashboardItems : mainNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--store-line)/0.72)] bg-[hsl(var(--store-surface)/0.74)] backdrop-blur-2xl supports-[backdrop-filter]:bg-[hsl(var(--store-surface)/0.64)]">
      <div className="store-shell relative flex h-14 items-center justify-between">
        <div className="flex items-center">
          <Logo href={localized ? `/${locale}` : "/"} />
        </div>
        
        <nav aria-label={copy.navigation} className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full bg-[hsl(var(--store-surface-muted)/0.7)] p-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href || pathname?.startsWith(`${item.href}/`) ? "page" : undefined}
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-[hsl(var(--store-secondary))] transition-colors hover:bg-[hsl(var(--store-surface))] hover:text-[hsl(var(--store-ink))] aria-[current=page]:bg-[hsl(var(--store-surface))] aria-[current=page]:text-[hsl(var(--store-ink))] aria-[current=page]:shadow-sm"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
          {user ? (
            <div className="hidden items-center gap-2 lg:flex">
              {isDashboard && (
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  {user.email ?? user.name}
                </span>
              )}
              {!isDashboard && (
              <Button asChild size="sm" variant="outline" className="rounded-full">
                <Link href="/dashboard">{copy.dashboard}</Link>
                </Button>
              )}
              <AuthSignOutButton provider={authProvider} label={copy.signOut} />
            </div>
          ) : (
            <div className="hidden gap-2 lg:flex">
              <Button asChild size="sm" variant="ghost" className="rounded-full">
                <Link href="/sign-in">{copy.signIn}</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-[hsl(var(--store-blue))] hover:bg-[hsl(var(--store-blue-hover))]">
                <Link href="/sign-up">{copy.signUp}</Link>
              </Button>
            </div>
          )}
          <MobileNav items={navItems} user={user} authProvider={authProvider} isDashboard={isDashboard} labels={{ navigation: copy.navigation, toggleMenu: copy.toggleMenu, dashboard: copy.dashboard, signIn: copy.signIn, signUp: copy.signUp, signOut: copy.signOut }} />
        </div>
      </div>
    </header>
  );
}
