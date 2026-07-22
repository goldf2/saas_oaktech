import Header from "@/components/header";
import { Footer } from "@/components/footer";
import { ThemeProvider } from "next-themes";
import { createClient } from "@/utils/supabase/server";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative min-h-screen">
            <Header user={user} />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
