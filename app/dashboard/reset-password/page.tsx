import { resetPasswordAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getRequestLanguage } from "@/i18n/server";
import { pageCopy } from "@/i18n/page-copy";

export default async function ResetPassword(props: { searchParams: Promise<Message> }) {
  const [searchParams, language] = await Promise.all([props.searchParams, getRequestLanguage()]);
  const copy = pageCopy(language.locale).auth;
  return <div className="mx-auto flex w-full flex-col justify-center space-y-6 py-10 sm:w-[350px]" data-page-locale={language.locale} data-testid="reset-password-page">
    <div className="flex flex-col space-y-2 text-center"><h1 className="text-2xl font-semibold tracking-tight">{copy.reset}</h1><p className="text-sm text-muted-foreground">{copy.newPasswordDescription}</p></div>
    <form className="grid gap-4">
      <div className="grid gap-2"><Label htmlFor="password">{copy.newPassword}</Label><Input id="password" type="password" name="password" placeholder={copy.newPassword} required /></div>
      <div className="grid gap-2"><Label htmlFor="confirmPassword">{copy.confirmPassword}</Label><Input id="confirmPassword" type="password" name="confirmPassword" placeholder={copy.confirmPassword} required /></div>
      <SubmitButton formAction={resetPasswordAction} pendingText={copy.resetting}>{copy.reset}</SubmitButton><FormMessage message={searchParams} />
    </form>
  </div>;
}
