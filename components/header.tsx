"use client";

import { AuthSignOutButton } from "./auth-sign-out-button";
import type { AppUser } from "@/lib/auth";
import type { AuthProvider } from "@/lib/auth-config";
import Link from "next/link";
import { Button } from "./ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { Logo } from "./logo";
import { usePathname } from "next/navigation";
import { MobileNav } from "./mobile-nav";
import { LanguageSwitcher } from "./language-switcher";
import { localeFromPathname } from "@/i18n/config";
import { getMessages } from "@/i18n/messages";

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Logo href={localized ? `/${locale}` : "/"} />
        </div>
        
        {/* Centered Navigation */}
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeSwitcher />
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {isDashboard && (
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  {user.email ?? user.name}
                </span>
              )}
              {!isDashboard && (
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard">{copy.dashboard}</Link>
                </Button>
              )}
              <AuthSignOutButton provider={authProvider} label={copy.signOut} />
            </div>
          ) : (
            <div className="hidden md:flex gap-2">
              <Button asChild size="sm" variant="outline">
                <Link href="/sign-in">{copy.signIn}</Link>
              </Button>
              <Button asChild size="sm">
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
