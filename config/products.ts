export type ProductStatus = "beta" | "released" | "coming-soon";

export type ProductCategorySlug =
  | "browser-extensions"
  | "desktop-apps"
  | "developer-tools"
  | "ai-tools"
  | "productivity-tools";

export interface ProductPermission {
  name: string;
  description: string;
}

export interface SoftwareProduct {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  status: ProductStatus;
  category: string;
  categorySlug: ProductCategorySlug;
  price: string;
  license: string;
  icon: string;
  heroImage: string;
  screenshots: string[];
  features: string[];
  platforms: string[];
  browsers: string[];
  installSteps: string[];
  permissions: ProductPermission[];
  featured: boolean;
}

export interface ProductCategory {
  slug: ProductCategorySlug;
  name: string;
  description: string;
  icon: "Puzzle" | "Monitor" | "Code2" | "Sparkles" | "ListChecks";
  availability: "available" | "planned";
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    slug: "browser-extensions",
    name: "Browser Extensions",
    description: "Focused additions for everyday browser workflows.",
    icon: "Puzzle",
    availability: "available",
  },
  {
    slug: "desktop-apps",
    name: "Desktop Apps",
    description: "Native tools for macOS, Windows, and Linux.",
    icon: "Monitor",
    availability: "planned",
  },
  {
    slug: "developer-tools",
    name: "Developer Tools",
    description: "Practical utilities for building and debugging software.",
    icon: "Code2",
    availability: "planned",
  },
  {
    slug: "ai-tools",
    name: "AI Utilities",
    description: "Small, purposeful tools for AI-assisted work.",
    icon: "Sparkles",
    availability: "planned",
  },
  {
    slug: "productivity-tools",
    name: "Productivity Tools",
    description: "Less busywork and more control over repetitive tasks.",
    icon: "ListChecks",
    availability: "planned",
  },
];

export const PRODUCTS: SoftwareProduct[] = [
  {
    slug: "x-tweet-extractor",
    name: "X Tweet Extractor",
    tagline: "Turn visible X profiles into structured, local exports.",
    description:
      "A focused Chrome extension for extracting visible tweets from X (Twitter) user profiles and exporting structured text data for personal backup, research, and review.",
    status: "beta",
    category: "Browser Extension",
    categorySlug: "browser-extensions",
    price: "Free during beta",
    license: "Beta access",
    icon: "/x-tweet-extractor/store-logo-128.png",
    heroImage: "/x-tweet-extractor/promo440x280.png",
    screenshots: ["/x-tweet-extractor/screenshot1.png"],
    features: [
      "Extract up to 10,000 visible tweets per run",
      "Export JSON, CSV, TXT, HTML, or Markdown",
      "Limit results with optional start and end dates",
      "Stop extraction at any time and keep collected results",
      "Use the interface in 14 languages",
      "Process profile content locally in your browser",
    ],
    platforms: ["Chrome", "macOS", "Windows", "Linux"],
    browsers: ["Google Chrome"],
    installSteps: [
      "Request the current beta build from OakTech support.",
      "Open Chrome Extensions, enable Developer mode, and choose Load unpacked.",
      "Open an X user profile, launch the extension, and start the extraction.",
      "Choose an export format and save the collected data locally.",
    ],
    permissions: [
      {
        name: "activeTab",
        description: "Accesses the X page you are viewing after you launch the extension.",
      },
      {
        name: "scripting",
        description: "Runs the extraction logic on the active X profile page.",
      },
      {
        name: "storage",
        description: "Stores interface preferences such as your selected language.",
      },
      {
        name: "downloads",
        description: "Saves the export file you request to your computer.",
      },
      {
        name: "x.com / twitter.com",
        description: "Limits site access to the two domains where extraction works.",
      },
    ],
    featured: true,
  },
];

export function getProductBySlug(slug: string) {
  return PRODUCTS.find((product) => product.slug === slug);
}

export function getCategoryBySlug(slug: string) {
  return PRODUCT_CATEGORIES.find((category) => category.slug === slug);
}

export function getProductsByCategory(categorySlug: string) {
  return PRODUCTS.filter((product) => product.categorySlug === categorySlug);
}

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  beta: "Beta",
  released: "Released",
  "coming-soon": "Coming soon",
};
