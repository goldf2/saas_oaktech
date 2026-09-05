"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import { AuthSignOutButton } from "@/components/auth-sign-out-button";
import type { AppUser } from "@/lib/auth";
import type { AuthProvider } from "@/lib/auth-config";

interface MobileNavProps {
  items: { label: string; href: string }[];
  user: AppUser | null;
  authProvider: AuthProvider;
  isDashboard: boolean;
  labels: { navigation: string; toggleMenu: string; dashboard: string; signIn: string; signUp: string; signOut: string };
}

export function MobileNav({ items, user, authProvider, isDashboard, labels }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{labels.toggleMenu}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="store-glass flex flex-col border-r-0">
        <SheetHeader>
          <SheetTitle>{labels.navigation}</SheetTitle>
        </SheetHeader>
        <nav className="mt-6 flex flex-col gap-1">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-4 py-3 text-lg font-semibold tracking-[-0.02em] text-[hsl(var(--store-secondary))] transition-colors hover:bg-[hsl(var(--store-surface-muted))] hover:text-[hsl(var(--store-ink))]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-[hsl(var(--store-line))] pt-4">
          {user ? (
            <div className="flex flex-col gap-2">
              {(user.email || user.name) && (
                <p className="text-sm text-muted-foreground">{user.email ?? user.name}</p>
              )}
              {!isDashboard && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard">{labels.dashboard}</Link>
                </Button>
              )}
              <AuthSignOutButton provider={authProvider} label={labels.signOut} className="w-full" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/sign-in">{labels.signIn}</Link>
              </Button>
              <Button asChild variant="default" className="w-full">
                <Link href="/sign-up">{labels.signUp}</Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
