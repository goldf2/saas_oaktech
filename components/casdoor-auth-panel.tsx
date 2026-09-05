import { CasdoorAuthButton } from "@/components/casdoor-auth-button";
import Link from "next/link";

export function CasdoorAuthPanel({ mode }: { mode: "sign-in" | "sign-up" }) {
  const signingIn = mode === "sign-in";
  return (
    <>
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {signingIn ? "Welcome back" : "Create your account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign {signingIn ? "in" : "up"} securely through the OakTech identity service.
        </p>
      </div>
      <div className="grid gap-4">
        <CasdoorAuthButton mode={mode} />
        <p className="text-center text-sm text-muted-foreground">
          {signingIn ? "Need an account?" : "Already have an account?"}{" "}
          <Link
            href={signingIn ? "/sign-up" : "/sign-in"}
            className="text-primary underline underline-offset-4 hover:text-primary/90"
          >
            {signingIn ? "Sign up" : "Sign in"}
          </Link>
        </p>
      </div>
    </>
  );
}
