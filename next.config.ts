import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Experimental features off karo taaki production stable rahe
  cacheComponents: false,
  partialPrefetching: false,
  
  // Turbopack config (agar use kar rahe ho toh)
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;