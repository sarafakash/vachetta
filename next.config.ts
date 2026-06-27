import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "**" }] },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@farcaster/mini-app-solana": false,
      "@farcaster/miniapp-sdk": false,
      "@stripe/crypto": false,
      "@stripe/stripe-js": false,
    };
    return config;
  },
};

export default nextConfig;