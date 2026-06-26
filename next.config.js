/** @type {import('next').NextConfig} */
const scriptPolicy =
  process.env.NODE_ENV === 'development'
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com"
    : "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com";
const connectPolicy =
  process.env.NODE_ENV === 'development'
    ? "connect-src 'self' http://127.0.0.1:54321 ws://127.0.0.1:54321 https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.ingest.sentry.io"
    : "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.google-analytics.com https://*.ingest.sentry.io";

const nextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  outputFileTracingRoot: __dirname,

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },

  // Security headers + Performance headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "object-src 'none'",
              scriptPolicy,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com",
              "font-src 'self' data:",
              connectPolicy,
              'upgrade-insecure-requests',
            ].join('; '),
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Cache images
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, must-revalidate',
          },
        ],
      },
    ];
  },

  // Redirect HTTP to HTTPS in production
  async redirects() {
    return [];
  },

  // Webpack optimization - simplified for compatibility
  webpack: (config) => {
    return config;
  },

  // Experimental optimizations
  experimental: {
    optimizePackageImports: ['@radix-ui/react-dialog', 'lucide-react', '@supabase/supabase-js'],
  },

  // Production source maps disabled for smaller bundle
  productionBrowserSourceMaps: false,
};

module.exports = nextConfig;
