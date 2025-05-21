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
    // Allow server actions from Razorpay/Curlec domains
    serverActions: {
      allowedOrigins: [
        // Host domains
        'localhost:3000',
        'binwahab.com',
        'www.binwahab.com',
        
        // Razorpay/Curlec domains
        'api.razorpay.com',
        'checkout.razorpay.com',
        'razorpay.com',
        'nice.checkplus.co.kr',
        
        // Add any other domains that might redirect to your site
        'api.curlec.com',
        'checkout.curlec.com',
        'curlec.com'
      ],
      allowedForwardedHosts: [
        // Host domains
        'localhost:3000',
        'binwahab.com',
        'www.binwahab.com',
        
        // Razorpay/Curlec domains
        'api.razorpay.com',
        'checkout.razorpay.com',
        'razorpay.com',
        'nice.checkplus.co.kr',
        
        // Add any other domains that might redirect to your site
        'api.curlec.com',
        'checkout.curlec.com',
        'curlec.com'
      ],
    },
  },
  
  // Font optimization
  optimizeFonts: true,
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'binwahab.com',
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
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://api.stripe.com https://api.razorpay.com https://lumberjack.razorpay.com https://m.stripe.network https://fonts.googleapis.com https://fonts.gstatic.com https://*.uploadthing.com https://*.utfs.io https://vitals.vercel-analytics.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.razorpay.com https://vitals.vercel-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.stripe.com https://*.stripe.network https://stripe-camo.global.ssl.fastly.net https://*.uploadthing.com https://*.utfs.io https://*.ufs.sh https://images.unsplash.com https://binwahab.com; frame-src 'self' https://js.stripe.com https://checkout.razorpay.com https://api.razorpay.com https://hooks.stripe.com https://*.razorpay.com; worker-src 'self' blob:;",
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
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://api.stripe.com https://api.razorpay.com https://lumberjack.razorpay.com https://m.stripe.network https://fonts.googleapis.com https://fonts.gstatic.com https://*.uploadthing.com https://*.utfs.io https://vitals.vercel-analytics.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.razorpay.com https://vitals.vercel-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.stripe.com https://*.stripe.network https://stripe-camo.global.ssl.fastly.net https://*.uploadthing.com https://*.utfs.io https://*.ufs.sh https://images.unsplash.com https://binwahab.com; frame-src 'self' https://js.stripe.com https://checkout.razorpay.com https://api.razorpay.com https://hooks.stripe.com https://*.razorpay.com; worker-src 'self' blob:;"
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin'
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