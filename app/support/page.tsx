import Link from "next/link";
import { Mail, MessageSquareText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Support - OakTech",
  description: "Get help with OakTech products, beta access, licenses, and privacy questions.",
};

export default function SupportPage() {
  return (
    <div className="container px-4 py-14 md:py-20">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-primary">OakTech support</p>
        <h1 className="mt-2 text-4xl font-bold tracking-normal md:text-5xl">Get product help directly.</h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">
          Contact support for beta access, installation help, product feedback, or questions about data handling.
        </p>
      </div>
      <div className="mt-12 grid gap-8 border-y py-10 md:grid-cols-3">
        <div>
          <Mail className="h-6 w-6" />
          <h2 className="mt-4 font-semibold">Product support</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Ask about installation, account access, or an active beta build.</p>
        </div>
        <div>
          <MessageSquareText className="h-6 w-6" />
          <h2 className="mt-4 font-semibold">Feedback</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Share an edge case, workflow need, or idea for a future product.</p>
        </div>
        <div>
          <ShieldCheck className="h-6 w-6" />
          <h2 className="mt-4 font-semibold">Privacy questions</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">We can explain what a product accesses and where your data is processed.</p>
        </div>
      </div>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg"><Link href="mailto:support@oaktech.dev">Email support</Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/products/x-tweet-extractor">View X Tweet Extractor</Link></Button>
      </div>
    </div>
  );
}
