import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive"
          }
        ]
      },
      {
        source: "/analytics/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive"
          }
        ]
      },
      {
        source: "/generated/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "index, follow"
          }
        ]
      },
      ...[
        "/brush-the-algorithm",
        "/doomscroll-dodge",
        "/doomscroll-market",
        "/meme-market"
      ].map((source) => ({
        source,
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive"
          }
        ]
      })),
      {
        source: "/:path((?!api/|analytics|_next/|.*\\..*).*)",
        headers: [
          {
            key: "X-Robots-Tag",
            value:
              "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
          }
        ]
      }
    ];
  },
  images: {
    deviceSizes: [384, 640, 750, 828, 1080, 1200],
    imageSizes: [64, 128, 220, 256, 384],
    qualities: [65, 75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  experimental: {
    optimizePackageImports: ["@supabase/supabase-js", "openai"]
  }
};

export default nextConfig;
