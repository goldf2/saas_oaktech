import { Logo } from "./logo";
import Link from "next/link";
import { Mail } from "lucide-react";
import packageJson from "@/package.json";

const footerLinks = [
  {
    title: "Browse",
    links: [
      { label: "All products", href: "/products" },
      { label: "Browser extensions", href: "/categories/browser-extensions" },
      { label: "X Tweet Extractor", href: "/products/x-tweet-extractor" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container px-4 py-8 md:py-12">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
          <div className="col-span-full lg:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">
              Independent software for focused work, from practical browser tools
              to future desktop and developer utilities.
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <a href="mailto:support@oaktech.dev" className="hover:text-primary transition-colors">
                support@oaktech.dev
              </a>
            </div>
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-4">
            {footerLinks.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <h3 className="text-sm font-medium">{group.title}</h3>
                <nav className="flex flex-col gap-2">
                  {group.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-1 border-t pt-8 text-center text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} OakTech. All rights reserved.</p>
          <p>Store v{packageJson.version}</p>
        </div>
      </div>
    </footer>
  );
}
