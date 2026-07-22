import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Code2, ShieldCheck, Target } from "lucide-react";

export const metadata = {
  title: "About - OakTech",
  description: "OakTech builds practical independent software for focused work.",
};

export default function AboutPage() {
  return (
    <div className="container px-4 py-16 md:py-24">
      <div className="mx-auto mb-16 max-w-3xl text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
          About OakTech
        </h1>
        <p className="text-lg text-muted-foreground">
          OakTech is an independent software studio building practical tools for
          focused work. Browser extensions are the first category, with desktop
          apps and developer tools planned next.
        </p>
      </div>

      <div className="mx-auto mb-16 grid max-w-5xl gap-8 md:grid-cols-3">
        {[
          {
            icon: Target,
            title: "Defined jobs",
            desc: "Each product begins with a clear workflow and stays focused on solving it well.",
          },
          {
            icon: ShieldCheck,
            title: "Transparent defaults",
            desc: "Permissions, data handling, and release status are explained before you install or buy.",
          },
          {
            icon: Code2,
            title: "Built to last",
            desc: "The catalogue will grow gradually across browser, desktop, and developer workflows.",
          },
        ].map((item) => (
          <div key={item.title} className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <item.icon className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mb-2 font-semibold">{item.title}</h2>
            <p className="text-sm text-muted-foreground">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <h2 className="mb-4 text-2xl font-bold">A small catalogue, deliberately built</h2>
        <p className="mb-6 text-muted-foreground">
          X Tweet Extractor is currently in beta. Its product page contains the
          current capabilities, installation route, and permission details.
        </p>
        <Button asChild size="lg">
          <Link href="/products/x-tweet-extractor">
            View X Tweet Extractor
          </Link>
        </Button>
      </div>
    </div>
  );
}
