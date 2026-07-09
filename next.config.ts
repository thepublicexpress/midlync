import type { NextConfig } from "next";

const r2PublicUrl = process.env.R2_PUBLIC_URL_BASE || process.env.R2_PUBLIC_URL
const r2Hostname = r2PublicUrl ? new URL(r2PublicUrl).hostname : null

const nextConfig: NextConfig = {
  // ❌ eslint सेक्शन पूरी तरह हटा दिया गया है
  // अब ESLint को अलग कॉन्फ़िग फ़ाइल (eslint.config.mjs) में manage करें

  typescript: {
    ignoreBuildErrors: true,   // ✅ TypeScript errors को ignore करना है तो रखें
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'grsapzroyfcueysrmedk.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      ...(r2Hostname
        ? [{
            protocol: 'https' as const,
            hostname: r2Hostname,
            port: '',
            pathname: '/**',
          }]
        : []),
    ],
  },
};

export default nextConfig;