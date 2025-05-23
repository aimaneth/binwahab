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
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
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
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com; script-src-elem 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com; connect-src 'self' https://api.stripe.com https://api.razorpay.com https://lumberjack.razorpay.com https://m.stripe.network https://fonts.googleapis.com https://fonts.gstatic.com https://*.uploadthing.com https://*.utfs.io https://vitals.vercel-analytics.com https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://*.razorpay.com https://vitals.vercel-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://*.stripe.com https://*.stripe.network https://stripe-camo.global.ssl.fastly.net https://*.uploadthing.com https://*.utfs.io https://*.ufs.sh https://images.unsplash.com https://binwahab.com; frame-src 'self' https://js.stripe.com https://checkout.razorpay.com https://api.razorpay.com https://hooks.stripe.com https://*.razorpay.com; worker-src 'self' blob:;",
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
            key: 'Cross-Origin-Opener-Policy',
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
          { key: 'Cache-Control', value: 'no-store' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, next-action' }
        ]
      },
      {
        source: '/shop/confirmation',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, next-action' },
          { key: 'Referrer-Policy', value: 'no-referrer-when-downgrade' }
        ]
      }
    ];
  },

  // Webpack optimizations
  webpack: (config, { dev, isServer, webpack }) => {
    // Fix "self is not defined" error
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      };

      // Exclude problematic packages from server bundle
      config.externals = config.externals || [];
      config.externals.push({
        canvas: 'canvas',
        'utf-8-validate': 'utf-8-validate',
        'bufferutil': 'bufferutil',
        'supports-color': 'supports-color',
      });
    }

    // Add proper global definitions
    config.plugins.push(
      new webpack.DefinePlugin({
        __SERVER__: isServer,
        __BROWSER__: !isServer,
        'process.browser': !isServer,
      })
    );

    // Properly handle browser globals
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Production optimizations with proper browser/server separation
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: isServer
          ? false // Disable split chunks for server build
          : {
              chunks: 'all',
              cacheGroups: {
                // Only create vendor chunks for browser build
                vendor: {
                  test: /[\\/]node_modules[\\/]/,
                  name: 'vendors',
                  priority: 10,
                  chunks: 'all',
                  // Exclude server-only packages from browser bundle
                  enforce: true,
                },
                common: {
                  name: 'common',
                  minChunks: 2,
                  priority: 5,
                  chunks: 'all',
                  enforce: true,
                },
                // Separate chunk for performance monitoring
                performance: {
                  test: /[\\/]node_modules[\\/](web-vitals|@vercel\/analytics)[\\/]/,
                  name: 'performance',
                  priority: 15,
                  chunks: 'all',
                },
              },
            },
      };
    }

    // Bundle analyzer in development
    if (dev && !isServer) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'disabled',
          generateStatsFile: true,
        })
      );
    }

    return config;
  }
};

module.exports = withBundleAnalyzer(nextConfig); 