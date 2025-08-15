import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Exclude backend directory from Next.js compilation
  outputFileTracingExcludes: {
    '*': ['./backend/**/*'],
  },
  // Exclude backend from webpack compilation
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/backend/**', '**/node_modules'],
    }
    return config
  },
};

export default nextConfig;
