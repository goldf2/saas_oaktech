import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n/messages";
import { isLocale, localePath } from "@/i18n/config";

export default async function LanguageGateway({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getMessages(locale).gateway;
  return <div className="container px-4 py-20"><p className="text-sm font-medium text-primary">{copy.eyebrow}</p><h1 className="mt-3 max-w-3xl text-5xl font-bold">{copy.title}</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{copy.description}</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild><Link href={localePath(locale, "/products/gitfinder-2")}>{copy.gitfinder}</Link></Button><Button asChild variant="outline"><Link href="/products">{copy.legacy}</Link></Button></div></div>;
}
