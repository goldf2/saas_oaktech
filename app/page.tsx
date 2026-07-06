"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { PricingSection } from "@/components/pricing-section";
import { PRODUCTS } from "@/config/products";
import {
  Bookmark,
  Camera,
  Code,
  Palette,
  FileText,
  Wrench,
  Star,
  ArrowRight,
  Shield,
  Zap,
  Download,
  HeadphonesIcon,
  CheckCircle2,
} from "lucide-react";

const iconMap: Record<string, typeof Bookmark> = {
  BookmarkIcon: Bookmark,
  CameraIcon: Camera,
  CodeIcon: Code,
  PaletteIcon: Palette,
  FileTextIcon: FileText,
  WrenchIcon: Wrench,
};

export default function Home() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container px-4 py-20 md:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-4">
              Premium Software Tools Store
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Powerful tools for{" "}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                developers & creators
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Browse our catalog of premium browser extensions, desktop apps, and
              developer tools. Buy once, use forever. No subscriptions required.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="#products">
                  Browse Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#pricing">View Pricing</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why OakTech */}
      <section className="w-full py-16 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Why choose OakTech?
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
              We build software that just works. Every tool is crafted with care.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {[
              { icon: Zap, title: "Instant Delivery", desc: "Get your license key and download link immediately after purchase." },
              { icon: Shield, title: "Lifetime License", desc: "Buy once, own forever. Free updates included with every purchase." },
              { icon: Download, title: "Cross-Platform", desc: "Tools that work on macOS, Windows, Linux, and major browsers." },
              { icon: HeadphonesIcon, title: "Priority Support", desc: "Reach our support team at support@oaktech.dev anytime." },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 mb-2">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="w-full py-16">
        <div className="container px-4 md:px-6">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tight">
              Our Products
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
              Explore our collection of premium software tools.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {PRODUCTS.map((product, index) => {
              const Icon = iconMap[product.icon] || Wrench;
              return (
                <motion.div
                  key={product.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <Badge variant="secondary">{product.category}</Badge>
                      </div>
                      <CardTitle className="text-xl mt-3">{product.name}</CardTitle>
                      <CardDescription>{product.tagline}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="flex items-center gap-4 mb-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          {product.rating}
                        </span>
                        <span>{product.downloads} downloads</span>
                      </div>
                      <ul className="space-y-2">
                        {product.features.slice(0, 4).map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold">{product.price}</span>
                        <span className="text-sm text-muted-foreground ml-1">one-time</span>
                      </div>
                      <Button asChild size="sm">
                        <Link href={`/products/${product.slug}`}>
                          View Details
                          <ArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* CTA */}
      <section className="w-full py-16 bg-primary/5">
        <div className="container px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to upgrade your workflow?
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground text-lg mb-8">
            Join the community of developers and designers who trust OakTech tools.
          </p>
          <Button asChild size="lg">
            <Link href="#products">
              Browse All Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
