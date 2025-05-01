import type { Metadata } from "next";
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
import { CartProvider } from "@/contexts/cart-context";
import { fontSans } from "@/lib/fonts";
import { measureWebVitals } from "@/lib/performance";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import OptimizedLayout from "@/components/layout/optimized-layout";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://binwahab.com"),
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/safari-pinned-tab.svg',
        color: '#000000'
      }
    ]
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "BINWAHAB - Malaysian Traditional Fashion",
    description: "Discover elegant baju melayu, kurta, and kebaya designs",
    siteName: "BINWAHAB",
    images: [
      {
        url: '/social/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BINWAHAB - Malaysian Traditional Fashion'
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BINWAHAB - Malaysian Traditional Fashion",
    description: "Discover elegant baju melayu, kurta, and kebaya designs",
    images: ['/social/twitter-image.jpg']
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://api.stripe.com https://api.razorpay.com https://lumberjack.razorpay.com https://m.stripe.network https://fonts.googleapis.com https://fonts.gstatic.com https://*.uploadthing.com https://*.utfs.io https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.stripe.com https://*.stripe.network https://stripe-camo.global.ssl.fastly.net https://*.uploadthing.com https://*.utfs.io https://*.ufs.sh https://www.googletagmanager.com https://www.google-analytics.com https://images.unsplash.com https://binwahab.com https://*.supabase.co; frame-src 'self' https://js.stripe.com https://checkout.razorpay.com https://api.razorpay.com https://hooks.stripe.com https://*.razorpay.com; worker-src 'self' blob:;"
          httpEquiv="Content-Security-Policy"
        />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", fontSans.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
          <SessionProvider session={session}>
            <CartProvider>
              <OptimizedLayout>
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </OptimizedLayout>
            </CartProvider>
          </SessionProvider>
          <Toaster />
        </ThemeProvider>

        {/* Analytics */}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
