import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Download, Monitor } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMessages } from "@/i18n/messages";
import { localePath } from "@/i18n/config";
import type { Locale, ProductRelease, StoreDataSource, StoreProduct } from "@/lib/store/types";

function DownloadCard({ artifact, locale }: { artifact: ProductRelease["artifacts"][number]; locale: Locale }) {
  const copy = getMessages(locale).gitfinder;
  return (
    <article className="rounded-lg border bg-background p-6">
      <p className="text-sm font-medium text-primary">{artifact.architecture}</p>
      <h3 className="mt-1 text-2xl font-semibold">{artifact.platform}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{artifact.packageKind} · {(artifact.sizeBytes / 1024 / 1024).toFixed(1)} MB</p>
      <Button asChild className="mt-6 w-full"><a href={artifact.publicPath}>{copy.download} {artifact.platform}<Download className="ml-2 h-4 w-4" /></a></Button>
    </article>
  );
}

export function GitFinderProductPage({ product, locale, releases, source }: {
  product: StoreProduct;
  locale: Locale;
  releases: ProductRelease[];
  source: StoreDataSource;
}) {
  const copy = getMessages(locale).gitfinder;
  const current = releases.find((release) => release.isCurrent) ?? releases[0];
  const downloads = current?.artifacts.filter((artifact) => artifact.packageKind !== "blockmap") ?? [];
  const releaseHref = localePath(locale, "/products/gitfinder-2/releases");
  return (
    <>
      <section className="border-b"><div className="container grid gap-10 px-4 py-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <div className="flex items-center gap-4"><Image src={product.iconUrl} alt="" width={72} height={72} className="rounded-2xl" priority /><Badge variant="secondary">{copy.category}</Badge><Badge variant="outline">{copy.statusBeta}</Badge></div>
          <h1 className="mt-6 text-4xl font-bold md:text-6xl">{product.name}</h1>
          <p className="mt-5 text-xl leading-8 text-muted-foreground">{product.tagline || copy.tagline}</p>
          <p className="mt-4 leading-7 text-muted-foreground">{product.description || copy.description}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button asChild size="lg"><a href="#downloads">{copy.viewDownloads}<Download className="ml-2 h-4 w-4" /></a></Button><Button asChild size="lg" variant="outline"><Link href={releaseHref}>{copy.releaseNotes}</Link></Button></div>
          {source === "migration-fallback" && <p className="mt-5 rounded-md border border-amber-400/40 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-100">{copy.fallbackNotice}</p>}
          <div className="mt-7 grid grid-cols-3 gap-px overflow-hidden rounded-lg border bg-border"><div className="bg-background p-4"><p className="text-xs text-muted-foreground">{source === "catalog" ? copy.currentVersion : copy.legacyVersion}</p><p className="mt-1 font-semibold">{current?.version ?? "—"}</p></div><div className="bg-background p-4"><p className="text-xs text-muted-foreground">{copy.releaseChannel}</p><p className="mt-1 font-semibold">{current?.channel ?? "—"}</p></div><div className="bg-background p-4"><p className="text-xs text-muted-foreground">{copy.published}</p><p className="mt-1 font-semibold">{current?.publishedAt ? new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { dateStyle: "medium" }).format(new Date(current.publishedAt)) : "—"}</p></div></div>
        </div>
        <div className="overflow-hidden rounded-xl border bg-slate-950 shadow-xl"><Image src={product.heroImageUrl} alt="GitFinder 2" width={1440} height={900} priority className="h-auto w-full" /></div>
      </div></section>
      <section className="py-16"><div className="container px-4"><p className="text-sm font-medium text-primary">{copy.featuresEyebrow}</p><h2 className="mt-2 max-w-3xl text-3xl font-bold">{copy.featuresTitle}</h2><div className="mt-8 grid gap-px overflow-hidden rounded-lg border bg-border md:grid-cols-3">{copy.features.map((feature) => <div key={feature} className="bg-background p-6"><CheckCircle2 className="h-5 w-5 text-primary" /><p className="mt-4 text-sm leading-6">{feature}</p></div>)}</div></div></section>
      <section id="downloads" className="border-y bg-muted/35 py-16"><div className="container px-4"><p className="text-sm font-medium text-primary">{copy.downloadsEyebrow}</p><h2 className="mt-2 text-3xl font-bold">{copy.downloadsTitle}</h2><p className="mt-3 max-w-2xl text-muted-foreground">{copy.downloadsDescription}</p>{downloads.length ? <div className="mt-8 grid gap-5 md:grid-cols-2">{downloads.map((artifact) => <DownloadCard key={artifact.id} artifact={artifact} locale={locale} />)}</div> : <div className="mt-8 rounded-lg border bg-background p-8 text-center"><Monitor className="mx-auto h-6 w-6 text-muted-foreground" /><h3 className="mt-3 font-semibold">{copy.unavailable}</h3><p className="mt-2 text-sm text-muted-foreground">{copy.unavailableHelp}</p></div>}</div></section>
      <section className="py-16"><div className="container grid gap-8 px-4 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="text-sm font-medium text-primary">{copy.installation}</p><h2 className="mt-2 text-3xl font-bold">{copy.installationTitle}</h2><p className="mt-3 text-muted-foreground">{copy.installationDescription}</p></div><ol className="grid gap-4 sm:grid-cols-2">{copy.installSteps.map((step, index) => <li key={step} className="rounded-lg border p-5"><span className="font-semibold text-primary">0{index + 1}</span><p className="mt-3 text-sm leading-6">{step}</p></li>)}</ol></div></section>
      <section className="border-t py-16"><div className="container grid gap-8 px-4 lg:grid-cols-[0.7fr_1.3fr]"><div><p className="text-sm font-medium text-primary">{copy.questions}</p><h2 className="mt-2 text-3xl font-bold">{copy.questionsTitle}</h2></div><div className="divide-y border-y">{copy.faqs.map(([question, answer]) => <details key={question} className="py-5"><summary className="cursor-pointer font-medium">{question}</summary><p className="pt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div></div></section>
    </>
  );
}
