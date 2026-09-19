import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getRequestLanguage } from "@/i18n/server";
import { pageCopy } from "@/i18n/page-copy";

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getRequestLanguage();
  const copy = pageCopy(locale).privacy;
  return { title: `${copy.title} - OakTech`, description: locale === "zh" ? "OakTech 软件商店隐私政策。" : "Privacy policy for the OakTech software store." };
}

export default async function PrivacyPage() {
  const { locale } = await getRequestLanguage();
  const copy = pageCopy(locale).privacy;
  return (
    <div className="container px-4 py-16 md:py-24" data-page-locale={locale} data-testid="privacy-page">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">{copy.title}</h1>
        <p className="mb-8 text-sm text-muted-foreground">{copy.updated}</p>
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          {copy.sections.map(([title, paragraphs]) => <section key={title}>
            <h2 className="mb-2 text-xl font-semibold">{title}</h2>
            {paragraphs.map((paragraph, index) => <p key={index} className="text-muted-foreground">{paragraph}</p>)}
          </section>)}
          <section><p className="text-muted-foreground">Email: <Link href="mailto:support@oaktech.dev" className="text-primary hover:underline">support@oaktech.dev</Link></p></section>
        </div>
        <div className="mt-12 text-center"><Button asChild variant="outline"><Link href={locale === "zh" ? "/zh" : "/en"}>{copy.back}</Link></Button></div>
      </div>
    </div>
  );
}
