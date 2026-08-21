import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained server bundle (.next/standalone) —
  // the only Docker-friendly output mode; without it the runtime image
  // would need the full node_modules tree instead of just what's traced.
  output: "standalone",
};

export default nextConfig;
