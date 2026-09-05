"use client";

import { signOutAction } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { AuthProvider } from "@/lib/auth-config";
import { signOut } from "next-auth/react";

export function AuthSignOutButton({
  provider,
  label,
  className,
}: {
  provider: AuthProvider;
  label: string;
  className?: string;
}) {
  if (provider === "casdoor") {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        onClick={() => signOut({ callbackUrl: "/auth/sign-out" })}
      >
        {label}
      </Button>
    );
  }

  return (
    <form action={signOutAction} className={className}>
      <Button type="submit" variant="outline" size="sm" className="w-full">
        {label}
      </Button>
    </form>
  );
}
