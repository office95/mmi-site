import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname, // stellt sicher, dass .env.local im Projekt geladen wird
  },
  serverExternalPackages: ["nodemailer"],
  poweredByHeader: false,
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "naobgnbpvqgutxsaphci.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lxgjbiucuslfzjhgnwdc.supabase.co",
      },
    ],
  },
  async headers() {
    return [
      {
        // Root favicons (all variants we ship)
        source: "/(favicon|mmfavicon|mmfavicon-20260326|mmfavicon-20260327)\\.(ico|png|svg)",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        // Apple touch icons (versioned + default)
        source: "/(mmapple-touch-icon-20260326|mmapple-touch-icon-20260327|mmapple-touch-icon|apple-touch-icon)\\.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },
};

export default nextConfig;
