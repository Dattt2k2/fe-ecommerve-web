import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'go-ecom1.s3.ap-southeast-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.s3.ap-southeast-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '**.s3.*.amazonaws.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
      },
    ],
    // Allow all domains temporarily for debugging
    unoptimized: process.env.NODE_ENV === 'development',
  },
  async rewrites() {
    return [
      {
        source: '/me/:path*',
        destination: 'http://api.example.com/me/:path*',
      },
      // Removed /products rewrite - using /api/proxy/products instead
      // This allows /products/[id] to render as a Next.js page
      {
        source: '/cart/:path*',
        destination: 'http://api.example.com/cart/:path*',
      },
      {
        source: '/orders/:path*',
        destination: 'http://api.example.com/orders/:path*',
      },
      {
        source: '/auth/:path*',
        destination: 'http://api.example.com/auth/:path*',
      },
      {
        source: '/upload/:path*',
        destination: 'http://api.example.com/upload/:path*',
      },
      {
        source: '/search/:path*',
        destination: 'http://api.example.com/search/:path*',
      }
    ];
  },
};

export default nextConfig;
