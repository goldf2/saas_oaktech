import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Code2, ShieldCheck, Target } from "lucide-react";
import { getRequestLanguage } from "@/i18n/server";
import { pageCopy } from "@/i18n/page-copy";

const icons = [Target, ShieldCheck, Code2];

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getRequestLanguage();
  const copy = pageCopy(locale).about;
  return { title: `${copy.title} - OakTech`, description: copy.description };
}

export default async function AboutPage() {
  const { locale } = await getRequestLanguage();
  const copy = pageCopy(locale).about;
  return (
    <div className="container px-4 py-16 md:py-24" data-page-locale={locale} data-testid="about-page">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">{copy.title}</h1>
        <p className="text-lg text-muted-foreground">{copy.description}</p>
      </div>
      <div className="mx-auto mb-16 grid max-w-5xl gap-8 md:grid-cols-3">
        {copy.cards.map(([title, desc], index) => {
          const Icon = icons[index];
          return <div key={title} className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"><Icon className="h-6 w-6 text-primary" /></div>
            <h2 className="mb-2 font-semibold">{title}</h2><p className="text-sm text-muted-foreground">{desc}</p>
          </div>;
        })}
      </div>
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="mb-4 text-2xl font-bold">{copy.sectionTitle}</h2>
        <p className="mb-6 text-muted-foreground">{copy.sectionText}</p>
        <Button asChild size="lg"><Link href={locale === "zh" ? "/zh" : "/en"}>{copy.action}</Link></Button>
      </div>
    </div>
  );
}
