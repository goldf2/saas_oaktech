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

export interface ProductFaq {
  question: string;
  answer: string;
}

export interface ProductReleaseNote {
  label: string;
  title: string;
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
  faqs: ProductFaq[];
  releaseNotes: ProductReleaseNote[];
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
      "Export JSON, CSV, TXT, HTML, Markdown, or media URL CSV",
      "Download visible tweet images, video thumbnails, and direct MP4 media when exposed by X/Twitter",
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
        name: "scripting",
        description: "Runs the local extraction script on x.com and twitter.com pages selected by you.",
      },
      {
        name: "storage",
        description: "Stores interface preferences such as your selected language and future local license state.",
      },
      {
        name: "downloads",
        description: "Saves exported files, media URL lists, and user-triggered media downloads to your computer.",
      },
      {
        name: "x.com / twitter.com",
        description: "Limits extension access and extraction logic to X/Twitter pages selected by you.",
      },
    ],
    faqs: [
      {
        question: "Does the extension upload tweet data?",
        answer:
          "No. Extraction runs in the browser on the X/Twitter page you open, and exports are saved to your computer. The extension does not upload extracted tweet text, media URLs, or media files to an OakTech service.",
      },
      {
        question: "Do I need an account during beta?",
        answer:
          "No account is required to run the current beta build. Contact OakTech to request the build and installation instructions.",
      },
      {
        question: "Which export formats are supported?",
        answer:
          "The current beta exports JSON, CSV, TXT, HTML, Markdown, and media URL CSV files. User-triggered media downloads can save visible tweet images, video thumbnails, and direct MP4 files when X/Twitter exposes downloadable video.twimg.com media URLs; HLS playlist URLs are not included.",
      },
      {
        question: "What happens when an extraction is stopped?",
        answer:
          "You can stop a run at any time. Tweets collected before stopping remain available for export.",
      },
    ],
    releaseNotes: [
      {
        label: "Current beta",
        title: "Profile extraction and local exports",
        description:
          "The current build extracts visible X profile posts, supports optional date limits, and exports the collected data in five formats.",
      },
      {
        label: "Next",
        title: "Public store release preparation",
        description:
          "OakTech is preparing the Chrome Web Store listing and collecting beta feedback before public distribution.",
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
