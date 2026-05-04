import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    cpus: 1,
    workerThreads: false,
    webpackBuildWorker: false,
    staticGenerationMinPagesPerWorker: 1000
  }
};

export default nextConfig;
