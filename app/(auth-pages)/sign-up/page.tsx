import { signUpAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { GoogleMark } from "@/components/google-mark";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { encodedRedirect } from "@/utils/utils";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { CasdoorAuthPanel } from "@/components/casdoor-auth-panel";
import { isCasdoorAuthEnabled } from "@/lib/auth";
import { getRequestLanguage } from "@/i18n/server";
import { pageCopy } from "@/i18n/page-copy";

export default async function SignUp(props: { searchParams: Promise<Message> }) {
  const [searchParams, language] = await Promise.all([props.searchParams, getRequestLanguage()]);
  const copy = pageCopy(language.locale).auth;
  if (isCasdoorAuthEnabled) return <CasdoorAuthPanel mode="sign-up" locale={language.locale} />;

  const signUpWithGoogle = async () => {
    "use server";
    const supabase = await createClient();
    const origin = process.env.BASE_URL ?? (await headers()).get("origin") ?? "http://localhost:3000";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback`, queryParams: { access_type: "offline", prompt: "consent" } },
    });
    if (error) return encodedRedirect("error", "/sign-up", error.message);
    if (data.url) return redirect(data.url);
  };

  return <>
    <div className="flex flex-col space-y-2 text-center" data-page-locale={language.locale} data-testid="sign-up-page">
      <h1 className="text-2xl font-semibold tracking-tight">{copy.create}</h1>
      <p className="text-sm text-muted-foreground">{copy.signUpDescription}</p>
    </div>
    <div className="grid gap-6">
      <form className="grid gap-4">
        <div className="grid gap-2"><Label htmlFor="email">{copy.email}</Label><Input id="email" name="email" placeholder="name@example.com" type="email" autoCapitalize="none" autoComplete="email" autoCorrect="off" required /></div>
        <div className="grid gap-2"><Label htmlFor="password">{copy.password}</Label><Input id="password" name="password" type="password" placeholder="••••••••" autoComplete="new-password" required /></div>
        <SubmitButton className="w-full" pendingText={copy.creating} formAction={signUpAction}>{copy.createAccount}</SubmitButton>
        <FormMessage message={searchParams} />
      </form>
      <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">{copy.continue}</span></div></div>
      <form action={signUpWithGoogle}><Button type="submit" variant="outline" className="flex w-full items-center justify-center gap-2"><GoogleMark />{copy.googleSignUp}</Button></form>
      <div className="text-center text-sm text-muted-foreground">{copy.hasAccount} <Link href="/sign-in" className="text-primary underline underline-offset-4 hover:text-primary/90">{copy.signIn}</Link></div>
    </div>
  </>;
}
