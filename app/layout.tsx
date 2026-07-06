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
  title: "OakTech - Premium Software Tools Store",
  description: "Buy premium software tools for developers, designers, and productivity. Browser extensions, desktop apps, and developer tools. Buy once, use forever.",
  keywords: "software store, browser extensions, desktop apps, developer tools, design tools, software license, OakTech",
  openGraph: {
    title: "OakTech - Premium Software Tools Store",
    description: "Buy premium software tools for developers, designers, and productivity. Browser extensions, desktop apps, and developer tools.",
    type: "website",
    url: baseUrl,
  },
  twitter: {
    card: "summary_large_image",
    title: "OakTech - Premium Software Tools Store",
    description: "Buy premium software tools for developers, designers, and productivity.",
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
