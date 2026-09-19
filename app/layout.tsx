import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "next-themes";
import { authProvider, getCurrentUser } from "@/lib/auth";
import { getStoreAdmin } from "@/lib/store/admin";
import { Toaster } from "@/components/ui/toaster";
import { getRequestLanguage } from "@/i18n/server";
import { LocaleProvider } from "@/i18n/locale-provider";
import "./globals.css";
import "./storefront.css";

const baseUrl = process.env.BASE_URL
  ? `${process.env.BASE_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: "OakTech - Independent Software Store",
  description: "Practical browser extensions, desktop apps, and developer tools with clear release status and direct support.",
  keywords: "OakTech, software store, browser extensions, desktop apps, developer tools, X Tweet Extractor",
  openGraph: {
    title: "OakTech - Independent Software Store",
    description: "Practical browser extensions, desktop apps, and developer tools with clear release status and direct support.",
    type: "website",
    url: baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "OakTech - Independent Software Store",
    description: "Practical browser extensions, desktop apps, and developer tools.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const admin = user ? await getStoreAdmin() : null;
  const language = await getRequestLanguage();

  return (
    <html lang={language.locale === "zh" ? "zh-CN" : "en"} suppressHydrationWarning>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider initialLocale={language.defaultLocale} initialPreference={language.preference}>
          <div className="relative min-h-screen">
            <Header user={user} authProvider={authProvider} isAdmin={Boolean(admin)} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
