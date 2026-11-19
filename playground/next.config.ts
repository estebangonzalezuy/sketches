import type { NextConfig } from "next";

// The repo root has its own lockfile (the Vite sketches site); pin this app's root.
const root = __dirname;

const nextConfig: NextConfig = {
  // Cache Components is off on purpose: prototypes are mostly client-side and agents
  // should not have to think about Suspense boundaries for Date.now() or Math.random().
  // Pages here are statically prerendered with the classic model.
  cacheComponents: false,
  outputFileTracingRoot: root,
  turbopack: {
    root,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
