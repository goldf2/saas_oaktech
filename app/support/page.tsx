import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRequestLanguage } from "@/i18n/server";
import { pageCopy } from "@/i18n/page-copy";

const icons = [Mail, MessageSquareText, ShieldCheck];

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getRequestLanguage();
  const copy = pageCopy(locale).support;
  return { title: `${locale === "zh" ? "支持" : "Support"} - OakTech`, description: copy.description };
}

export default async function SupportPage() {
  const { locale } = await getRequestLanguage();
  const copy = pageCopy(locale).support;
  return (
    <div className="container px-4 py-14 md:py-20" data-page-locale={locale} data-testid="support-page">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">{copy.eyebrow}</p>
        <h1 className="mt-2 text-4xl font-bold tracking-normal md:text-5xl">{copy.title}</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{copy.description}</p>
      </div>
      <div className="mt-12 grid gap-8 border-y py-10 md:grid-cols-3">
        {copy.cards.map(([title, description], index) => {
          const Icon = icons[index];
          return <div key={title}><Icon className="h-6 w-6" /><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></div>;
        })}
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg"><Link href="mailto:support@oaktech.dev">{copy.email}</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href={locale === "zh" ? "/zh" : "/en"}>{copy.products}</Link></Button>
      </div>
    </div>
  );
}
