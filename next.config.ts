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
};

export default nextConfig;
