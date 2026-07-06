import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Target, Rocket, Shield, Lightbulb, Users, Heart } from "lucide-react";

export const metadata = {
  title: "About - OakTech",
  description: "Learn about OakTech, a software company building premium tools for developers and designers.",
};

export default function AboutPage() {
  return (
    <div className="container px-4 py-16 md:py-24">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
          About OakTech
        </h1>
        <p className="text-lg text-muted-foreground">
          We build premium software tools that make developers, designers, and
          everyday users more productive. No subscriptions, no bloatware — just
          great software you own forever.
        </p>
      </div>

      {/* Mission */}
      <div className="grid gap-12 lg:grid-cols-2 max-w-5xl mx-auto mb-16">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Our Mission</h2>
          </div>
          <p className="text-muted-foreground">
            To create high-quality software tools that are affordable, reliable,
            and built to last. We believe great software shouldn&apos;t require a
            monthly subscription — you should be able to buy it once and own it
            forever.
          </p>
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Lightbulb className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Our Vision</h2>
          </div>
          <p className="text-muted-foreground">
            A world where developers and creators have access to powerful,
            well-crafted tools without the burden of endless subscriptions. We
            envision a sustainable software ecosystem built on trust and quality.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="max-w-5xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Our Values</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Shield, title: "Quality First", desc: "Every tool is rigorously tested and polished before release." },
            { icon: Users, title: "User-Centric", desc: "We listen to our community and build what users actually need." },
            { icon: Heart, title: "Fair Pricing", desc: "One-time payments with lifetime updates. No hidden costs." },
          ].map((value) => (
            <div key={value.title} className="text-center">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mx-auto mb-4">
                <value.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{value.title}</h3>
              <p className="text-sm text-muted-foreground">{value.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Story */}
      <div className="max-w-3xl mx-auto mb-16">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <Rocket className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Our Story</h2>
        </div>
        <p className="text-muted-foreground mb-4">
          OakTech was founded by a team of developers and designers who were tired
          of the subscription-everything model. We wanted to build software the
          old-fashioned way: craft a great product, charge a fair price, and let
          users own it.
        </p>
        <p className="text-muted-foreground mb-4">
          Starting with our first browser extension, Tab Saver Pro, we&apos;ve
          grown our catalog to include developer tools, design utilities, and
          productivity apps. Every product is built in-house and backed by our
          commitment to quality and customer support.
        </p>
        <p className="text-muted-foreground">
          Today, OakTech tools are used by developers and designers worldwide. We
          continue to expand our catalog while maintaining the principles that
          got us here.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Ready to explore our tools?</h2>
        <p className="text-muted-foreground mb-6">
          Browse our catalog and find the perfect tool for your workflow.
        </p>
        <Button asChild size="lg">
          <Link href="/#products">View Products</Link>
        </Button>
      </div>
    </div>
  );
}
