import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  turbopack: {},
  output: isProd ? "standalone" : undefined,
  // Prod: proxy /api/* → backend container (not exposed to public)
  async rewrites() {
    if (!isProd) return [];
    return [
      {
        source: "/api/:path*",
        destination: "http://backend:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
