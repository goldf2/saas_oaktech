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
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{labels.toggleMenu}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <SheetHeader>
          <SheetTitle>{labels.navigation}</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 mt-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-lg font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-4 border-t">
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
