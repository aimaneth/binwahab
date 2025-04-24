const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false,
  compress: true,
  
  // Standalone output for better deployment
  output: 'standalone',
  
  // Experimental features for performance
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Font optimization
  optimizeFonts: true,
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'binwahab.vercel.app',
      'koupyrvfvczzkolwvwnc.supabase.co',
      'uploadthing.com',
      'utfs.io',
      'res.cloudinary.com',
      'images.unsplash.com',
      'ufs.sh'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://api.stripe.com https://m.stripe.network https://fonts.googleapis.com https://fonts.gstatic.com https://*.uploadthing.com https://*.utfs.io https://vitals.vercel-analytics.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.stripe.com https://*.stripe.network https://stripe-camo.global.ssl.fastly.net https://*.uploadthing.com https://*.utfs.io https://*.ufs.sh https://images.unsplash.com https://*.vercel.app; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; worker-src 'self' blob:;",
    minimumCacheTTL: 60,
    formats: ['image/avif', 'image/webp'],
  },

  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://api.stripe.com https://m.stripe.network https://fonts.googleapis.com https://fonts.gstatic.com https://*.uploadthing.com https://*.utfs.io https://vitals.vercel-analytics.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.stripe.com https://*.stripe.network https://stripe-camo.global.ssl.fastly.net https://*.uploadthing.com https://*.utfs.io https://*.ufs.sh https://images.unsplash.com https://*.vercel.app; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; worker-src 'self' blob:;"
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-site'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store' }
        ]
      }
    ];
  }
};

module.exports = withBundleAnalyzer(nextConfig); 