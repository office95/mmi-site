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
        source: "/:favicon(favicon|mmfavicon|mmfavicon-20260326)\\.(ico|png|svg)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/:apple(mmapple-touch-icon|apple-touch-icon)-:v(20260326)?\\.(png)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
