import type { NextConfig } from "next";

const supabaseHostname = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
      : "*.supabase.co";
  } catch {
    return "*.supabase.co";
  }
})();

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://${supabaseHostname} https://images.unsplash.com`,
  `connect-src 'self' https://${supabaseHostname} https://accounts.google.com https://oauth2.googleapis.com`,
  "font-src 'self'",
  "frame-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://accounts.google.com",
].join("; ");

const nextConfig: NextConfig = {
  serverExternalPackages: ["@google/genai"],
  devIndicators: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Content-Security-Policy", value: csp },
        ],
      },
    ];
  },
  outputFileTracingIncludes: {
    "/api/**": ["./server/config/brand-rules.csv"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHostname },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
