export interface SoftwareProduct {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: "Browser Extension" | "Desktop App" | "Developer Tool" | "Design Tool";
  price: string;
  priceValue: number;
  license: "Personal" | "Pro" | "Team";
  icon: string;
  features: string[];
  platforms: string[];
  featured: boolean;
  rating: number;
  downloads: string;
}

export const PRODUCTS: SoftwareProduct[] = [
  {
    slug: "tab-saver-pro",
    name: "Tab Saver Pro",
    tagline: "Save, organize, and restore browser tabs effortlessly",
    description:
      "A powerful browser extension that lets you save your open tabs into sessions, restore them anytime, and sync across devices. Never lose your workflow again.",
    category: "Browser Extension",
    price: "$9",
    priceValue: 9,
    license: "Pro",
    icon: "BookmarkIcon",
    features: [
      "Unlimited tab sessions",
      "Cross-device sync",
      "One-click session restore",
      "Smart tab grouping",
      "Cloud backup",
      "Works with Chrome, Edge & Firefox",
    ],
    platforms: ["Chrome", "Edge", "Firefox"],
    featured: true,
    rating: 4.9,
    downloads: "12k+",
  },
  {
    slug: "screen-capture-studio",
    name: "Screen Capture Studio",
    tagline: "Capture, annotate, and share screenshots in seconds",
    description:
      "A full-featured screen capture tool for macOS and Windows. Capture regions, windows, or full screens, annotate with a rich toolkit, and share instantly.",
    category: "Desktop App",
    price: "$15",
    priceValue: 15,
    license: "Pro",
    icon: "CameraIcon",
    features: [
      "Region, window & full-screen capture",
      "Scrolling screenshot support",
      "Rich annotation tools",
      "Cloud sharing with links",
      "GIF & video recording",
      "OCR text extraction",
    ],
    platforms: ["macOS", "Windows"],
    featured: true,
    rating: 4.8,
    downloads: "8.5k+",
  },
  {
    slug: "json-studio",
    name: "JSON Studio",
    tagline: "The ultimate API testing and JSON visualization tool",
    description:
      "A developer-focused desktop app for API testing, JSON formatting, and data visualization. Built for speed with a clean, intuitive interface.",
    category: "Developer Tool",
    price: "$29",
    priceValue: 29,
    license: "Pro",
    icon: "CodeIcon",
    features: [
      "API request builder (GET, POST, PUT, DELETE)",
      "JSON tree visualization",
      "Schema validation & generation",
      "Environment variables",
      "Request history & collections",
      "Export to cURL & code snippets",
    ],
    platforms: ["macOS", "Windows", "Linux"],
    featured: true,
    rating: 4.9,
    downloads: "5.2k+",
  },
  {
    slug: "color-picker-plus",
    name: "Color Picker+",
    tagline: "Pick, manage, and export colors with ease",
    description:
      "A designer's best friend. Pick any color from your screen, build palettes, and export to your favorite formats. Available as a browser extension and desktop app.",
    category: "Design Tool",
    price: "$7",
    priceValue: 7,
    license: "Pro",
    icon: "PaletteIcon",
    features: [
      "Pixel-perfect screen color picker",
      "Palette generator & manager",
      "Export to HEX, RGB, HSL, Tailwind",
      "Contrast checker (WCAG)",
      "Gradient builder",
      "Color history & favorites",
    ],
    platforms: ["Chrome", "macOS", "Windows"],
    featured: false,
    rating: 4.7,
    downloads: "15k+",
  },
  {
    slug: "markdown-pro",
    name: "Markdown Pro",
    tagline: "Write beautiful documents with a powerful Markdown editor",
    description:
      "A clean, distraction-free Markdown editor with live preview, syntax highlighting, and export to PDF, HTML, and DOCX. Perfect for writers and developers.",
    category: "Desktop App",
    price: "$12",
    priceValue: 12,
    license: "Pro",
    icon: "FileTextIcon",
    features: [
      "Live preview with syntax highlighting",
      "Export to PDF, HTML & DOCX",
      "Dark & light themes",
      "Mermaid diagram support",
      "Math equation rendering",
      "Git-backed document sync",
    ],
    platforms: ["macOS", "Windows", "Linux"],
    featured: false,
    rating: 4.8,
    downloads: "6.8k+",
  },
  {
    slug: "devtools-bundle",
    name: "DevTools Bundle",
    tagline: "A complete toolkit for modern developers",
    description:
      "Get all five OakTech developer tools in one bundle: JSON Studio, Color Picker+, Markdown Pro, plus exclusive access to the Regex Tester and Base64 Toolkit. Best value for developers.",
    category: "Developer Tool",
    price: "$49",
    priceValue: 49,
    license: "Team",
    icon: "WrenchIcon",
    features: [
      "Includes JSON Studio",
      "Includes Color Picker+",
      "Includes Markdown Pro",
      "Regex Tester & Debugger",
      "Base64 Encode/Decode Toolkit",
      "Lifetime updates for all tools",
      "Up to 5 team members",
      "Priority support",
    ],
    platforms: ["macOS", "Windows", "Linux"],
    featured: false,
    rating: 5.0,
    downloads: "3.1k+",
  },
];

export function getProductBySlug(slug: string): SoftwareProduct | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export const PRODUCT_CATEGORIES = [
  "All",
  "Browser Extension",
  "Desktop App",
  "Developer Tool",
  "Design Tool",
] as const;
