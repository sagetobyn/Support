import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  experimental: {
    cpus: 1,
    workerThreads: false,
    webpackBuildWorker: false,
    staticGenerationMinPagesPerWorker: 1000,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;