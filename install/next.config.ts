import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // NOTE: We intentionally do NOT define allowedDevOrigins here.
  // When allowedDevOrigins is undefined, Next.js runs in "warn" mode for cross-origin requests.
  // When defined (even if empty), it switches to "block" mode which is more restrictive.
  // See: node_modules/next/dist/esm/server/lib/router-utils/block-cross-site.js
  // Line: const mode = typeof allowedDevOrigins === 'undefined' ? 'warn' : 'block';
  experimental: {
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
};

export default nextConfig;
