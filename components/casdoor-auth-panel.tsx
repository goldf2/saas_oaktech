import { CasdoorAuthButton } from "@/components/casdoor-auth-button";
import Link from "next/link";
import { pageCopy } from "@/i18n/page-copy";
import type { Locale } from "@/lib/store/types";

export function CasdoorAuthPanel({ mode, locale }: { mode: "sign-in" | "sign-up"; locale: Locale }) {
  const signingIn = mode === "sign-in";
  const copy = pageCopy(locale).auth;
  return (
    <>
      <div className="flex flex-col space-y-2 text-center" data-testid="casdoor-auth-panel" data-page-locale={locale}>
        <h1 className="text-2xl font-semibold tracking-tight">{signingIn ? copy.welcome : copy.create}</h1>
        <p className="text-sm text-muted-foreground">{signingIn ? copy.casdoorDescriptionSignIn : copy.casdoorDescriptionSignUp}</p>
      </div>
      <div className="grid gap-4">
        <CasdoorAuthButton mode={mode} label={signingIn ? copy.casdoorSignIn : copy.casdoorSignUp} />
        <p className="text-center text-sm text-muted-foreground">
          {signingIn ? copy.casdoorNeed : copy.casdoorHave}{" "}
          <Link href={signingIn ? "/sign-up" : "/sign-in"} className="text-primary underline underline-offset-4 hover:text-primary/90">
            {signingIn ? copy.signUp : copy.signIn}
          </Link>
        </p>
      </div>
    </>
  );
}
