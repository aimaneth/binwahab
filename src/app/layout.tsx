import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SessionProvider } from "@/components/providers/session-provider";
import { Navbar } from "@/components/ui/navbar";
import { Footer } from "@/components/ui/footer";
import { Toaster } from "@/components/ui/toaster";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/lib/uploadthing";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { fontSans } from "@/lib/fonts";
import { measureWebVitals } from "@/lib/performance";
import Script from "next/script";
import { scriptLoadingConfig } from "@/lib/performance";
import OptimizedLayout from "@/components/layout/optimized-layout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-sans",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const metadata: Metadata = {
  title: "BINWAHAB - Malaysian Traditional Fashion",
  description: "Discover elegant baju melayu, kurta, and kebaya designs",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://binwahab.vercel.app"),
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "BINWAHAB - Malaysian Traditional Fashion",
    description: "Discover elegant baju melayu, kurta, and kebaya designs",
    siteName: "BINWAHAB",
  },
  twitter: {
    card: "summary_large_image",
    title: "BINWAHAB - Malaysian Traditional Fashion",
    description: "Discover elegant baju melayu, kurta, and kebaya designs",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <SessionProvider session={session}>
            <OptimizedLayout>
              <div className="min-h-screen flex flex-col">
                <Navbar />
                <main className="flex-1">{children}</main>
                <Footer />
              </div>
            </OptimizedLayout>
          </SessionProvider>
          <Toaster />
        </ThemeProvider>

        {/* Analytics script with performance optimization */}
        <Script
          src="https://www.googletagmanager.com/gtag/js"
          strategy={scriptLoadingConfig.analytics.strategy}
          defer={scriptLoadingConfig.analytics.defer}
        />
      </body>
    </html>
  );
}
