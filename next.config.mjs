import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: projectRoot
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
