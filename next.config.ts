import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@google/genai"],
  devIndicators: false,
  outputFileTracingIncludes: {
    "/api/**": ["./server/config/brand-rules.csv"],
  },
};

export default nextConfig;
