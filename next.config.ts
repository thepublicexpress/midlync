import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,  // ✅ Skip ESLint during build
  },
  typescript: {
    ignoreBuildErrors: true,   // ✅ Skip TypeScript errors during build
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'grsapzroyfcueysrmedk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;