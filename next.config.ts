import type { NextConfig } from "next";

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
    ],
  },
};

export default nextConfig;