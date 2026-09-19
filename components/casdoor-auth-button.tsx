"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";

export function CasdoorAuthButton({ mode, label }: { mode: "sign-in" | "sign-up"; label?: string }) {
  return (
    <Button type="button" className="w-full" onClick={() => signIn("casdoor", { callbackUrl: "/dashboard" })}>
      {label ?? (mode === "sign-in" ? "Continue with Casdoor" : "Create account with Casdoor")}
    </Button>
  );
}
