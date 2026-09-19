import { forgotPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { getRequestLanguage } from "@/i18n/server";
import { pageCopy } from "@/i18n/page-copy";

export default async function ForgotPassword(props: { searchParams: Promise<Message> }) {
  const [searchParams, language] = await Promise.all([props.searchParams, getRequestLanguage()]);
  const copy = pageCopy(language.locale).auth;
  return <>
    <div className="flex flex-col space-y-2 text-center" data-page-locale={language.locale} data-testid="forgot-password-page">
      <h1 className="text-2xl font-semibold tracking-tight">{copy.reset}</h1>
      <p className="text-sm text-muted-foreground">{copy.resetDescription}</p>
    </div>
    <div className="grid gap-6">
      <form className="grid gap-4">
        <div className="grid gap-2"><Label htmlFor="email">{copy.email}</Label><Input id="email" name="email" placeholder="name@example.com" type="email" autoCapitalize="none" autoComplete="email" autoCorrect="off" required /></div>
        <SubmitButton className="w-full" formAction={forgotPasswordAction} pendingText={copy.sending}>{copy.sendReset}</SubmitButton>
        <FormMessage message={searchParams} />
      </form>
      <div className="text-center text-sm text-muted-foreground">{copy.remember} <Link href="/sign-in" className="text-primary underline underline-offset-4 hover:text-primary/90">{copy.signIn}</Link></div>
    </div>
  </>;
}
