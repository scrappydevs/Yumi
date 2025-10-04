import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Image optimization for external images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
    ],
    // Optimize images for production
    formats: ['image/avif', 'image/webp'],
  },
  
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Disable powered by header for security
  poweredByHeader: false,
};

export default nextConfig;
