import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained server bundle (.next/standalone) —
  // the only Docker-friendly output mode; without it the runtime image
  // would need the full node_modules tree instead of just what's traced.
  output: "standalone",
  // Fix warning about package-lock outside repo (C:\Users\akash)
  turbopack: { root: process.cwd() } as unknown as NextConfig["turbopack"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" },
        ],
      },
    ];
  },
  images: { unoptimized: false },
};

export default nextConfig;
